import type { Queryable } from '@/backend/db/client';
import { CustomerEntity } from '@/backend/db/entities';
import type { CustomerRow, DbDate, DbNumeric } from '@/backend/db/schema';

export type CustomerListRow = CustomerRow & {
  order_count: number;
  open_orders: number;
  total_spent: DbNumeric;
  last_order_at: DbDate | null;
};

export type CustomerWriteType = { name: string; email: string; phone: string; address: string; notes: string };

const customers = (q: Queryable) => q.getRepository(CustomerEntity);

/**
 * Customers with their order stats (spend counts closed, non-cancelled orders). A reporting aggregate with FILTER
 * clauses, so it stays parameterised SQL like the dashboard's.
 */
const SELECT = `
  SELECT c.*,
    COALESCE(s.order_count, 0)::int AS order_count,
    COALESCE(s.open_orders, 0)::int AS open_orders,
    COALESCE(s.total_spent, 0)::float8 AS total_spent,
    s.last_order_at
  FROM customers c
  LEFT JOIN (
    SELECT o.customer_id,
      COUNT(*) FILTER (WHERE NOT o.cancelled) AS order_count,
      COUNT(*) FILTER (WHERE NOT o.closed) AS open_orders,
      SUM(t.total) FILTER (WHERE o.closed AND NOT o.cancelled) AS total_spent,
      MAX(o.created_at) AS last_order_at
    FROM orders o
    JOIN (SELECT order_id, SUM(qty * unit_price) AS total FROM order_lines GROUP BY order_id) t ON t.order_id = o.id
    WHERE o.customer_id IS NOT NULL
    GROUP BY o.customer_id
  ) s ON s.customer_id = c.id`;

const List = (q: Queryable, businessId: string, search?: string): Promise<CustomerListRow[]> => {
  const filter = search ? 'AND (c.name ILIKE $2 OR c.email ILIKE $2 OR c.phone ILIKE $2)' : '';
  const params = search ? [businessId, `%${search}%`] : [businessId];
  return q.query(`${SELECT} WHERE c.business_id = $1 ${filter} ORDER BY s.last_order_at DESC NULLS LAST, c.name`, params);
};

const Find = async (q: Queryable, businessId: string, id: string): Promise<CustomerListRow | undefined> => {
  const rows: CustomerListRow[] = await q.query(`${SELECT} WHERE c.business_id = $1 AND c.id = $2`, [businessId, id]);
  return rows[0];
};

const Insert = async (q: Queryable, businessId: string, input: CustomerWriteType & { createdAt?: DbDate }): Promise<string> => {
  const { identifiers } = await customers(q).insert({
    business_id: businessId,
    name: input.name,
    email: input.email,
    phone: input.phone,
    address: input.address,
    notes: input.notes,
    created_at: input.createdAt,
  });
  return identifiers[0].id;
};

const Update = async (q: Queryable, id: string, input: CustomerWriteType): Promise<void> => {
  await customers(q).update({ id }, { name: input.name, email: input.email, phone: input.phone, address: input.address, notes: input.notes });
};

const Delete = async (q: Queryable, id: string): Promise<void> => {
  // Orders keep their customer name snapshot; the link is cleared by the foreign key.
  await customers(q).delete({ id });
};

export const customersRepository = { List, Find, Insert, Update, Delete };
