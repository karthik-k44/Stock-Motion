import type { WorldContextType, WorldLayoutType, WorldSelectionType } from '../types';

export const FindDelivery = (ctx: WorldContextType, number: string) => ctx.deliveries.find((d) => d.number === number);
export const FindOrder = (ctx: WorldContextType, number: string) => ctx.orders.find((o) => o.number === number);
export const FindItem = (ctx: WorldContextType, sku: string) => ctx.items.find((i) => i.sku === sku);

/** The storage zone holding an item, from its location code. */
export const ZoneOfItem = (ctx: WorldContextType, sku: string) => {
  const code = FindItem(ctx, sku)?.location;
  return code ? ctx.locations.find((l) => l.code === code)?.zone : undefined;
};

/** The object in the scene that a selection belongs to (highlighted with a ring), if any. */
export const ObjectIdOf = (layout: WorldLayoutType, ctx: WorldContextType, selection: WorldSelectionType | null): string | null => {
  if (!selection) return null;
  switch (selection.kind) {
    case 'object':
      return selection.id;
    case 'delivery':
      return layout.objects.find((o) => o.handles === 'deliveries')?.id ?? null;
    case 'order':
      return layout.objects.find((o) => o.handles === 'orders')?.id ?? null;
    case 'item': {
      const zone = ZoneOfItem(ctx, selection.sku);
      return (zone && layout.objects.find((o) => o.zone === zone)?.id) || null;
    }
  }
};

/** A selected record that no longer exists (received, closed, archived) falls back to nothing selected. */
export const StillExists = (ctx: WorldContextType, layout: WorldLayoutType, selection: WorldSelectionType): boolean => {
  switch (selection.kind) {
    case 'object':
      return layout.objects.some((o) => o.id === selection.id);
    case 'delivery':
      return Boolean(FindDelivery(ctx, selection.number));
    case 'order':
      return Boolean(FindOrder(ctx, selection.number));
    case 'item':
      return Boolean(FindItem(ctx, selection.sku));
  }
};

export const SameSelection = (a: WorldSelectionType | null, b: WorldSelectionType | null) => JSON.stringify(a) === JSON.stringify(b);
