import type { WorldContextType, WorldStatType } from '../types';

/** The live numbers of one storage zone. */
export function ZoneStats(ctx: WorldContextType, zone: string): WorldStatType[] {
  const z = ctx.dashboard.zones.find((x) => x.zone === zone);
  if (!z) return [{ label: 'Items stored', value: 0 }];
  return [
    { label: 'Items stored', value: ctx.locations.filter((l) => l.zone === zone).reduce((s, l) => s + l.items.length, 0) },
    { label: 'Units on hand', value: z.units },
    { label: 'Low stock', value: z.lowStock, tone: z.lowStock ? 'warning' : 'good' },
    { label: 'Out of stock', value: z.outOfStock, tone: z.outOfStock ? 'critical' : 'good' },
  ];
}

export function ZoneAlert(ctx: WorldContextType, zone: string): string | null {
  const z = ctx.dashboard.zones.find((x) => x.zone === zone);
  if (!z || !(z.outOfStock + z.lowStock)) return null;
  const out = ctx.locations
    .filter((l) => l.zone === zone)
    .flatMap((l) => l.items)
    .filter((i) => i.status !== 'IN_STOCK')
    .map((i) => i.name);
  return `${out.slice(0, 3).join(', ')}${out.length > 3 ? ` +${out.length - 3} more` : ''} ${out.length === 1 ? 'needs' : 'need'} restocking`;
}

/** Open orders in the stages of the template flow that match `pick`. */
export function OpenIn(ctx: WorldContextType, pick: (s: { reserves: boolean; consumeLines: boolean; index: number }) => boolean): number {
  return ctx.template.orderFlow.reduce(
    (sum, s, index) => sum + (!s.closed && pick({ reserves: s.reserves, consumeLines: s.consumeLines, index }) ? (ctx.dashboard.ordersByStatus[s.status] ?? 0) : 0),
    0,
  );
}

export const OpenCount = (ctx: WorldContextType, status: string) => ctx.dashboard.ordersByStatus[status] ?? 0;

/** Upcoming deliveries by status. */
export const Deliveries = (ctx: WorldContextType, status?: string) =>
  ctx.dashboard.upcomingDeliveries.filter((d) => !status || d.status === status).length;

/** Minutes until the next expected delivery (0 if one is due now). */
export function NextDeliveryMinutes(ctx: WorldContextType): number {
  const next = ctx.dashboard.upcomingDeliveries[0];
  if (!next) return 0;
  return Math.max(0, Math.round((new Date(next.expectedAt).getTime() - Date.now()) / 60_000));
}

export const ZoneOf = (ctx: WorldContextType, sku: string) => ctx.locations.find((l) => l.items.some((i) => i.sku === sku))?.zone;
