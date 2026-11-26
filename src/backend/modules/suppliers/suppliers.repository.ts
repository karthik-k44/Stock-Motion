import type { Queryable } from '@/backend/db/client';
import { SupplierEntity } from '@/backend/db/entities';
import type { SupplierRow } from '@/backend/db/schema';

export type SupplierListRow = SupplierRow & { item_count: number; open_deliveries: number };

export type SupplierWriteType = { name: string; contact: string; email: string; phone: string; leadDays: number };

const suppliers = (q: Queryable) => q.getRepository(SupplierEntity);

/** Suppliers of a business with how many items they supply and deliveries still to come. */
const select = (q: Queryable, businessId: string) =>
  suppliers(q)
    .createQueryBuilder('s')
    .select('s.*')
    .addSelect('(SELECT COUNT(*)::int FROM items i WHERE i.supplier_id = s.id AND i.archived_at IS NULL)', 'item_count')
    .addSelect(`(SELECT COUNT(*)::int FROM deliveries d WHERE d.supplier_id = s.id AND d.status <> 'RECEIVED')`, 'open_deliveries')
    .where('s.business_id = :businessId', { businessId });

const List = (q: Queryable, businessId: string, search?: string): Promise<SupplierListRow[]> => {
  const query = select(q, businessId);
  if (search) query.andWhere('(s.name ILIKE :search OR s.contact ILIKE :search OR s.email ILIKE :search)', { search: `%${search}%` });
  return query.orderBy('s.name').getRawMany<SupplierListRow>();
};

const Find = (q: Queryable, businessId: string, id: string): Promise<SupplierListRow | undefined> => {
  return select(q, businessId).andWhere('s.id = :id', { id }).getRawOne<SupplierListRow>();
};

const FindByName = async (q: Queryable, businessId: string, name: string): Promise<SupplierRow | undefined> => {
  const row = await suppliers(q)
    .createQueryBuilder('s')
    .where('s.business_id = :businessId AND lower(s.name) = lower(:name)', { businessId, name })
    .getOne();
  return row ?? undefined;
};

const toRecord = (businessId: string, input: SupplierWriteType & { id?: string }) => ({
  id: input.id,
  business_id: businessId,
  name: input.name,
  contact: input.contact,
  email: input.email,
  phone: input.phone,
  lead_days: input.leadDays,
});

const Insert = async (q: Queryable, businessId: string, input: SupplierWriteType): Promise<string> => {
  const { identifiers } = await suppliers(q).insert(toRecord(businessId, input));
  return identifiers[0].id;
};

/** Many suppliers in one statement; each carries its `id` so callers can link to it in the same batch. */
const InsertMany = async (q: Queryable, businessId: string, rows: (SupplierWriteType & { id: string })[]): Promise<void> => {
  if (rows.length) await suppliers(q).insert(rows.map((r) => toRecord(businessId, r)));
};

const Update = async (q: Queryable, id: string, input: SupplierWriteType): Promise<void> => {
  await suppliers(q).update({ id }, { name: input.name, contact: input.contact, email: input.email, phone: input.phone, lead_days: input.leadDays });
};

const Delete = async (q: Queryable, id: string): Promise<void> => {
  await suppliers(q).delete({ id });
};

export const suppliersRepository = { List, Find, FindByName, Insert, InsertMany, Update, Delete };
