import { ToIso, ToIsoOrNull } from '@/backend/common/utils/dates';
import type { DeliveryLineRow, DeliveryRow } from '@/backend/db/schema';
import type { DeliveryResponseType, DeliveryStatusTypeEnum } from '@/backend/types/delivery';

/** Lines for a set of deliveries, with item names/locations. `$1` is an array of delivery ids. */
export const DELIVERY_LINES_SQL = `
  SELECT dl.delivery_id, dl.sku, i.name, i.location, dl.expected, dl.received
  FROM delivery_lines dl JOIN items i ON i.sku = dl.sku
  WHERE dl.delivery_id = ANY($1) ORDER BY dl.position`;

export function ToDeliveryResponse(row: DeliveryRow, lines: DeliveryLineRow[]): DeliveryResponseType {
  const own = lines.filter((l) => l.delivery_id === row.id);
  return {
    id: row.id,
    supplier: row.supplier,
    truck: row.truck,
    plate: row.plate,
    expectedAt: ToIso(row.expected_at),
    receivedAt: ToIsoOrNull(row.received_at),
    status: row.status as DeliveryStatusTypeEnum,
    lines: own.map((l) => ({ sku: l.sku, name: l.name, location: l.location, expected: l.expected, received: l.received })),
    totalExpected: own.reduce((s, l) => s + l.expected, 0),
  };
}
