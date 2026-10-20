import type { Queryable } from '@/backend/db/client';
import { NextNumber } from '@/backend/db/next-number';
import type { DbDate, OrderLineRow, OrderRow } from '@/backend/db/schema';

const SELECT = `SELECT o.*, a.name AS assignee_name FROM orders o LEFT JOIN accounts a ON a.id = o.assignee_id`;

export type OrderFiltersType = {
  status?: string;
  /** true: open only · false: closed only */
  open?: boolean;
  search?: string;
  customerId?: string;
  limit?: number;
};

const List = async (q: Queryable, businessId: string, filters: OrderFiltersType = {}): Promise<OrderRow[]> => {
  const where = ['o.business_id = $1'];
  const params: unknown[] = [businessId];
  const add = (sql: string, value: unknown) => {
    params.push(value);
    where.push(sql.replaceAll('?', `$${params.length}`));
  };
  if (filters.status) add('o.status = ?', filters.status);
  if (filters.open !== undefined) add('o.closed = ?', !filters.open);
  if (filters.customerId) add('o.customer_id = ?', filters.customerId);
  if (filters.search) add('(o.number ILIKE ? OR o.customer_name ILIKE ?)', `%${filters.search}%`);
  params.push(filters.limit ?? 500);
  const { rows } = await q.query<OrderRow>(
    `${SELECT} WHERE ${where.join(' AND ')}
     ORDER BY o.closed, CASE WHEN o.closed THEN o.closed_at END DESC, o.due_at NULLS LAST, o.created_at
     LIMIT $${params.length}`,
    params,
  );
  return rows;
};

const FindByNumber = async (q: Queryable, businessId: string, number: string): Promise<OrderRow | undefined> => {
  const { rows } = await q.query<OrderRow>(`${SELECT} WHERE o.business_id = $1 AND o.number = $2`, [businessId, number]);
  return rows[0];
};

const LockByNumber = async (q: Queryable, businessId: string, number: string): Promise<OrderRow | undefined> => {
  const { rows } = await q.query<OrderRow>(`${SELECT} WHERE o.business_id = $1 AND o.number = $2 FOR UPDATE OF o`, [businessId, number]);
  return rows[0];
};

const ListLines = async (q: Queryable, orderIds: string[]): Promise<OrderLineRow[]> => {
  if (!orderIds.length) return [];
  const { rows } = await q.query<OrderLineRow>(
    `SELECT ol.order_id, ol.item_id, i.sku, i.name, i.kind, i.unit, i.location, ol.qty, ol.done, ol.unit_price
     FROM order_lines ol JOIN items i ON i.id = ol.item_id
     WHERE ol.order_id = ANY($1) ORDER BY ol.position`,
    [orderIds],
  );
  return rows;
};

const Next = (q: Queryable, businessId: string, prefix: string) => NextNumber(q, 'orders', businessId, prefix, 1001);

const Insert = async (
  q: Queryable,
  input: {
    businessId: string;
    number: string;
    customerId: string | null;
    customerName: string;
    status: string;
    reserves: boolean;
    closed: boolean;
    dueAt: DbDate | null;
    assigneeId: string | null;
    notes?: string;
    createdAt?: DbDate;
    closedAt?: DbDate | null;
  },): Promise<string> => {
  const { rows } = await q.query<{ id: string }>(
    `INSERT INTO orders (business_id, number, customer_id, customer_name, status, reserves, closed, due_at, assignee_id, notes, created_at, closed_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, COALESCE($11, now()), $12) RETURNING id`,
    [
      input.businessId, input.number, input.customerId, input.customerName, input.status, input.reserves, input.closed,
      input.dueAt, input.assigneeId, input.notes ?? '', input.createdAt ?? null, input.closedAt ?? null,
    ],
  );
  return rows[0].id;
};

const InsertLine = async (
  q: Queryable,
  input: { orderId: string; itemId: string; position: number; qty: number; done?: number; unitPrice: number },): Promise<void> => {
  await q.query('INSERT INTO order_lines (order_id, item_id, position, qty, done, unit_price) VALUES ($1, $2, $3, $4, $5, $6)', [
    input.orderId, input.itemId, input.position, input.qty, input.done ?? 0, input.unitPrice,
  ]);
};

const DeleteLines = async (q: Queryable, orderId: string): Promise<void> => {
  await q.query('DELETE FROM order_lines WHERE order_id = $1', [orderId]);
};

const SetStage = async (
  q: Queryable,
  id: string,
  stage: { status: string; reserves: boolean; closed: boolean; cancelled?: boolean },): Promise<void> => {
  await q.query(
    `UPDATE orders SET status = $2, reserves = $3, closed = $4, cancelled = $5,
       closed_at = CASE WHEN $4 THEN now() ELSE NULL END
     WHERE id = $1`,
    [id, stage.status, stage.reserves, stage.closed, stage.cancelled ?? false],
  );
};

const Update = async (
  q: Queryable,
  id: string,
  input: { customerId: string | null; customerName: string; dueAt: DbDate | null; assigneeId: string | null; notes: string },): Promise<void> => {
  await q.query('UPDATE orders SET customer_id = $2, customer_name = $3, due_at = $4, assignee_id = $5, notes = $6 WHERE id = $1', [
    id, input.customerId, input.customerName, input.dueAt, input.assigneeId, input.notes,
  ]);
};

const SetLineDone = async (q: Queryable, orderId: string, itemId: string, done: number): Promise<void> => {
  await q.query('UPDATE order_lines SET done = $3 WHERE order_id = $1 AND item_id = $2', [orderId, itemId, done]);
};

const ClearAssignee = async (q: Queryable, businessId: string, accountId: string): Promise<void> => {
  await q.query('UPDATE orders SET assignee_id = NULL WHERE business_id = $1 AND assignee_id = $2', [businessId, accountId]);
};

/** Open orders that include an item, for the item detail panel. */
const ListOpenForItem = async (
  q: Queryable,
  itemId: string,): Promise<{ number: string; customer_name: string; status: string; qty: number; done: number }[]> => {
  const { rows } = await q.query<{ number: string; customer_name: string; status: string; qty: number; done: number }>(
    `SELECT o.number, o.customer_name, o.status, ol.qty, ol.done
     FROM order_lines ol JOIN orders o ON o.id = ol.order_id
     WHERE ol.item_id = $1 AND NOT o.closed ORDER BY o.due_at NULLS LAST, o.created_at`,
    [itemId],
  );
  return rows;
};

export const ordersRepository = {
  List,
  FindByNumber,
  LockByNumber,
  ListLines,
  Next,
  Insert,
  InsertLine,
  DeleteLines,
  SetStage,
  Update,
  SetLineDone,
  ClearAssignee,
  ListOpenForItem,
};
