import type { Queryable } from '@/backend/db/client';
import { NextNumber } from '@/backend/db/next-number';
import type { DbDate, DeliveryLineRow, DeliveryRow } from '@/backend/db/schema';

export type DeliveryFiltersType = {
  /** UPCOMING: not received yet · RECEIVED */
  view?: 'ALL' | 'UPCOMING' | 'RECEIVED';
  search?: string;
  supplierId?: string;
  limit?: number;
};

async function List(q: Queryable, businessId: string, filters: DeliveryFiltersType = {}): Promise<DeliveryRow[]> {
  const where = ['business_id = $1'];
  const params: unknown[] = [businessId];
  if (filters.view === 'UPCOMING') where.push(`status <> 'RECEIVED'`);
  if (filters.view === 'RECEIVED') where.push(`status = 'RECEIVED'`);
  if (filters.supplierId) {
    params.push(filters.supplierId);
    where.push(`supplier_id = $${params.length}`);
  }
  if (filters.search) {
    params.push(`%${filters.search}%`);
    where.push(`(number ILIKE $${params.length} OR supplier_name ILIKE $${params.length} OR vehicle ILIKE $${params.length} OR reference ILIKE $${params.length})`);
  }
  params.push(filters.limit ?? 500);
  const { rows } = await q.query<DeliveryRow>(
    `SELECT * FROM deliveries WHERE ${where.join(' AND ')}
     ORDER BY CASE status WHEN 'RECEIVED' THEN 1 ELSE 0 END,
              CASE WHEN status = 'RECEIVED' THEN NULL ELSE expected_at END,
              received_at DESC NULLS LAST
     LIMIT $${params.length}`,
    params,
  );
  return rows;
}

async function FindByNumber(q: Queryable, businessId: string, number: string): Promise<DeliveryRow | undefined> {
  const { rows } = await q.query<DeliveryRow>('SELECT * FROM deliveries WHERE business_id = $1 AND number = $2', [businessId, number]);
  return rows[0];
}

async function LockByNumber(q: Queryable, businessId: string, number: string): Promise<DeliveryRow | undefined> {
  const { rows } = await q.query<DeliveryRow>('SELECT * FROM deliveries WHERE business_id = $1 AND number = $2 FOR UPDATE', [
    businessId,
    number,
  ]);
  return rows[0];
}

async function ListLines(q: Queryable, deliveryIds: string[]): Promise<DeliveryLineRow[]> {
  if (!deliveryIds.length) return [];
  const { rows } = await q.query<DeliveryLineRow>(
    `SELECT dl.delivery_id, dl.item_id, i.sku, i.name, i.unit, i.location, dl.expected, dl.received, dl.unit_cost
     FROM delivery_lines dl JOIN items i ON i.id = dl.item_id
     WHERE dl.delivery_id = ANY($1) ORDER BY dl.position`,
    [deliveryIds],
  );
  return rows;
}

const Next = (q: Queryable, businessId: string, prefix: string) => NextNumber(q, 'deliveries', businessId, prefix, 2001);

async function Insert(
  q: Queryable,
  input: {
    businessId: string;
    number: string;
    supplierId: string | null;
    supplierName: string;
    vehicle: string;
    reference: string;
    expectedAt: DbDate;
    status: string;
    receivedAt?: DbDate | null;
  },
): Promise<string> {
  const { rows } = await q.query<{ id: string }>(
    `INSERT INTO deliveries (business_id, number, supplier_id, supplier_name, vehicle, reference, expected_at, received_at, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
    [
      input.businessId, input.number, input.supplierId, input.supplierName, input.vehicle, input.reference,
      input.expectedAt, input.receivedAt ?? null, input.status,
    ],
  );
  return rows[0].id;
}

async function InsertLine(
  q: Queryable,
  input: { deliveryId: string; itemId: string; position: number; expected: number; received?: number | null; unitCost: number },
): Promise<void> {
  await q.query(
    'INSERT INTO delivery_lines (delivery_id, item_id, position, expected, received, unit_cost) VALUES ($1, $2, $3, $4, $5, $6)',
    [input.deliveryId, input.itemId, input.position, input.expected, input.received ?? null, input.unitCost],
  );
}

async function SetStatus(q: Queryable, id: string, status: string): Promise<void> {
  await q.query(
    `UPDATE deliveries SET status = $2, received_at = CASE WHEN $2 = 'RECEIVED' THEN now() ELSE received_at END WHERE id = $1`,
    [id, status],
  );
}

async function SetLineReceived(q: Queryable, deliveryId: string, itemId: string, received: number): Promise<void> {
  await q.query('UPDATE delivery_lines SET received = $3 WHERE delivery_id = $1 AND item_id = $2', [deliveryId, itemId, received]);
}

/** Open deliveries that include an item, for the item detail panel. */
async function ListOpenForItem(
  q: Queryable,
  itemId: string,
): Promise<{ number: string; supplier_name: string; expected_at: DbDate; expected: number }[]> {
  const { rows } = await q.query<{ number: string; supplier_name: string; expected_at: DbDate; expected: number }>(
    `SELECT d.number, d.supplier_name, d.expected_at, dl.expected
     FROM delivery_lines dl JOIN deliveries d ON d.id = dl.delivery_id
     WHERE dl.item_id = $1 AND d.status <> 'RECEIVED' ORDER BY d.expected_at`,
    [itemId],
  );
  return rows;
}

export const deliveriesRepository = {
  List,
  FindByNumber,
  LockByNumber,
  ListLines,
  Next,
  Insert,
  InsertLine,
  SetStatus,
  SetLineReceived,
  ListOpenForItem,
};
