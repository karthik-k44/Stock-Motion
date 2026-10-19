import { BadRequest, Conflict, NotFound } from '@/backend/common/errors';
import { RecordActivity, RecordMovement } from '@/backend/common/services/audit';
import { db, type Queryable } from '@/backend/db/client';
import type { DeliveryLineRow, DeliveryRow } from '@/backend/db/schema';
import { SUPPLIERS } from '@/backend/db/seed-data';
import { BroadcastChange } from '@/backend/realtime/socket';
import { ActivityKindTypeEnum, ActivityRefTypeEnum } from '@/backend/types/activity';
import { ResourceTypeEnum } from '@/backend/types/dashboard';
import { DeliveryStatusTypeEnum, type DeliveryResponseType } from '@/backend/types/delivery';
import { MovementTypeEnum } from '@/backend/types/item';
import type { UserResponseType } from '@/backend/types/user';
import { DELIVERY_LINES_SQL, ToDeliveryResponse } from './deliveries.mapper';
import type { ListDeliveriesQuery, ReceiveDeliveryInput } from './deliveries.validators';

const RESOURCES = [
  ResourceTypeEnum.DELIVERIES, ResourceTypeEnum.ITEMS, ResourceTypeEnum.LOCATIONS, ResourceTypeEnum.DASHBOARD, ResourceTypeEnum.ACTIVITY,
];

async function load(q: Queryable, where = '', params: unknown[] = []): Promise<DeliveryResponseType[]> {
  const { rows } = await q.query<DeliveryRow>(
    `SELECT * FROM deliveries ${where}
     ORDER BY CASE status WHEN 'RECEIVED' THEN 1 ELSE 0 END, CASE WHEN status = 'RECEIVED' THEN NULL ELSE expected_at END, received_at DESC NULLS LAST`,
    params,
  );
  if (!rows.length) return [];
  const { rows: lines } = await q.query<DeliveryLineRow>(DELIVERY_LINES_SQL, [rows.map((r) => r.id)]);
  return rows.map((r) => ToDeliveryResponse(r, lines));
}

async function one(q: Queryable, id: string): Promise<DeliveryResponseType> {
  const [d] = await load(q, 'WHERE id = $1', [id]);
  if (!d) throw NotFound('Delivery', id);
  return d;
}

async function List(filters: ListDeliveriesQuery): Promise<DeliveryResponseType[]> {
  const where: string[] = [];
  const params: unknown[] = [];
  if (filters.view === 'UPCOMING') where.push(`status <> 'RECEIVED'`);
  if (filters.view === 'RECEIVED') where.push(`status = 'RECEIVED'`);
  if (filters.search) {
    params.push(`%${filters.search}%`);
    where.push(`(id ILIKE $1 OR supplier ILIKE $1 OR truck ILIKE $1)`);
  }
  return load(db, where.length ? `WHERE ${where.join(' AND ')}` : '', params);
}

const Get = (id: string) => one(db, id);

/** Book a new inbound truck that restocks the items with the lowest cover. */
async function Book(actor: UserResponseType): Promise<DeliveryResponseType> {
  const result = await db.transaction(async (tx) => {
    const { rows: max } = await tx.query<{ n: number | null }>(`SELECT MAX(SUBSTRING(id FROM 5)::int) AS n FROM deliveries`);
    const id = `DLV-${(max[0]?.n ?? 2040) + 1}`;
    const { rows: needy } = await tx.query<{ sku: string; reorder_level: number }>(
      `SELECT sku, reorder_level FROM item_views
       ORDER BY (incoming > 0), available::float / GREATEST(reorder_level, 1), sku LIMIT 3`,
    );
    const supplier = SUPPLIERS[Math.floor(Math.random() * SUPPLIERS.length)];
    const truck = `TRK-${10 + Math.floor(Math.random() * 30)}`;
    const plate = `${supplier.slice(0, 2).toUpperCase()} ${1000 + Math.floor(Math.random() * 8999)}`;
    await tx.query(
      `INSERT INTO deliveries (id, supplier, truck, plate, expected_at, status) VALUES ($1, $2, $3, $4, now() + interval '20 minutes', 'IN_TRANSIT')`,
      [id, supplier, truck, plate],
    );
    let pos = 0;
    for (const n of needy) {
      const qty = Math.max(12, Math.ceil((n.reorder_level * 2) / 6) * 6);
      await tx.query('INSERT INTO delivery_lines (delivery_id, sku, position, expected) VALUES ($1, $2, $3, $4)', [id, n.sku, pos++, qty]);
    }
    const activity = await RecordActivity(tx, {
      kind: ActivityKindTypeEnum.SYSTEM, userId: actor.id, message: `Booked ${id} from ${supplier} · ${truck} in transit`,
      ref: { type: ActivityRefTypeEnum.DELIVERY, id }, meta: { skus: needy.map((n) => n.sku) },
    });
    return { delivery: await one(tx, id), activity };
  });
  BroadcastChange(RESOURCES, [result.activity]);
  return result.delivery;
}

async function StartUnloading(actor: UserResponseType, id: string): Promise<DeliveryResponseType> {
  const result = await db.transaction(async (tx) => {
    await tx.query('SELECT id FROM deliveries WHERE id = $1 FOR UPDATE', [id]);
    const d = await one(tx, id);
    if (d.status === DeliveryStatusTypeEnum.RECEIVED) throw Conflict(`${id} has already been received`);
    if (d.status === DeliveryStatusTypeEnum.UNLOADING) return { delivery: d, activity: [] };
    await tx.query(`UPDATE deliveries SET status = 'UNLOADING' WHERE id = $1`, [id]);
    const activity = await RecordActivity(tx, {
      kind: ActivityKindTypeEnum.DELIVERY, userId: actor.id, message: `${d.truck} docked at Dock 1 — unloading ${id}`,
      ref: { type: ActivityRefTypeEnum.DELIVERY, id }, meta: { skus: d.lines.map((l) => l.sku) },
    });
    return { delivery: await one(tx, id), activity: [activity] };
  });
  BroadcastChange(RESOURCES, result.activity);
  return result.delivery;
}

async function Receive(actor: UserResponseType, id: string, input: ReceiveDeliveryInput): Promise<DeliveryResponseType> {
  const result = await db.transaction(async (tx) => {
    await tx.query('SELECT id FROM deliveries WHERE id = $1 FOR UPDATE', [id]);
    const d = await one(tx, id);
    if (d.status === DeliveryStatusTypeEnum.RECEIVED) throw Conflict(`${id} has already been received`);
    const counted = new Map(input.lines.map((l) => [l.sku, l.received]));
    const unknown = [...counted.keys()].filter((sku) => !d.lines.some((l) => l.sku === sku));
    if (unknown.length) throw BadRequest(`${unknown.join(', ')} ${unknown.length === 1 ? 'is' : 'are'} not on ${id}`);

    let total = 0;
    let discrepancies = 0;
    for (const line of d.lines) {
      const qty = counted.get(line.sku) ?? line.expected;
      if (qty !== line.expected) discrepancies++;
      total += qty;
      await tx.query('UPDATE delivery_lines SET received = $3 WHERE delivery_id = $1 AND sku = $2', [id, line.sku, qty]);
      if (qty === 0) continue;
      const { rows } = await tx.query<{ on_hand: number }>(
        'UPDATE items SET on_hand = on_hand + $2 WHERE sku = $1 RETURNING on_hand',
        [line.sku, qty],
      );
      await RecordMovement(tx, {
        sku: line.sku, type: MovementTypeEnum.RECEIPT, delta: qty, balance: rows[0].on_hand, ref: id, userId: actor.id,
        note: `Received from ${d.supplier}${qty !== line.expected ? ` (expected ${line.expected})` : ''}`,
      });
    }
    await tx.query(`UPDATE deliveries SET status = 'RECEIVED', received_at = now() WHERE id = $1`, [id]);
    const activity = await RecordActivity(tx, {
      kind: ActivityKindTypeEnum.DELIVERY, userId: actor.id,
      message: `Received ${id} from ${d.supplier} · ${total} units${discrepancies ? ` (${discrepancies} line${discrepancies > 1 ? 's' : ''} short/over)` : ''}`,
      ref: { type: ActivityRefTypeEnum.DELIVERY, id },
      meta: { skus: d.lines.map((l) => l.sku), locations: d.lines.map((l) => l.location ?? '') },
    });
    return { delivery: await one(tx, id), activity };
  });
  BroadcastChange(RESOURCES, [result.activity]);
  return result.delivery;
}

export const deliveriesService = { List, Get, Book, StartUnloading, Receive };
