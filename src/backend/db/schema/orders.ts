import type { DbDate, DbNumeric } from './_shared';

export type OrderRecord = {
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
  notes: string;
  created_at: DbDate;
  closed_at: DbDate | null;
};

/** An order with its assignee's name. */
export type OrderRow = OrderRecord & { assignee_name: string | null };

export type OrderLineRecord = {
  order_id: string;
  item_id: string;
  position: number;
  qty: number;
  done: number;
  unit_price: DbNumeric;
};

/** An order line with its item's details. */
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
