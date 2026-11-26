import type { DbDate, DbNumeric } from './_shared';

export type ItemRecord = {
  id: string;
  business_id: string;
  sku: string;
  name: string;
  category: string;
  unit: string;
  kind: string;
  on_hand: number;
  reorder_level: number;
  cost: DbNumeric;
  price: DbNumeric;
  location: string | null;
  supplier_id: string | null;
  archived_at: DbDate | null;
  created_at: DbDate;
};

/** Row shape of the `item_views` view (snake_case, before mapping). */
export type ItemViewRow = {
  id: string;
  business_id: string;
  sku: string;
  name: string;
  category: string;
  unit: string;
  kind: string;
  on_hand: number;
  reorder_level: number;
  cost: DbNumeric;
  price: DbNumeric;
  location: string | null;
  supplier_id: string | null;
  reserved: number;
  available: number;
  incoming: number;
  status: string;
};

export type ItemComponentRow = {
  parent_id: string;
  component_id: string;
  qty: number;
};
