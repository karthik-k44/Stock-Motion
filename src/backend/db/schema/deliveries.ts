import type { DbDate, DbNumeric } from './_shared';

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
  created_at: DbDate;
};

export type DeliveryLineRecord = {
  delivery_id: string;
  item_id: string;
  position: number;
  expected: number;
  received: number | null;
  unit_cost: DbNumeric;
};

/** A delivery line with its item's details. */
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
