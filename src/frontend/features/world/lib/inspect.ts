import type { StorageZoneType } from '@/frontend/features/businesses/types';
import { StockStatusTypeEnum, type ItemResponseType } from '@/frontend/features/inventory/types';
import type { LocationResponseType } from '@/frontend/features/locations/types';
import { StatusLabel, StatusLook } from '@/frontend/features/orders/lib/order-flow';
import { DayLabel, FormatQty, FormatTime } from '@/frontend/utils/format';
import { HumanizeDeliveryStatus } from '@/frontend/utils/humanize';
import type { WorldBinType, WorldContextType, WorldFactType, WorldInspectorType, WorldObjectSpecType, WorldToneType } from '../types';
import { ZoneItems } from './world-stats';

const SEVERITY: Record<StockStatusTypeEnum, number> = { OUT: 0, LOW: 1, IN_STOCK: 2 };
export const STOCK_TONE: Record<StockStatusTypeEnum, WorldToneType> = { IN_STOCK: 'good', LOW: 'warning', OUT: 'critical' };
export const DELIVERY_TONE = { SCHEDULED: 'neutral', IN_TRANSIT: 'info', ARRIVED: 'incoming', RECEIVED: 'good' } as const;
const MAX_FACTS = 8;

const worst = (items: ItemResponseType[]) => items.reduce<StockStatusTypeEnum | null>((w, i) => (w === null || SEVERITY[i.status] < SEVERITY[w] ? i.status : w), null);

/** The zone's real slots, top level first, each coloured by the worst stock status it holds. */
const BinsOf = (zone: StorageZoneType, locations: LocationResponseType[]): { columns: number; cells: WorldBinType[] } => {
  const sorted = [...locations].sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true }));
  const columns = Math.max(1, Math.min(zone.bins > 1 ? zone.bins : 4, 10, sorted.length));
  const rows: LocationResponseType[][] = [];
  for (let i = 0; i < sorted.length; i += columns) rows.push(sorted.slice(i, i + columns));
  const cells = rows.reverse().flat().map((l): WorldBinType => ({
    code: l.code,
    status: worst(l.items) ?? 'EMPTY',
    label: `${l.code}: ${l.items.length ? l.items.map((i) => i.name).join(', ') : 'empty'}`,
  }));
  return { columns, cells };
};

/** "12 ea · low · +40 coming" */
export const ItemFactValue = (i: ItemResponseType): string => {
  const parts = [FormatQty(i.onHand, i.unit)];
  if (i.status === StockStatusTypeEnum.LOW) parts.push('low');
  if (i.status === StockStatusTypeEnum.OUT) parts.push('out');
  if (i.incoming > 0) parts.push(`+${i.incoming} coming`);
  return parts.join(' · ');
};

/** The records an object stands for: a zone's items, the deliveries at a dock, the orders on a bench. */
const RecordFacts = (spec: WorldObjectSpecType, ctx: WorldContextType): WorldFactType[] => {
  if (spec.zone) {
    return [...ZoneItems(ctx, spec.zone)]
      .sort((a, b) => SEVERITY[a.status] - SEVERITY[b.status] || a.name.localeCompare(b.name))
      .slice(0, MAX_FACTS)
      .map((i) => ({ key: i.sku, label: i.name, value: ItemFactValue(i), tone: i.status === 'IN_STOCK' ? undefined : STOCK_TONE[i.status], select: { kind: 'item', sku: i.sku } }));
  }
  if (spec.handles === 'deliveries') {
    return ctx.deliveries.slice(0, MAX_FACTS).map((d) => ({
      key: d.number,
      label: `${d.number} · ${d.supplierName}`,
      value: d.status === 'SCHEDULED' ? `${DayLabel(d.expectedAt)} ${FormatTime(d.expectedAt)}` : HumanizeDeliveryStatus(d.status),
      tone: DELIVERY_TONE[d.status],
      select: { kind: 'delivery', number: d.number },
    }));
  }
  if (spec.handles === 'orders') {
    return ctx.orders.slice(0, MAX_FACTS).map((o) => ({
      key: o.number,
      label: `${o.number} · ${o.customerName}`,
      value: `${StatusLabel(ctx.template.orderFlow, o.status)}${o.totalUnits ? ` · ${o.doneUnits}/${o.totalUnits}` : ''}`,
      tone: StatusLook(ctx.template.orderFlow, o.status).tone,
      select: { kind: 'order', number: o.number },
    }));
  }
  return [];
};

const EmptyFacts = (spec: WorldObjectSpecType, ctx: WorldContextType): string | undefined => {
  const { labels } = ctx.template;
  if (spec.zone) return `Nothing stored here yet. Give a ${labels.item.toLowerCase()} a location in this area and it appears on the shelf.`;
  if (spec.handles === 'deliveries') return `No ${labels.deliveries.toLowerCase()} booked. Book one and it drives in here.`;
  if (spec.handles === 'orders') return `No open ${labels.orders.toLowerCase()}. New ones show up here as they come in.`;
  return undefined;
};

export const InspectObject = (spec: WorldObjectSpecType, ctx: WorldContextType): WorldInspectorType => {
  const tag = spec.tag(ctx);
  const zone = spec.zone ? ctx.template.zones.find((z) => z.code === spec.zone) : undefined;
  const locations = spec.zone ? ctx.locations.filter((l) => l.zone === spec.zone) : [];
  const used = locations.filter((l) => l.items.length).length;
  const facts = RecordFacts(spec, ctx);
  const records = spec.zone ? ZoneItems(ctx, spec.zone).length : spec.handles === 'deliveries' ? ctx.deliveries.length : spec.handles === 'orders' ? ctx.orders.length : 0;
  return {
    icon: spec.icon,
    eyebrow: spec.kind,
    title: spec.label,
    subtitle: zone ? `${zone.name} · ${locations.length} ${ctx.template.labels.locations.toLowerCase()}` : ctx.template.name,
    status: { label: tag.text, tone: tag.tone, note: records > facts.length ? `Showing ${facts.length} of ${records}` : undefined },
    progress: zone && locations.length ? { value: used, max: locations.length, label: `${used} of ${locations.length} slots in use` } : null,
    bins: zone && locations.length ? BinsOf(zone, locations) : null,
    alert: spec.alert?.(ctx) ?? null,
    stats: spec.stats(ctx),
    facts,
    emptyFacts: EmptyFacts(spec, ctx),
    actions: spec.link ? [{ label: spec.link.label, to: spec.link.to, primary: true }] : [],
  };
};
