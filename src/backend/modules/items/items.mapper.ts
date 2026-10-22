import type { ItemViewRow } from '@/backend/db/schema';
import type { ItemKindTypeEnum, ItemResponseType, StockStatusTypeEnum } from '@/backend/types/item';

export const ToItemResponse = (r: ItemViewRow): ItemResponseType => {
  return {
    id: r.id,
    sku: r.sku,
    name: r.name,
    category: r.category,
    unit: r.unit,
    kind: r.kind as ItemKindTypeEnum,
    onHand: r.on_hand,
    reorderLevel: r.reorder_level,
    cost: Number(r.cost),
    price: Number(r.price),
    location: r.location,
    supplierId: r.supplier_id,
    reserved: r.reserved,
    available: r.available,
    incoming: r.incoming,
    status: r.status as StockStatusTypeEnum,
  };
};
