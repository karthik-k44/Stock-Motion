import type { DbDate, DbNumeric } from './_shared';

/** Row shapes as returned by the database (snake_case, before mapping). */
export type DeliveryRow = {
  id: string;
  business_id: string;
  number: string;
  supplier_id: string | null;
  supplier_name: string;
  vehicle: string;
  reference: string;
  expected_at: DbDate;
  received_at: DbDate | null;
  status: string;
};

export type DeliveryLineRow = {
  delivery_id: string;
  item_id: string;
  sku: string;
  name: string;
  unit: string;
  location: string | null;
  expected: number;
  received: number | null;
  unit_cost: DbNumeric;
};
