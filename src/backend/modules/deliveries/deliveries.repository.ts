import { and, asc, eq, ilike, inArray, ne, or, sql } from 'drizzle-orm';
import type { Queryable } from '@/backend/db/client';
import { NextNumber } from '@/backend/db/next-number';
import { deliveries, deliveryLines, items, type DbDate, type DeliveryLineRow, type DeliveryRow } from '@/backend/db/schema';
import { DeliveryFilterTypeEnum, DeliveryStatusTypeEnum } from '@/backend/types/delivery';

export type DeliveryFiltersType = {
  /** UPCOMING: not received yet · RECEIVED */
  view?: DeliveryFilterTypeEnum;
  search?: string;
  supplierId?: string;
  limit?: number;
};

export type DeliveryInsertType = {
  businessId: string;
  number: string;
  supplierId: string | null;
  supplierName: string;
  vehicle: string;
  reference: string;
  expectedAt: DbDate;
  status: DeliveryStatusTypeEnum;
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

const List = (q: Queryable, businessId: string, filters: DeliveryFiltersType = {}): Promise<DeliveryRow[]> => {
  const like = filters.search ? `%${filters.search}%` : undefined;
  const received = eq(deliveries.status, DeliveryStatusTypeEnum.RECEIVED);
  return q
    .select()
    .from(deliveries)
    .where(
      and(
        eq(deliveries.business_id, businessId),
        filters.view === DeliveryFilterTypeEnum.UPCOMING ? ne(deliveries.status, DeliveryStatusTypeEnum.RECEIVED) : undefined,
        filters.view === DeliveryFilterTypeEnum.RECEIVED ? received : undefined,
        filters.supplierId ? eq(deliveries.supplier_id, filters.supplierId) : undefined,
        like
          ? or(ilike(deliveries.number, like), ilike(deliveries.supplier_name, like), ilike(deliveries.vehicle, like), ilike(deliveries.reference, like))
          : undefined,
      ),
    )
    // Upcoming first, soonest first; then received, newest first.
    .orderBy(
      sql`case when ${received} then 1 else 0 end`,
      sql`case when ${received} then null else ${deliveries.expected_at} end`,
      sql`${deliveries.received_at} desc nulls last`,
    )
    .limit(filters.limit ?? 500);
};

const FindByNumber = async (q: Queryable, businessId: string, number: string): Promise<DeliveryRow | undefined> => {
  const [row] = await q.select().from(deliveries).where(and(eq(deliveries.business_id, businessId), eq(deliveries.number, number)));
  return row;
};

/** The delivery row is locked for the rest of the transaction, so it can only be received once. */
const LockByNumber = async (q: Queryable, businessId: string, number: string): Promise<DeliveryRow | undefined> => {
  const [row] = await q
    .select()
    .from(deliveries)
    .where(and(eq(deliveries.business_id, businessId), eq(deliveries.number, number)))
    .for('update');
  return row;
};

const ListLines = async (q: Queryable, deliveryIds: string[]): Promise<DeliveryLineRow[]> => {
  if (!deliveryIds.length) return [];
  return q
    .select({
      delivery_id: deliveryLines.delivery_id,
      item_id: deliveryLines.item_id,
      expected: deliveryLines.expected,
      received: deliveryLines.received,
      unit_cost: deliveryLines.unit_cost,
      sku: items.sku,
      name: items.name,
      unit: items.unit,
      location: items.location,
    })
    .from(deliveryLines)
    .innerJoin(items, eq(items.id, deliveryLines.item_id))
    .where(inArray(deliveryLines.delivery_id, deliveryIds))
    .orderBy(asc(deliveryLines.position));
};

const Next = (q: Queryable, businessId: string, prefix: string) => NextNumber(q, deliveries, businessId, prefix, 2001);

const toDeliveryRecord = (input: DeliveryInsertType) => ({
  business_id: input.businessId,
  number: input.number,
  supplier_id: input.supplierId,
  supplier_name: input.supplierName,
  vehicle: input.vehicle,
  reference: input.reference,
  expected_at: new Date(input.expectedAt),
  received_at: input.receivedAt ? new Date(input.receivedAt) : null,
  status: input.status,
});

const Insert = async (q: Queryable, input: DeliveryInsertType): Promise<string> => {
  const [row] = await q.insert(deliveries).values(toDeliveryRecord(input)).returning({ id: deliveries.id });
  return row.id;
};

/** Many deliveries in one statement. Returns each new id with its number (unique within a business). */
const InsertMany = async (q: Queryable, rows: DeliveryInsertType[]): Promise<{ id: string; number: string }[]> => {
  if (!rows.length) return [];
  return q.insert(deliveries).values(rows.map(toDeliveryRecord)).returning({ id: deliveries.id, number: deliveries.number });
};

/** Every line in one statement. */
const InsertLines = async (q: Queryable, rows: DeliveryLineInsertType[]): Promise<void> => {
  if (!rows.length) return;
  await q.insert(deliveryLines).values(
    rows.map((r) => ({
      delivery_id: r.deliveryId, item_id: r.itemId, position: r.position, expected: r.expected, received: r.received ?? null, unit_cost: String(r.unitCost),
    })),
  );
};

const SetStatus = async (q: Queryable, id: string, status: DeliveryStatusTypeEnum): Promise<void> => {
  await q
    .update(deliveries)
    .set({ status, ...(status === DeliveryStatusTypeEnum.RECEIVED && { received_at: new Date() }) })
    .where(eq(deliveries.id, id));
};

const SetLineReceived = async (q: Queryable, deliveryId: string, itemId: string, received: number): Promise<void> => {
  await q.update(deliveryLines).set({ received }).where(and(eq(deliveryLines.delivery_id, deliveryId), eq(deliveryLines.item_id, itemId)));
};

/** Open deliveries that include an item, for the item detail panel. */
const ListOpenForItem = (
  q: Queryable,
  itemId: string,): Promise<{ number: string; supplier_name: string; expected_at: DbDate; expected: number }[]> => {
  return q
    .select({ number: deliveries.number, supplier_name: deliveries.supplier_name, expected_at: deliveries.expected_at, expected: deliveryLines.expected })
    .from(deliveryLines)
    .innerJoin(deliveries, eq(deliveries.id, deliveryLines.delivery_id))
    .where(and(eq(deliveryLines.item_id, itemId), ne(deliveries.status, DeliveryStatusTypeEnum.RECEIVED)))
    .orderBy(asc(deliveries.expected_at));
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
