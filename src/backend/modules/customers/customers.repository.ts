import { and, asc, eq, ilike, isNotNull, max, or, sql } from 'drizzle-orm';
import type { Queryable } from '@/backend/db/client';
import { customers, orderLines, orders, type CustomerRow, type DbDate, type DbNumeric } from '@/backend/db/schema';

export type CustomerListRow = CustomerRow & {
  order_count: number;
  open_orders: number;
  total_spent: DbNumeric;
  last_order_at: DbDate | null;
};

export type CustomerWriteType = { name: string; email: string; phone: string; address: string; notes: string };

export type CustomerInsertType = CustomerWriteType & { createdAt?: DbDate };

/** Customers with their order stats. Spend counts closed, non-cancelled orders. */
const selectWithStats = (q: Queryable) => {
  const totals = q
    .select({ order_id: orderLines.order_id, total: sql<string>`sum(${orderLines.qty} * ${orderLines.unit_price})`.as('total') })
    .from(orderLines)
    .groupBy(orderLines.order_id)
    .as('totals');
  const stats = q
    .select({
      customer_id: orders.customer_id,
      order_count: sql<number>`count(*) filter (where not ${orders.cancelled})`.as('order_count'),
      open_orders: sql<number>`count(*) filter (where not ${orders.closed})`.as('open_orders'),
      total_spent: sql<string>`sum(${totals.total}) filter (where ${orders.closed} and not ${orders.cancelled})`.as('total_spent'),
      last_order_at: max(orders.created_at).as('last_order_at'),
    })
    .from(orders)
    .innerJoin(totals, eq(totals.order_id, orders.id))
    .where(isNotNull(orders.customer_id))
    .groupBy(orders.customer_id)
    .as('stats');
  const row = {
    id: customers.id,
    business_id: customers.business_id,
    name: customers.name,
    email: customers.email,
    phone: customers.phone,
    address: customers.address,
    notes: customers.notes,
    created_at: customers.created_at,
    order_count: sql<number>`coalesce(${stats.order_count}, 0)`.mapWith(Number),
    open_orders: sql<number>`coalesce(${stats.open_orders}, 0)`.mapWith(Number),
    total_spent: sql<number>`coalesce(${stats.total_spent}, 0)`.mapWith(Number),
    last_order_at: sql<Date | null>`${stats.last_order_at}`.mapWith(orders.created_at),
  };
  return { query: q.select(row).from(customers).leftJoin(stats, eq(stats.customer_id, customers.id)), stats };
};

const List = (q: Queryable, businessId: string, search?: string): Promise<CustomerListRow[]> => {
  const like = search ? `%${search}%` : undefined;
  const { query, stats } = selectWithStats(q);
  return query
    .where(
      and(
        eq(customers.business_id, businessId),
        like ? or(ilike(customers.name, like), ilike(customers.email, like), ilike(customers.phone, like)) : undefined,
      ),
    )
    .orderBy(sql`${stats.last_order_at} desc nulls last`, asc(customers.name));
};

const Find = async (q: Queryable, businessId: string, id: string): Promise<CustomerListRow | undefined> => {
  const [row] = await selectWithStats(q).query.where(and(eq(customers.business_id, businessId), eq(customers.id, id)));
  return row;
};

const toRecord = (businessId: string, input: CustomerInsertType) => ({
  business_id: businessId,
  name: input.name,
  email: input.email,
  phone: input.phone,
  address: input.address,
  notes: input.notes,
  created_at: input.createdAt === undefined ? undefined : new Date(input.createdAt),
});

const Insert = async (q: Queryable, businessId: string, input: CustomerInsertType): Promise<string> => {
  const [row] = await q.insert(customers).values(toRecord(businessId, input)).returning({ id: customers.id });
  return row.id;
};

/** Many customers in one statement. Returns each new id with its name, in the order given. */
const InsertMany = async (q: Queryable, businessId: string, rows: CustomerInsertType[]): Promise<{ id: string; name: string }[]> => {
  if (!rows.length) return [];
  return q.insert(customers).values(rows.map((r) => toRecord(businessId, r))).returning({ id: customers.id, name: customers.name });
};

const Update = async (q: Queryable, id: string, input: CustomerWriteType): Promise<void> => {
  await q
    .update(customers)
    .set({ name: input.name, email: input.email, phone: input.phone, address: input.address, notes: input.notes })
    .where(eq(customers.id, id));
};

/** Orders keep their customer name snapshot; the link is cleared by the foreign key. */
const Delete = async (q: Queryable, id: string): Promise<void> => {
  await q.delete(customers).where(eq(customers.id, id));
};

export const customersRepository = { List, Find, Insert, InsertMany, Update, Delete };
