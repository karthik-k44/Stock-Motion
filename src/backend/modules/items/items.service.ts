import { BadRequest, Conflict, NotFound } from '@/backend/common/errors';
import { RecordActivity, RecordMovement } from '@/backend/common/services/audit';
import { ToIso } from '@/backend/common/utils/dates';
import { Signed } from '@/backend/common/utils/format';
import { db, type Queryable } from '@/backend/db/client';
import type { ItemViewRow, MovementRow } from '@/backend/db/schema';
import { BroadcastChange } from '@/backend/realtime/socket';
import { ActivityKindTypeEnum, ActivityRefTypeEnum } from '@/backend/types/activity';
import { ResourceTypeEnum } from '@/backend/types/dashboard';
import {
  AdjustModeTypeEnum,
  AdjustReasonTypeEnum,
  MovementTypeEnum,
  type ItemDetailResponseType,
  type ItemResponseType,
  type MovementResponseType,
} from '@/backend/types/item';
import type { UserResponseType } from '@/backend/types/user';
import { ITEM_VIEW_COLUMNS, ToItemResponse } from './items.mapper';
import type { AdjustStockInput, ListItemsQuery, RelocateInput } from './items.validators';

const REASON_LABEL: Record<AdjustReasonTypeEnum, string> = {
  [AdjustReasonTypeEnum.CYCLE_COUNT]: 'Cycle count',
  [AdjustReasonTypeEnum.DAMAGED]: 'Damaged',
  [AdjustReasonTypeEnum.FOUND]: 'Found stock',
  [AdjustReasonTypeEnum.RETURN]: 'Customer return',
  [AdjustReasonTypeEnum.OTHER]: 'Other',
};

const STOCK_RESOURCES = [ResourceTypeEnum.ITEMS, ResourceTypeEnum.LOCATIONS, ResourceTypeEnum.DASHBOARD, ResourceTypeEnum.ACTIVITY];

async function view(q: Queryable, sku: string): Promise<ItemResponseType> {
  const { rows } = await q.query<ItemViewRow>(`SELECT ${ITEM_VIEW_COLUMNS} FROM item_views WHERE sku = $1`, [sku]);
  if (!rows[0]) throw NotFound('Item', sku);
  return ToItemResponse(rows[0]);
}

async function List(filters: ListItemsQuery): Promise<ItemResponseType[]> {
  const where: string[] = [];
  const params: unknown[] = [];
  const add = (sql: string, value: unknown) => {
    params.push(value);
    where.push(sql.replaceAll('?', `$${params.length}`));
  };
  if (filters.search) add('(name ILIKE ? OR sku ILIKE ?)', `%${filters.search}%`);
  if (filters.category) add('category = ?', filters.category);
  if (filters.aisle) add('location LIKE ?', `${filters.aisle}-%`);
  if (filters.status === 'RESERVED') where.push('reserved > 0');
  else if (filters.status === 'INCOMING') where.push('incoming > 0');
  else if (filters.status) add('status = ?', filters.status);

  const { rows } = await db.query<ItemViewRow>(
    `SELECT ${ITEM_VIEW_COLUMNS} FROM item_views ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
     ORDER BY location NULLS LAST, sku`,
    params,
  );
  return rows.map(ToItemResponse);
}

async function Get(sku: string): Promise<ItemDetailResponseType> {
  const item = await view(db, sku);
  const movements = await db.query<MovementRow>(
    'SELECT * FROM movements WHERE sku = $1 ORDER BY at DESC, id DESC LIMIT 50',
    [sku],
  );
  const orders = await db.query<{ order_id: string; customer: string; status: string; qty: number; picked: number }>(
    `SELECT o.id AS order_id, o.customer, o.status, ol.qty, ol.picked
     FROM order_lines ol JOIN orders o ON o.id = ol.order_id
     WHERE ol.sku = $1 AND o.status IN ('NEW', 'PICKING') ORDER BY o.requested_date`,
    [sku],
  );
  const incoming = await db.query<{ delivery_id: string; supplier: string; expected_at: Date | string; expected: number }>(
    `SELECT d.id AS delivery_id, d.supplier, d.expected_at, dl.expected
     FROM delivery_lines dl JOIN deliveries d ON d.id = dl.delivery_id
     WHERE dl.sku = $1 AND d.status <> 'RECEIVED' ORDER BY d.expected_at`,
    [sku],
  );
  return {
    ...item,
    movements: movements.rows.map(toMovement),
    openOrders: orders.rows.map((r) => ({ orderId: r.order_id, customer: r.customer, status: r.status, qty: r.qty, picked: r.picked })),
    incomingDeliveries: incoming.rows.map((r) => ({
      deliveryId: r.delivery_id, supplier: r.supplier, expectedAt: ToIso(r.expected_at), expected: r.expected,
    })),
  };
}

function toMovement(r: MovementRow): MovementResponseType {
  return {
    id: r.id, at: ToIso(r.at), sku: r.sku, type: r.type as MovementTypeEnum, delta: r.delta,
    balance: r.balance, ref: r.ref, userId: r.user_id, note: r.note,
  };
}

async function Adjust(actor: UserResponseType, sku: string, input: AdjustStockInput): Promise<ItemResponseType> {
  const { item, activity } = await db.transaction(async (tx) => {
    const { rows } = await tx.query<{ on_hand: number; name: string }>('SELECT on_hand, name FROM items WHERE sku = $1 FOR UPDATE', [sku]);
    if (!rows[0]) throw NotFound('Item', sku);
    const current = await view(tx, sku);
    const { on_hand: onHand, name } = rows[0];
    const next =
      input.mode === AdjustModeTypeEnum.ADD ? onHand + input.qty : input.mode === AdjustModeTypeEnum.REMOVE ? onHand - input.qty : input.qty;
    if (next === onHand) throw BadRequest('That adjustment would not change the quantity');
    if (next < 0) throw Conflict(`Only ${onHand} on hand — you can't remove ${input.qty}`);
    if (next < current.reserved) {
      throw Conflict(`${current.reserved} units are reserved for orders being picked — on hand can't go below that`);
    }
    await tx.query('UPDATE items SET on_hand = $2 WHERE sku = $1', [sku, next]);
    const reason = REASON_LABEL[input.reason];
    const delta = next - onHand;
    await RecordMovement(tx, {
      sku, type: MovementTypeEnum.ADJUSTMENT, delta, balance: next, userId: actor.id,
      note: input.note ? `${reason} — ${input.note}` : reason,
    });
    const message =
      input.mode === AdjustModeTypeEnum.SET
        ? `Counted ${name}: ${onHand} → ${next} (${reason})`
        : `Adjusted ${name} by ${Signed(delta)} (${reason})`;
    const activity = await RecordActivity(tx, {
      kind: ActivityKindTypeEnum.ADJUSTMENT, userId: actor.id, message,
      ref: { type: ActivityRefTypeEnum.ITEM, id: sku },
      meta: { skus: [sku], locations: current.location ? [current.location] : [] },
    });
    return { item: await view(tx, sku), activity };
  });
  BroadcastChange(STOCK_RESOURCES, [activity]);
  return item;
}

async function Relocate(actor: UserResponseType, sku: string, input: RelocateInput): Promise<ItemResponseType> {
  const { item, activity } = await db.transaction(async (tx) => {
    const current = await view(tx, sku);
    if (current.location === input.location) throw BadRequest(`${sku} is already stored in ${input.location}`);
    const taken = await tx.query<{ sku: string }>('SELECT sku FROM items WHERE location = $1', [input.location]);
    if (taken.rows[0]) throw Conflict(`Bin ${input.location} is occupied by ${taken.rows[0].sku}`);
    await tx.query('UPDATE items SET location = $2 WHERE sku = $1', [sku, input.location]);
    const from = current.location ?? 'unassigned';
    await RecordMovement(tx, {
      sku, type: MovementTypeEnum.RELOCATION, delta: 0, balance: current.onHand, userId: actor.id, note: `Moved ${from} → ${input.location}`,
    });
    const activity = await RecordActivity(tx, {
      kind: ActivityKindTypeEnum.RELOCATION, userId: actor.id,
      message: `Moved ${current.name} from ${from} to ${input.location}`,
      ref: { type: ActivityRefTypeEnum.ITEM, id: sku },
      meta: { skus: [sku], from, to: input.location },
    });
    return { item: await view(tx, sku), activity };
  });
  BroadcastChange(STOCK_RESOURCES, [activity]);
  return item;
}

export const itemsService = { List, Get, Adjust, Relocate };
