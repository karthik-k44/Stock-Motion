/** Row shapes as returned by the database (snake_case, before mapping). */
export type OrderRow = {
  id: string;
  customer: string;
  requested_date: Date | string;
  created_at: Date | string;
  status: string;
  assignee: string;
};

export type OrderLineRow = {
  order_id: string;
  sku: string;
  name: string;
  location: string | null;
  qty: number;
  picked: number;
};
