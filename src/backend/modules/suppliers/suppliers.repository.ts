import type { Queryable } from '@/backend/db/client';
import type { SupplierRow } from '@/backend/db/schema';

export type SupplierListRow = SupplierRow & { item_count: number; open_deliveries: number };

export type SupplierWriteType = { name: string; contact: string; email: string; phone: string; leadDays: number };

const SELECT = `
  SELECT s.*,
    (SELECT COUNT(*)::int FROM items i WHERE i.supplier_id = s.id AND i.archived_at IS NULL) AS item_count,
    (SELECT COUNT(*)::int FROM deliveries d WHERE d.supplier_id = s.id AND d.status <> 'RECEIVED') AS open_deliveries
  FROM suppliers s`;

const List = async (q: Queryable, businessId: string, search?: string): Promise<SupplierListRow[]> => {
  const params: unknown[] = [businessId];
  let filter = '';
  if (search) {
    params.push(`%${search}%`);
    filter = 'AND (s.name ILIKE $2 OR s.contact ILIKE $2 OR s.email ILIKE $2)';
  }
  const { rows } = await q.query<SupplierListRow>(`${SELECT} WHERE s.business_id = $1 ${filter} ORDER BY s.name`, params);
  return rows;
};

const Find = async (q: Queryable, businessId: string, id: string): Promise<SupplierListRow | undefined> => {
  const { rows } = await q.query<SupplierListRow>(`${SELECT} WHERE s.business_id = $1 AND s.id = $2`, [businessId, id]);
  return rows[0];
};

const FindByName = async (q: Queryable, businessId: string, name: string): Promise<SupplierRow | undefined> => {
  const { rows } = await q.query<SupplierRow>('SELECT * FROM suppliers WHERE business_id = $1 AND lower(name) = lower($2)', [businessId, name]);
  return rows[0];
};

const Insert = async (q: Queryable, businessId: string, input: SupplierWriteType): Promise<string> => {
  const { rows } = await q.query<{ id: string }>(
    'INSERT INTO suppliers (business_id, name, contact, email, phone, lead_days) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
    [businessId, input.name, input.contact, input.email, input.phone, input.leadDays],
  );
  return rows[0].id;
};

const Update = async (q: Queryable, id: string, input: SupplierWriteType): Promise<void> => {
  await q.query('UPDATE suppliers SET name = $2, contact = $3, email = $4, phone = $5, lead_days = $6 WHERE id = $1', [
    id, input.name, input.contact, input.email, input.phone, input.leadDays,
  ]);
};

const Delete = async (q: Queryable, id: string): Promise<void> => {
  await q.query('DELETE FROM suppliers WHERE id = $1', [id]);
};

export const suppliersRepository = { List, Find, FindByName, Insert, Update, Delete };
