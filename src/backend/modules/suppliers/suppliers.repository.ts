import { and, asc, eq, ilike, isNull, ne, or, sql } from 'drizzle-orm';
import type { Queryable } from '@/backend/db/client';
import { deliveries, items, suppliers, type SupplierRow } from '@/backend/db/schema';

export type SupplierListRow = SupplierRow & { item_count: number; open_deliveries: number };

export type SupplierWriteType = { name: string; contact: string; email: string; phone: string; leadDays: number };

/** Suppliers with how many items they supply and deliveries still to come. */
const selectWithCounts = (q: Queryable) =>
  q
    .select({
      id: suppliers.id,
      business_id: suppliers.business_id,
      name: suppliers.name,
      contact: suppliers.contact,
      email: suppliers.email,
      phone: suppliers.phone,
      lead_days: suppliers.lead_days,
      created_at: suppliers.created_at,
      item_count: q.$count(items, and(eq(items.supplier_id, suppliers.id), isNull(items.archived_at))),
      open_deliveries: q.$count(deliveries, and(eq(deliveries.supplier_id, suppliers.id), ne(deliveries.status, 'RECEIVED'))),
    })
    .from(suppliers);

const List = (q: Queryable, businessId: string, search?: string): Promise<SupplierListRow[]> => {
  const like = search ? `%${search}%` : undefined;
  return selectWithCounts(q)
    .where(
      and(
        eq(suppliers.business_id, businessId),
        like ? or(ilike(suppliers.name, like), ilike(suppliers.contact, like), ilike(suppliers.email, like)) : undefined,
      ),
    )
    .orderBy(asc(suppliers.name));
};

const Find = async (q: Queryable, businessId: string, id: string): Promise<SupplierListRow | undefined> => {
  const [row] = await selectWithCounts(q).where(and(eq(suppliers.business_id, businessId), eq(suppliers.id, id)));
  return row;
};

/** Case-insensitive, for CSV imports that name a supplier. */
const FindByName = async (q: Queryable, businessId: string, name: string): Promise<SupplierRow | undefined> => {
  const [row] = await q
    .select()
    .from(suppliers)
    .where(and(eq(suppliers.business_id, businessId), eq(sql`lower(${suppliers.name})`, name.toLowerCase())));
  return row;
};

const toRecord = (businessId: string, input: SupplierWriteType) => ({
  business_id: businessId,
  name: input.name,
  contact: input.contact,
  email: input.email,
  phone: input.phone,
  lead_days: input.leadDays,
});

const Insert = async (q: Queryable, businessId: string, input: SupplierWriteType): Promise<string> => {
  const [row] = await q.insert(suppliers).values(toRecord(businessId, input)).returning({ id: suppliers.id });
  return row.id;
};

/** Many suppliers in one statement. Returns each new id with its name (unique within a business). */
const InsertMany = async (q: Queryable, businessId: string, rows: SupplierWriteType[]): Promise<{ id: string; name: string }[]> => {
  if (!rows.length) return [];
  return q.insert(suppliers).values(rows.map((r) => toRecord(businessId, r))).returning({ id: suppliers.id, name: suppliers.name });
};

const Update = async (q: Queryable, id: string, input: SupplierWriteType): Promise<void> => {
  await q
    .update(suppliers)
    .set({ name: input.name, contact: input.contact, email: input.email, phone: input.phone, lead_days: input.leadDays })
    .where(eq(suppliers.id, id));
};

const Delete = async (q: Queryable, id: string): Promise<void> => {
  await q.delete(suppliers).where(eq(suppliers.id, id));
};

export const suppliersRepository = { List, Find, FindByName, Insert, InsertMany, Update, Delete };
