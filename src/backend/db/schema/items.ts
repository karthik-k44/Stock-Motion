/** Row shape of the `item_views` view (snake_case, before mapping). */
export type ItemViewRow = {
  sku: string;
  name: string;
  category: string;
  unit: string;
  on_hand: number;
  reorder_level: number;
  location: string | null;
  reserved: number;
  available: number;
  incoming: number;
  status: string;
};
