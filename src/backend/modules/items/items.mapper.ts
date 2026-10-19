import type { ItemViewRow } from '@/backend/db/schema';
import type { CategoryTypeEnum, ItemResponseType, StockStatusTypeEnum } from '@/backend/types/item';

/** Columns of the `item_views` view (reserved / available / incoming / status are derived there). */
export const ITEM_VIEW_COLUMNS =
  'sku, name, category, unit, on_hand, reorder_level, location, reserved, available, incoming, status';

export function ToItemResponse(r: ItemViewRow): ItemResponseType {
  return {
    sku: r.sku,
    name: r.name,
    category: r.category as CategoryTypeEnum,
    unit: r.unit,
    onHand: r.on_hand,
    reorderLevel: r.reorder_level,
    location: r.location,
    reserved: r.reserved,
    available: r.available,
    incoming: r.incoming,
    status: r.status as StockStatusTypeEnum,
  };
}
