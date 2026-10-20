import type { ItemResponseType, StockStatusTypeEnum } from '@/frontend/features/inventory/types';
import type { DeliveryResponseType } from '@/frontend/features/deliveries/types';
import type { SlotStatusType, WorldContextType } from '../../types';

const SLOT: Record<StockStatusTypeEnum, SlotStatusType> = { IN_STOCK: 'ok', LOW: 'low', OUT: 'out' };
const RANK: Record<SlotStatusType, number> = { out: 0, low: 1, ok: 2, empty: 3 };

/** The worst stock status among the items in one slot ("empty" when it holds nothing). */
export const SlotOf = (items: ItemResponseType[]): SlotStatusType =>
  items.reduce<SlotStatusType>((w, i) => (RANK[SLOT[i.status]] < RANK[w] ? SLOT[i.status] : w), 'empty');

/** Same codes the server generates for a template zone: A-2-3, FRIDGE-1, SITE. */
export const SlotCode = (zone: { code: string; levels: number; bins: number }, level: number, bin: number) =>
  zone.bins > 1 ? `${zone.code}-${level}-${bin}` : zone.levels > 1 ? `${zone.code}-${level}` : zone.code;

/** A zone's real slots as rows (bottom level first) of statuses, read from its locations. */
export const ZoneRows = (ctx: WorldContextType, code: string): SlotStatusType[][] => {
  const zone = ctx.template.zones.find((z) => z.code === code);
  if (!zone) return [];
  const byCode = new Map(ctx.locations.filter((l) => l.zone === code).map((l) => [l.code, l.items]));
  return Array.from({ length: zone.levels }, (_, li) => Array.from({ length: zone.bins }, (_, bi) => SlotOf(byCode.get(SlotCode(zone, li + 1, bi + 1)) ?? [])));
};

/** Every item in a zone, worst first — for pallets and freezer drawers that show stock one stack per item. */
export const ZoneStacks = (ctx: WorldContextType, code: string, max: number): SlotStatusType[] =>
  ctx.locations
    .filter((l) => l.zone === code)
    .flatMap((l) => l.items)
    .map((i) => SLOT[i.status])
    .sort((a, b) => RANK[a] - RANK[b])
    .slice(0, max);

/** Out-of-stock slots of a zone as [level, bin] (both from 0), for drop pins. */
export const OutSlots = (rows: SlotStatusType[][]): [number, number][] =>
  rows.flatMap((row, l) => row.flatMap((s, b) => (s === 'out' ? [[l, b] as [number, number]] : [])));

export const INBOUND_DOORS = 3;

const ARRIVAL_ORDER: Record<string, number> = { ARRIVED: 0, IN_TRANSIT: 1, SCHEDULED: 2 };

/**
 * Which delivery each inbound dock door is showing. Doors aren't booked in the app, so they are
 * filled in arrival order: trucks already at the dock first, then those on the way, then the next due.
 */
export const DockDoors = (ctx: WorldContextType): (DeliveryResponseType | null)[] => {
  const queue = [...ctx.deliveries].sort((a, b) => ARRIVAL_ORDER[a.status] - ARRIVAL_ORDER[b.status] || a.expectedAt.localeCompare(b.expectedAt));
  return Array.from({ length: INBOUND_DOORS }, (_, i) => queue[i] ?? null);
};

/** Orders packed and waiting to ship, oldest first — the one at the outbound door is the first. */
export const PackedOrders = (ctx: WorldContextType) => ctx.orders.filter((o) => o.status === 'PACKED');

/** A deterministic 0..1 spread so movers don't all start at the same spot. */
export const Spread = (i: number, n: number) => (n ? i / n : 0);
