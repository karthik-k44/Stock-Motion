import type { DeliveryResponseType } from '@/frontend/features/deliveries/types';
import { StockStatusTypeEnum, type ItemResponseType } from '@/frontend/features/inventory/types';
import { FormatTime, IsPast, RelativeTime } from '@/frontend/utils/format';
import type { WorldContextType, WorldStatType, WorldTagType } from '../types';

export const ZoneItems = (ctx: WorldContextType, zone: string): ItemResponseType[] =>
  ctx.locations.filter((l) => l.zone === zone).flatMap((l) => l.items);

/** The live numbers of one storage zone. */
export const ZoneStats = (ctx: WorldContextType, zone: string): WorldStatType[] => {
  const z = ctx.dashboard.zones.find((x) => x.zone === zone);
  if (!z) return [{ label: 'Items stored', value: 0 }];
  return [
    { label: 'Items stored', value: ZoneItems(ctx, zone).length },
    { label: 'Units on hand', value: z.units },
    { label: 'Low stock', value: z.lowStock, tone: z.lowStock ? 'warning' : 'good' },
    { label: 'Out of stock', value: z.outOfStock, tone: z.outOfStock ? 'critical' : 'good' },
  ];
};

export const ZoneAlert = (ctx: WorldContextType, zone: string): string | null => {
  const short = ZoneItems(ctx, zone)
    .filter((i) => i.status !== StockStatusTypeEnum.IN_STOCK)
    .map((i) => i.name);
  if (!short.length) return null;
  return `${short.slice(0, 3).join(', ')}${short.length > 3 ? ` +${short.length - 3} more` : ''} ${short.length === 1 ? 'needs' : 'need'} restocking`;
};

/** "2 low · 1 out", or how much is stored when nothing is short. */
export const ZoneTag = (ctx: WorldContextType, zone: string): WorldTagType => {
  const items = ZoneItems(ctx, zone);
  if (!items.length) return { text: 'Empty', tone: 'neutral' };
  const low = items.filter((i) => i.status === StockStatusTypeEnum.LOW).length;
  const out = items.filter((i) => i.status === StockStatusTypeEnum.OUT).length;
  if (!low && !out) return { text: `${items.length} stocked`, tone: 'good' };
  return { text: [low && `${low} low`, out && `${out} out`].filter(Boolean).join(' · '), tone: out ? 'critical' : 'warning' };
};

/** Open orders in the stages of the template flow that match `pick`. */
export const OpenIn = (ctx: WorldContextType, pick: (s: { reserves: boolean; consumeLines: boolean; index: number }) => boolean): number => {
  return ctx.template.orderFlow.reduce(
    (sum, s, index) => sum + (!s.closed && pick({ reserves: s.reserves, consumeLines: s.consumeLines, index }) ? (ctx.dashboard.ordersByStatus[s.status] ?? 0) : 0),
    0,
  );
};

export const OpenCount = (ctx: WorldContextType, status: string) => ctx.dashboard.ordersByStatus[status] ?? 0;

/** Deliveries not yet received, optionally of one status. */
export const Deliveries = (ctx: WorldContextType, status?: string) => ctx.deliveries.filter((d) => !status || d.status === status).length;

/** Minutes until the next expected delivery (0 if one is due now). */
export const NextDeliveryMinutes = (ctx: WorldContextType): number => {
  const next = ctx.deliveries[0];
  if (!next) return 0;
  return Math.max(0, Math.round((new Date(next.expectedAt).getTime() - Date.now()) / 60_000));
};

/** "DLV-2041 due 14:30", "… on the way", "… arrived" or "… late". */
export const DeliveryTag = (next: DeliveryResponseType): WorldTagType => {
  if (next.status === 'ARRIVED') return { text: `${next.number} arrived`, tone: 'warning' };
  if (next.status === 'IN_TRANSIT') return { text: `${next.number} on the way`, tone: 'info' };
  if (IsPast(next.expectedAt)) return { text: `${next.number} late`, tone: 'warning' };
  const today = new Date(next.expectedAt).toDateString() === new Date().toDateString();
  return { text: `${next.number} due ${today ? FormatTime(next.expectedAt) : RelativeTime(next.expectedAt)}`, tone: 'neutral' };
};

/** The tag for the next delivery, or that nothing is booked. */
export const NextDeliveryTag = (ctx: WorldContextType): WorldTagType =>
  ctx.deliveries[0] ? DeliveryTag(ctx.deliveries[0]) : { text: `No ${ctx.template.labels.deliveries.toLowerCase()} booked`, tone: 'neutral' };

/** "3 open · 1 packed" for the orders an object works on. */
export const OrdersTag = (ctx: WorldContextType, statuses?: string[]): WorldTagType => {
  const open = ctx.orders.filter((o) => !statuses || statuses.includes(o.status));
  if (!open.length) return { text: `No open ${ctx.template.labels.orders.toLowerCase()}`, tone: 'neutral' };
  return { text: `${open.length} open`, tone: 'info' };
};

export const ZoneOf = (ctx: WorldContextType, sku: string) => ctx.locations.find((l) => l.items.some((i) => i.sku === sku))?.zone;
