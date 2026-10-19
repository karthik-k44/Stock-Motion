import { OrderStatusTypeEnum, type OrderResponseType, type OrderShortageType } from '../types';

export const ORDER_STEPS: OrderStatusTypeEnum[] = [
  OrderStatusTypeEnum.NEW,
  OrderStatusTypeEnum.PICKING,
  OrderStatusTypeEnum.PACKED,
  OrderStatusTypeEnum.SHIPPED,
];

export const STATUS_TONE = { NEW: 'info', PICKING: 'reserved', PACKED: 'warning', SHIPPED: 'good' } as const;

export const OpenUnits = (o: OrderResponseType) => o.totalUnits - o.pickedUnits;

export const AllPicked = (o: OrderResponseType) => o.lines.every((l) => l.picked >= l.qty);

/** Lines that current available stock can't cover (client-side preview of the server check). */
export function PreviewShortages(o: OrderResponseType, available: Map<string, number>): OrderShortageType[] {
  return o.lines
    .map((l) => ({ sku: l.sku, name: l.name, needed: l.qty - l.picked, available: available.get(l.sku) ?? 0 }))
    .filter((s) => s.needed > s.available);
}

/** Shortages attached to a 409 from start-picking, if any. */
export function ShortagesFromError(details: unknown): OrderShortageType[] {
  if (details && typeof details === 'object' && 'shortages' in details && Array.isArray((details as { shortages: unknown }).shortages)) {
    return (details as { shortages: OrderShortageType[] }).shortages;
  }
  return [];
}
