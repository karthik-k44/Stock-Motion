import type { Queryable } from '@/backend/db/client';
import type { CustomerRow, DbDate, DbNumeric } from '@/backend/db/schema';

export type CustomerListRow = CustomerRow & {
  order_count: number;
  open_orders: number;
  total_spent: DbNumeric;
  last_order_at: DbDate | null;
};

export type CustomerWriteType = { name: string; email: string; phone: string; address: string; notes: string };

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

async function List(q: Queryable, businessId: string, search?: string): Promise<CustomerListRow[]> {
  const params: unknown[] = [businessId];
  let filter = '';
  if (search) {
    params.push(`%${search}%`);
    filter = 'AND (c.name ILIKE $2 OR c.email ILIKE $2 OR c.phone ILIKE $2)';
  }
  const { rows } = await q.query<CustomerListRow>(
    `${SELECT} WHERE c.business_id = $1 ${filter} ORDER BY s.last_order_at DESC NULLS LAST, c.name`,
    params,
  );
  return rows;
}

async function Find(q: Queryable, businessId: string, id: string): Promise<CustomerListRow | undefined> {
  const { rows } = await q.query<CustomerListRow>(`${SELECT} WHERE c.business_id = $1 AND c.id = $2`, [businessId, id]);
  return rows[0];
}

async function Insert(q: Queryable, businessId: string, input: CustomerWriteType & { createdAt?: DbDate }): Promise<string> {
  const { rows } = await q.query<{ id: string }>(
    `INSERT INTO customers (business_id, name, email, phone, address, notes, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, COALESCE($7, now())) RETURNING id`,
    [businessId, input.name, input.email, input.phone, input.address, input.notes, input.createdAt ?? null],
  );
  return rows[0].id;
}

async function Update(q: Queryable, id: string, input: CustomerWriteType): Promise<void> {
  await q.query('UPDATE customers SET name = $2, email = $3, phone = $4, address = $5, notes = $6 WHERE id = $1', [
    id, input.name, input.email, input.phone, input.address, input.notes,
  ]);
}

async function Delete(q: Queryable, id: string): Promise<void> {
  // Orders keep their customer name snapshot; the link is cleared by the foreign key.
  await q.query('DELETE FROM customers WHERE id = $1', [id]);
}

export const customersRepository = { List, Find, Insert, Update, Delete };
