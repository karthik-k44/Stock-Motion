import { BadRequest, Conflict, NotFound } from '@/backend/common/errors';
import { RecordActivity, RecordMovement } from '@/backend/common/services/audit';
import { ToIso } from '@/backend/common/utils/dates';
import { db, type Queryable } from '@/backend/db/client';
import type { OrderLineRow, OrderRow } from '@/backend/db/schema';
import { BroadcastChange } from '@/backend/realtime/socket';
import { ActivityKindTypeEnum, ActivityRefTypeEnum, type ActivityResponseType } from '@/backend/types/activity';
import { ResourceTypeEnum } from '@/backend/types/dashboard';
import { MovementTypeEnum } from '@/backend/types/item';
import { OrderStatusTypeEnum, type OrderResponseType } from '@/backend/types/order';
import type { UserResponseType } from '@/backend/types/user';
import type { ListOrdersQuery, UpdateOrderInput } from './orders.validators';

const STATUS_LABEL: Record<OrderStatusTypeEnum, string> = { NEW: 'New', PICKING: 'Picking', PACKED: 'Packed', SHIPPED: 'Shipped' };
const ALL_RESOURCES = [
  ResourceTypeEnum.ORDERS, ResourceTypeEnum.ITEMS, ResourceTypeEnum.LOCATIONS, ResourceTypeEnum.DASHBOARD, ResourceTypeEnum.ACTIVITY,
];

async function load(q: Queryable, where = '', params: unknown[] = []): Promise<OrderResponseType[]> {
  const { rows: orders } = await q.query<OrderRow>(
    `SELECT * FROM orders ${where} ORDER BY CASE status WHEN 'SHIPPED' THEN 1 ELSE 0 END, requested_date`,
    params,
  );
  if (!orders.length) return [];
  const { rows: lines } = await q.query<OrderLineRow>(
    `SELECT ol.order_id, ol.sku, i.name, i.location, ol.qty, ol.picked
     FROM order_lines ol JOIN items i ON i.sku = ol.sku
     WHERE ol.order_id = ANY($1) ORDER BY ol.position`,
    [orders.map((o) => o.id)],
  );
  return orders.map((o) => {
    const own = lines.filter((l) => l.order_id === o.id);
    return {
      id: o.id,
      customer: o.customer,
      requestedDate: ToIso(o.requested_date),
      createdAt: ToIso(o.created_at),
      status: o.status as OrderStatusTypeEnum,
      assignee: o.assignee,
      lines: own.map((l) => ({ sku: l.sku, name: l.name, location: l.location, qty: l.qty, picked: l.picked })),
      totalUnits: own.reduce((s, l) => s + l.qty, 0),
      pickedUnits: own.reduce((s, l) => s + l.picked, 0),
    };
  });
}

async function lockOrder(tx: Queryable, id: string, expected: OrderStatusTypeEnum, action: string): Promise<OrderResponseType> {
  await tx.query('SELECT id FROM orders WHERE id = $1 FOR UPDATE', [id]);
  const [order] = await load(tx, 'WHERE id = $1', [id]);
  if (!order) throw NotFound('Order', id);
  if (order.status !== expected) {
    throw Conflict(`${id} is ${STATUS_LABEL[order.status]} — only ${STATUS_LABEL[expected]} orders can be ${action}`);
  }
  return order;
}

/** Run a state change in a transaction, then broadcast and return the fresh order. */
async function mutate(id: string, fn: (tx: Queryable) => Promise<ActivityResponseType[]>): Promise<OrderResponseType> {
  const { order, activity } = await db.transaction(async (tx) => {
    const activity = await fn(tx);
    const [order] = await load(tx, 'WHERE id = $1', [id]);
    return { order, activity };
  });
  BroadcastChange(ALL_RESOURCES, activity);
  return order;
}

async function List(filters: ListOrdersQuery): Promise<OrderResponseType[]> {
  const where: string[] = [];
  const params: unknown[] = [];
  if (filters.status) {
    params.push(filters.status);
    where.push(`status = $${params.length}`);
  }
  if (filters.search) {
    params.push(`%${filters.search}%`);
    where.push(`(id ILIKE $${params.length} OR customer ILIKE $${params.length})`);
  }
  return load(db, where.length ? `WHERE ${where.join(' AND ')}` : '', params);
}

async function Get(id: string): Promise<OrderResponseType> {
  const [order] = await load(db, 'WHERE id = $1', [id]);
  if (!order) throw NotFound('Order', id);
  return order;
}

function StartPicking(actor: UserResponseType, id: string) {
  return mutate(id, async (tx) => {
    const order = await lockOrder(tx, id, OrderStatusTypeEnum.NEW, 'released to picking');
    const skus = order.lines.map((l) => l.sku);
    await tx.query('SELECT sku FROM items WHERE sku = ANY($1) FOR UPDATE', [skus]);
    const { rows } = await tx.query<{ sku: string; name: string; available: number }>(
      'SELECT sku, name, available FROM item_views WHERE sku = ANY($1)',
      [skus],
    );
    const shortages = order.lines
      .map((l) => ({ sku: l.sku, name: l.name, needed: l.qty - l.picked, available: rows.find((r) => r.sku === l.sku)?.available ?? 0 }))
      .filter((s) => s.needed > s.available);
    if (shortages.length) {
      const list = shortages.map((s) => `${s.name} (need ${s.needed}, ${s.available} available)`).join(', ');
      throw Conflict(`Not enough available stock to release ${id}: ${list}`, { shortages });
    }
    await tx.query(`UPDATE orders SET status = 'PICKING' WHERE id = $1`, [id]);
    const units = order.totalUnits - order.pickedUnits;
    return [
      await RecordActivity(tx, {
        kind: ActivityKindTypeEnum.ALLOCATION, userId: actor.id,
        message: `Released ${id} to picking · ${units} units allocated`,
        ref: { type: ActivityRefTypeEnum.ORDER, id },
        meta: { assignee: order.assignee, skus, locations: order.lines.map((l) => l.location ?? '') },
      }),
    ];
  });
}

function pick(actor: UserResponseType, id: string, onlySku: string | null) {
  return mutate(id, async (tx) => {
    const order = await lockOrder(tx, id, OrderStatusTypeEnum.PICKING, 'picked');
    const open = order.lines.filter((l) => l.picked < l.qty && (!onlySku || l.sku === onlySku));
    if (onlySku && !order.lines.some((l) => l.sku === onlySku)) throw NotFound(`Line on ${id} for`, onlySku);
    if (!open.length) throw BadRequest(onlySku ? `${onlySku} is already picked` : `Every line on ${id} is already picked`);
    for (const line of open) {
      const qty = line.qty - line.picked;
      const { rows } = await tx.query<{ on_hand: number }>('SELECT on_hand FROM items WHERE sku = $1 FOR UPDATE', [line.sku]);
      const onHand = rows[0]?.on_hand ?? 0;
      if (onHand < qty) throw Conflict(`Only ${onHand} × ${line.name} on the shelf — cannot pick ${qty}`);
      await tx.query('UPDATE items SET on_hand = on_hand - $2 WHERE sku = $1', [line.sku, qty]);
      await tx.query('UPDATE order_lines SET picked = qty WHERE order_id = $1 AND sku = $2', [id, line.sku]);
      await RecordMovement(tx, {
        sku: line.sku, type: MovementTypeEnum.PICK, delta: -qty, balance: onHand - qty, ref: id, userId: actor.id,
        note: `Picked for ${order.customer}`,
      });
    }
    const units = open.reduce((s, l) => s + l.qty - l.picked, 0);
    const message =
      open.length === 1 ? `Picked ${units} × ${open[0].name} for ${id}` : `Picked ${open.length} lines for ${id} (${units} units)`;
    return [
      await RecordActivity(tx, {
        kind: ActivityKindTypeEnum.PICK, userId: actor.id, message,
        ref: { type: ActivityRefTypeEnum.ORDER, id },
        meta: { assignee: order.assignee, skus: open.map((l) => l.sku), locations: open.map((l) => l.location ?? '') },
      }),
    ];
  });
}

const PickLine = (actor: UserResponseType, id: string, sku: string) => pick(actor, id, sku);
const PickAll = (actor: UserResponseType, id: string) => pick(actor, id, null);

function Pack(actor: UserResponseType, id: string) {
  return mutate(id, async (tx) => {
    const order = await lockOrder(tx, id, OrderStatusTypeEnum.PICKING, 'packed');
    const missing = order.lines.filter((l) => l.picked < l.qty);
    if (missing.length) throw Conflict(`Pick every line before packing — ${missing.length} still open`);
    await tx.query(`UPDATE orders SET status = 'PACKED' WHERE id = $1`, [id]);
    return [
      await RecordActivity(tx, {
        kind: ActivityKindTypeEnum.PACK, userId: actor.id, message: `Packed ${id} for ${order.customer}`,
        ref: { type: ActivityRefTypeEnum.ORDER, id }, meta: { assignee: order.assignee },
      }),
    ];
  });
}

function Ship(actor: UserResponseType, id: string) {
  return mutate(id, async (tx) => {
    const order = await lockOrder(tx, id, OrderStatusTypeEnum.PACKED, 'shipped');
    await tx.query(`UPDATE orders SET status = 'SHIPPED' WHERE id = $1`, [id]);
    return [
      await RecordActivity(tx, {
        kind: ActivityKindTypeEnum.SHIP, userId: actor.id, message: `Shipped ${id} to ${order.customer}`,
        ref: { type: ActivityRefTypeEnum.ORDER, id }, meta: { assignee: order.assignee },
      }),
    ];
  });
}

function Update(actor: UserResponseType, id: string, input: UpdateOrderInput) {
  return mutate(id, async (tx) => {
    const { rows } = await tx.query<{ name: string }>('SELECT name FROM users WHERE id = $1', [input.assignee]);
    if (!rows[0]) throw BadRequest(`Unknown user ${input.assignee}`);
    const { rows: found } = await tx.query('UPDATE orders SET assignee = $2 WHERE id = $1 RETURNING id', [id, input.assignee]);
    if (!found.length) throw NotFound('Order', id);
    return [
      await RecordActivity(tx, {
        kind: ActivityKindTypeEnum.SYSTEM, userId: actor.id, message: `Assigned ${id} to ${rows[0].name}`,
        ref: { type: ActivityRefTypeEnum.ORDER, id }, meta: { assignee: input.assignee },
      }),
    ];
  });
}

export const ordersService = { List, Get, StartPicking, PickLine, PickAll, Pack, Ship, Update };
