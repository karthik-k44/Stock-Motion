import { and, asc, eq, getTableColumns, ilike, inArray, not, or, sql } from 'drizzle-orm';
import type { Queryable } from '@/backend/db/client';
import { NextNumber } from '@/backend/db/next-number';
import { accounts, items, orderLines, orders, type DbDate, type OrderLineRow, type OrderRow } from '@/backend/db/schema';

export type OrderFiltersType = {
  status?: string;
  /** true: open only · false: closed only */
  open?: boolean;
  search?: string;
  customerId?: string;
  limit?: number;
};

export type OrderInsertType = {
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
};

export type OrderLineInsertType = { orderId: string; itemId: string; position: number; qty: number; done?: number; unitPrice: number };

const toDate = (value: DbDate | null | undefined) => (value === null || value === undefined ? value : new Date(value));

/** Orders with their assignee's name. */
const selectOrders = (q: Queryable) =>
  q
    .select({ ...getTableColumns(orders), assignee_name: accounts.name })
    .from(orders)
    .leftJoin(accounts, eq(accounts.id, orders.assignee_id));

const List = (q: Queryable, businessId: string, filters: OrderFiltersType = {}): Promise<OrderRow[]> => {
  const like = filters.search ? `%${filters.search}%` : undefined;
  return selectOrders(q)
    .where(
      and(
        eq(orders.business_id, businessId),
        filters.status ? eq(orders.status, filters.status) : undefined,
        filters.open === undefined ? undefined : eq(orders.closed, !filters.open),
        filters.customerId ? eq(orders.customer_id, filters.customerId) : undefined,
        like ? or(ilike(orders.number, like), ilike(orders.customer_name, like)) : undefined,
      ),
    )
    // Open first, by due date; then closed, most recently closed first.
    .orderBy(
      asc(orders.closed),
      sql`case when ${orders.closed} then ${orders.closed_at} end desc`,
      sql`${orders.due_at} asc nulls last`,
      asc(orders.created_at),
    )
    .limit(filters.limit ?? 500);
};

const FindByNumber = async (q: Queryable, businessId: string, number: string): Promise<OrderRow | undefined> => {
  const [row] = await selectOrders(q).where(and(eq(orders.business_id, businessId), eq(orders.number, number)));
  return row;
};

/** The order row is locked for the rest of the transaction, so its stage changes one request at a time. */
const LockByNumber = async (q: Queryable, businessId: string, number: string): Promise<OrderRow | undefined> => {
  const [row] = await selectOrders(q)
    .where(and(eq(orders.business_id, businessId), eq(orders.number, number)))
    .for('update', { of: orders });
  return row;
};

const ListLines = async (q: Queryable, orderIds: string[]): Promise<OrderLineRow[]> => {
  if (!orderIds.length) return [];
  return q
    .select({
      order_id: orderLines.order_id,
      item_id: orderLines.item_id,
      qty: orderLines.qty,
      done: orderLines.done,
      unit_price: orderLines.unit_price,
      sku: items.sku,
      name: items.name,
      kind: items.kind,
      unit: items.unit,
      location: items.location,
    })
    .from(orderLines)
    .innerJoin(items, eq(items.id, orderLines.item_id))
    .where(inArray(orderLines.order_id, orderIds))
    .orderBy(asc(orderLines.position));
};

const Next = (q: Queryable, businessId: string, prefix: string) => NextNumber(q, orders, businessId, prefix, 1001);

const toOrderRecord = (input: OrderInsertType) => ({
  business_id: input.businessId,
  number: input.number,
  customer_id: input.customerId,
  customer_name: input.customerName,
  status: input.status,
  reserves: input.reserves,
  closed: input.closed,
  due_at: toDate(input.dueAt),
  assignee_id: input.assigneeId,
  notes: input.notes ?? '',
  created_at: input.createdAt === undefined ? undefined : new Date(input.createdAt),
  closed_at: toDate(input.closedAt) ?? null,
});

const Insert = async (q: Queryable, input: OrderInsertType): Promise<string> => {
  const [row] = await q.insert(orders).values(toOrderRecord(input)).returning({ id: orders.id });
  return row.id;
};

/** Many orders in one statement. Returns each new id with its number (unique within a business). */
const InsertMany = async (q: Queryable, rows: OrderInsertType[]): Promise<{ id: string; number: string }[]> => {
  if (!rows.length) return [];
  return q.insert(orders).values(rows.map(toOrderRecord)).returning({ id: orders.id, number: orders.number });
};

/** Every line in one statement. */
const InsertLines = async (q: Queryable, rows: OrderLineInsertType[]): Promise<void> => {
  if (!rows.length) return;
  await q
    .insert(orderLines)
    .values(rows.map((r) => ({ order_id: r.orderId, item_id: r.itemId, position: r.position, qty: r.qty, done: r.done ?? 0, unit_price: String(r.unitPrice) })));
};

const DeleteLines = async (q: Queryable, orderId: string): Promise<void> => {
  await q.delete(orderLines).where(eq(orderLines.order_id, orderId));
};

const SetStage = async (
  q: Queryable,
  id: string,
  stage: { status: string; reserves: boolean; closed: boolean; cancelled?: boolean },): Promise<void> => {
  await q
    .update(orders)
    .set({
      status: stage.status,
      reserves: stage.reserves,
      closed: stage.closed,
      cancelled: stage.cancelled ?? false,
      closed_at: stage.closed ? new Date() : null,
    })
    .where(eq(orders.id, id));
};

const Update = async (
  q: Queryable,
  id: string,
  input: { customerId: string | null; customerName: string; dueAt: DbDate | null; assigneeId: string | null; notes: string },): Promise<void> => {
  await q
    .update(orders)
    .set({
      customer_id: input.customerId,
      customer_name: input.customerName,
      due_at: toDate(input.dueAt),
      assignee_id: input.assigneeId,
      notes: input.notes,
    })
    .where(eq(orders.id, id));
};

const SetLineDone = async (q: Queryable, orderId: string, itemId: string, done: number): Promise<void> => {
  await q.update(orderLines).set({ done }).where(and(eq(orderLines.order_id, orderId), eq(orderLines.item_id, itemId)));
};

const ClearAssignee = async (q: Queryable, businessId: string, accountId: string): Promise<void> => {
  await q.update(orders).set({ assignee_id: null }).where(and(eq(orders.business_id, businessId), eq(orders.assignee_id, accountId)));
};

/** Open orders that include an item, for the item detail panel. */
const ListOpenForItem = (
  q: Queryable,
  itemId: string,): Promise<{ number: string; customer_name: string; status: string; qty: number; done: number }[]> => {
  return q
    .select({ number: orders.number, customer_name: orders.customer_name, status: orders.status, qty: orderLines.qty, done: orderLines.done })
    .from(orderLines)
    .innerJoin(orders, eq(orders.id, orderLines.order_id))
    .where(and(eq(orderLines.item_id, itemId), not(orders.closed)))
    .orderBy(sql`${orders.due_at} asc nulls last`, asc(orders.created_at));
};

export const ordersRepository = {
  List,
  FindByNumber,
  LockByNumber,
  ListLines,
  Next,
  Insert,
  InsertMany,
  InsertLines,
  DeleteLines,
  SetStage,
  Update,
  SetLineDone,
  ClearAssignee,
  ListOpenForItem,
};
