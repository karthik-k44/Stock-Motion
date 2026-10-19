import { AdjustModeTypeEnum, ItemKindTypeEnum, StockStatusTypeEnum, type ItemResponseType } from '../types';

/** On-hand quantity after an adjustment. */
export function NextOnHand(onHand: number, mode: AdjustModeTypeEnum, qty: number): number {
  if (mode === AdjustModeTypeEnum.ADD) return onHand + qty;
  if (mode === AdjustModeTypeEnum.REMOVE) return onHand - qty;
  return qty;
}

/** Same rule as the backend `item_views` view, for optimistic previews. */
export function StatusOf(item: Pick<ItemResponseType, 'kind' | 'onHand' | 'available' | 'reorderLevel'>): StockStatusTypeEnum {
  if (item.kind === ItemKindTypeEnum.SERVICE) return StockStatusTypeEnum.IN_STOCK;
  if (item.kind === ItemKindTypeEnum.MADE ? item.available === 0 : item.onHand <= 0) return StockStatusTypeEnum.OUT;
  if (item.available <= item.reorderLevel) return StockStatusTypeEnum.LOW;
  return StockStatusTypeEnum.IN_STOCK;
}

/** A stock item with a new on-hand quantity, its derived numbers recomputed. */
export function WithOnHand<T extends ItemResponseType>(item: T, onHand: number): T {
  const available = Math.max(onHand - item.reserved, 0);
  return { ...item, onHand, available, status: StatusOf({ ...item, onHand, available }) };
}
