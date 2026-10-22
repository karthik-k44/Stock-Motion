import type { DbDate, DbNumeric } from './_shared';

/** Row shapes as returned by the database (snake_case, before mapping). */
export type OrderRow = {
  id: string;
  business_id: string;
  number: string;
  customer_id: string | null;
  customer_name: string;
  status: string;
  reserves: boolean;
  closed: boolean;
  cancelled: boolean;
  due_at: DbDate | null;
  assignee_id: string | null;
  assignee_name: string | null;
  notes: string;
  created_at: DbDate;
  closed_at: DbDate | null;
};

export type OrderLineRow = {
  order_id: string;
  item_id: string;
  sku: string;
  name: string;
  kind: string;
  unit: string;
  location: string | null;
  qty: number;
  done: number;
  unit_price: DbNumeric;
};
