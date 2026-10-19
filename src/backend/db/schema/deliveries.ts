/** Row shapes as returned by the database (snake_case, before mapping). */
export type DeliveryRow = {
  id: string;
  supplier: string;
  truck: string;
  plate: string;
  expected_at: Date | string;
  received_at: Date | string | null;
  status: string;
};

export type DeliveryLineRow = {
  delivery_id: string;
  sku: string;
  name: string;
  location: string | null;
  expected: number;
  received: number | null;
};
