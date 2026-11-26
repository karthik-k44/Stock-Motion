import type { Queryable } from '@/backend/db/client';
import { DeliveryEntity, DeliveryLineEntity, ItemEntity, NameOf } from '@/backend/db/entities';
import { NextNumber } from '@/backend/db/next-number';
import type { DbDate, DeliveryLineRow, DeliveryRow } from '@/backend/db/schema';

export type DeliveryFiltersType = {
  /** UPCOMING: not received yet · RECEIVED */
  view?: 'ALL' | 'UPCOMING' | 'RECEIVED';
  search?: string;
  supplierId?: string;
  limit?: number;
};

const deliveries = (q: Queryable) => q.getRepository(DeliveryEntity);
const lines = (q: Queryable) => q.getRepository(DeliveryLineEntity);

const List = (q: Queryable, businessId: string, filters: DeliveryFiltersType = {}): Promise<DeliveryRow[]> => {
  const query = deliveries(q).createQueryBuilder('d').where('d.business_id = :businessId', { businessId });
  if (filters.view === 'UPCOMING') query.andWhere(`d.status <> 'RECEIVED'`);
  if (filters.view === 'RECEIVED') query.andWhere(`d.status = 'RECEIVED'`);
  if (filters.supplierId) query.andWhere('d.supplier_id = :supplierId', { supplierId: filters.supplierId });
  if (filters.search) {
    query.andWhere('(d.number ILIKE :search OR d.supplier_name ILIKE :search OR d.vehicle ILIKE :search OR d.reference ILIKE :search)', {
      search: `%${filters.search}%`,
    });
  }
  // Upcoming first, soonest first; then received, newest first.
  return query
    .orderBy(`CASE d.status WHEN 'RECEIVED' THEN 1 ELSE 0 END`)
    .addOrderBy(`CASE WHEN d.status = 'RECEIVED' THEN NULL ELSE d.expected_at END`)
    .addOrderBy('d.received_at', 'DESC', 'NULLS LAST')
    .take(filters.limit ?? 500)
    .getMany();
};

const FindByNumber = async (q: Queryable, businessId: string, number: string): Promise<DeliveryRow | undefined> => {
  return (await deliveries(q).findOneBy({ business_id: businessId, number })) ?? undefined;
};

/** The delivery row is locked for the rest of the transaction, so it can only be received once. */
const LockByNumber = async (q: Queryable, businessId: string, number: string): Promise<DeliveryRow | undefined> => {
  const row = await deliveries(q)
    .createQueryBuilder('d')
    .where('d.business_id = :businessId AND d.number = :number', { businessId, number })
    .setLock('pessimistic_write')
    .getOne();
  return row ?? undefined;
};

const ListLines = async (q: Queryable, deliveryIds: string[]): Promise<DeliveryLineRow[]> => {
  if (!deliveryIds.length) return [];
  return q
    .createQueryBuilder(DeliveryLineEntity, 'dl')
    .select(['dl.delivery_id AS delivery_id', 'dl.item_id AS item_id', 'dl.expected AS expected', 'dl.received AS received', 'dl.unit_cost AS unit_cost'])
    .addSelect(['i.sku AS sku', 'i.name AS name', 'i.unit AS unit', 'i.location AS location'])
    .innerJoin(NameOf(ItemEntity), 'i', 'i.id = dl.item_id')
    .where('dl.delivery_id IN (:...deliveryIds)', { deliveryIds })
    .orderBy('dl.position')
    .getRawMany<DeliveryLineRow>();
};

const Next = (q: Queryable, businessId: string, prefix: string) => NextNumber(q, 'deliveries', businessId, prefix, 2001);

export type DeliveryInsertType = {
  /** Set by callers that need the id before the row exists (sample data links lines to it in the same batch) */
  id?: string;
  businessId: string;
  number: string;
  supplierId: string | null;
  supplierName: string;
  vehicle: string;
  reference: string;
  expectedAt: DbDate;
  status: string;
  receivedAt?: DbDate | null;
};

export type DeliveryLineInsertType = {
  deliveryId: string;
  itemId: string;
  position: number;
  expected: number;
  received?: number | null;
  unitCost: number;
};

const toDeliveryRecord = (input: DeliveryInsertType) => ({
  id: input.id,
  business_id: input.businessId,
  number: input.number,
  supplier_id: input.supplierId,
  supplier_name: input.supplierName,
  vehicle: input.vehicle,
  reference: input.reference,
  expected_at: input.expectedAt,
  received_at: input.receivedAt ?? null,
  status: input.status,
});

const Insert = async (q: Queryable, input: DeliveryInsertType): Promise<string> => {
  const { identifiers } = await deliveries(q).insert(toDeliveryRecord(input));
  return identifiers[0].id;
};

/** Many deliveries in one statement; each must carry its `id`. */
const InsertMany = async (q: Queryable, rows: (DeliveryInsertType & { id: string })[]): Promise<void> => {
  if (rows.length) await deliveries(q).insert(rows.map(toDeliveryRecord));
};

/** Every line in one statement. */
const InsertLines = async (q: Queryable, rows: DeliveryLineInsertType[]): Promise<void> => {
  if (!rows.length) return;
  await lines(q).insert(
    rows.map((r) => ({
      delivery_id: r.deliveryId, item_id: r.itemId, position: r.position, expected: r.expected, received: r.received ?? null, unit_cost: r.unitCost,
    })),
  );
};

const SetStatus = async (q: Queryable, id: string, status: string): Promise<void> => {
  await deliveries(q).update({ id }, { status, ...(status === 'RECEIVED' && { received_at: () => 'now()' }) });
};

const SetLineReceived = async (q: Queryable, deliveryId: string, itemId: string, received: number): Promise<void> => {
  await lines(q).update({ delivery_id: deliveryId, item_id: itemId }, { received });
};

/** Open deliveries that include an item, for the item detail panel. */
const ListOpenForItem = (
  q: Queryable,
  itemId: string,): Promise<{ number: string; supplier_name: string; expected_at: DbDate; expected: number }[]> => {
  return q
    .createQueryBuilder(DeliveryLineEntity, 'dl')
    .select(['d.number AS number', 'd.supplier_name AS supplier_name', 'd.expected_at AS expected_at', 'dl.expected AS expected'])
    .innerJoin(NameOf(DeliveryEntity), 'd', 'd.id = dl.delivery_id')
    .where(`dl.item_id = :itemId AND d.status <> 'RECEIVED'`, { itemId })
    .orderBy('d.expected_at')
    .getRawMany();
};

export const deliveriesRepository = {
  List,
  FindByNumber,
  LockByNumber,
  ListLines,
  Next,
  Insert,
  InsertMany,
  InsertLines,
  SetStatus,
  SetLineReceived,
  ListOpenForItem,
};
