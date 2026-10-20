import { ToIso, ToIsoOrNull } from '@/backend/common/utils/dates';
import type { DeliveryLineRow, DeliveryRow } from '@/backend/db/schema';
import type { DeliveryResponseType, DeliveryStatusTypeEnum } from '@/backend/types/delivery';

export const ToDeliveryResponse = (row: DeliveryRow, lines: DeliveryLineRow[]): DeliveryResponseType => {
  const own = lines
    .filter((l) => l.delivery_id === row.id)
    .map((l) => ({
      sku: l.sku, name: l.name, unit: l.unit, location: l.location, expected: l.expected, received: l.received, unitCost: Number(l.unit_cost),
    }));
  return {
    number: row.number,
    supplierId: row.supplier_id,
    supplierName: row.supplier_name,
    vehicle: row.vehicle,
    reference: row.reference,
    expectedAt: ToIso(row.expected_at),
    receivedAt: ToIsoOrNull(row.received_at),
    status: row.status as DeliveryStatusTypeEnum,
    lines: own,
    totalExpected: own.reduce((s, l) => s + l.expected, 0),
    totalCost: Math.round(own.reduce((s, l) => s + (l.received ?? l.expected) * l.unitCost, 0) * 100) / 100,
  };
};
