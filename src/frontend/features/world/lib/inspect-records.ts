import { paths } from '@/frontend/config/paths';
import type { DeliveryResponseType } from '@/frontend/features/deliveries/types';
import { ItemKindTypeEnum, type ItemResponseType } from '@/frontend/features/inventory/types';
import { StatusLabel, StatusLook } from '@/frontend/features/orders/lib/order-flow';
import type { OrderResponseType } from '@/frontend/features/orders/types';
import { DayLabel, FormatDateTime, FormatMoney, FormatQty, FormatTime, IsPast, RelativeTime } from '@/frontend/utils/format';
import { HumanizeDeliveryStatus, HumanizeStockStatus } from '@/frontend/utils/humanize';
import type { WorldContextType, WorldFactType, WorldInspectorType } from '../types';
import { DELIVERY_TONE, STOCK_TONE } from './inspect';
import { FindItem } from './selection';

const due = (iso: string) => (IsPast(iso) ? `Was due ${FormatDateTime(iso)}` : `Due ${DayLabel(iso).toLowerCase()} ${FormatTime(iso)} · ${RelativeTime(iso)}`);

const BLANK = { progress: null, bins: null, alert: null, stats: [] } satisfies Partial<WorldInspectorType>;

export const InspectDelivery = (d: DeliveryResponseType, ctx: WorldContextType): WorldInspectorType => {
  const { labels } = ctx.template;
  const lines: WorldFactType[] = d.lines.map((l) => {
    const item = FindItem(ctx, l.sku);
    const short = item && item.status !== 'IN_STOCK';
    return {
      key: l.sku,
      label: l.name,
      value: `+${FormatQty(l.expected, l.unit)}${short ? ` · now ${item.status === 'OUT' ? 'out' : 'low'}` : ''}`,
      tone: short ? STOCK_TONE[item.status] : undefined,
      select: item ? { kind: 'item', sku: l.sku } : undefined,
    };
  });
  return {
    ...BLANK,
    icon: 'truck',
    eyebrow: `${labels.delivery} · inbound`,
    title: d.number,
    subtitle: [d.supplierName, d.vehicle, d.reference].filter(Boolean).join(' · '),
    status: { label: HumanizeDeliveryStatus(d.status), tone: DELIVERY_TONE[d.status], note: due(d.expectedAt) },
    alert: d.status === 'SCHEDULED' && IsPast(d.expectedAt) ? `Expected ${RelativeTime(d.expectedAt)} and not on the way yet` : null,
    facts: [
      { key: 'units', label: 'Units booked', value: `${d.totalExpected} in ${d.lines.length} line${d.lines.length === 1 ? '' : 's'}` },
      ...lines,
      { key: 'cost', label: 'Value at cost', value: FormatMoney(d.totalCost, ctx.currency) },
    ],
    actions: [
      { label: `Open ${labels.delivery.toLowerCase()}`, to: paths.delivery(d.number), primary: true },
      { label: `All ${labels.deliveries.toLowerCase()}`, to: paths.deliveries },
    ],
  };
};

export const InspectOrder = (o: OrderResponseType, ctx: WorldContextType): WorldInspectorType => {
  const { labels, orderFlow } = ctx.template;
  const look = StatusLook(orderFlow, o.status);
  const lines: WorldFactType[] = o.lines.map((l) => ({
    key: l.sku,
    label: l.name,
    value: l.kind === ItemKindTypeEnum.SERVICE ? FormatQty(l.qty, l.unit) : `${l.done} / ${FormatQty(l.qty, l.unit)}`,
    tone: l.kind !== ItemKindTypeEnum.SERVICE && l.done >= l.qty ? 'good' : undefined,
    select: FindItem(ctx, l.sku) ? { kind: 'item', sku: l.sku } : undefined,
  }));
  return {
    ...BLANK,
    icon: 'orders',
    eyebrow: `${labels.order} · ${StatusLabel(orderFlow, o.status)}`,
    title: o.number,
    subtitle: [o.customerName, o.assigneeName && `Assigned to ${o.assigneeName}`].filter(Boolean).join(' · '),
    status: { label: StatusLabel(orderFlow, o.status), tone: look.tone, note: o.dueAt ? due(o.dueAt) : `Created ${RelativeTime(o.createdAt)}` },
    progress: o.totalUnits ? { value: o.doneUnits, max: o.totalUnits, label: `${o.doneUnits} of ${o.totalUnits} units ${labels.consumed.toLowerCase()}` } : null,
    alert: o.dueAt && IsPast(o.dueAt) ? `Overdue since ${FormatDateTime(o.dueAt)}` : null,
    facts: [
      ...lines,
      { key: 'total', label: 'Total', value: FormatMoney(o.total, ctx.currency), tone: 'good' },
      ...(o.notes ? [{ key: 'notes', label: 'Notes', value: o.notes }] : []),
    ],
    actions: [
      { label: `Open ${labels.order.toLowerCase()}`, to: paths.order(o.number), primary: true },
      { label: `All ${labels.orders.toLowerCase()}`, to: paths.orders },
    ],
  };
};

export const InspectItem = (i: ItemResponseType, ctx: WorldContextType): WorldInspectorType => {
  const { labels } = ctx.template;
  const category = ctx.template.categories.find((c) => c.code === i.category)?.name ?? i.category;
  const stocked = i.kind === ItemKindTypeEnum.STOCK;
  const orders: WorldFactType[] = ctx.orders
    .filter((o) => o.lines.some((l) => l.sku === i.sku && l.done < l.qty))
    .slice(0, 3)
    .map((o) => ({ key: o.number, label: `${o.number} · ${o.customerName}`, value: `needs ${o.lines.find((l) => l.sku === i.sku)!.qty}`, select: { kind: 'order', number: o.number } }));
  const deliveries: WorldFactType[] = ctx.deliveries
    .filter((d) => d.lines.some((l) => l.sku === i.sku))
    .slice(0, 3)
    .map((d) => ({ key: d.number, label: `${d.number} · ${d.supplierName}`, value: `+${d.lines.find((l) => l.sku === i.sku)!.expected}`, tone: 'info', select: { kind: 'delivery', number: d.number } }));
  return {
    ...BLANK,
    icon: 'box',
    eyebrow: `${labels.item} · ${i.location ?? 'no location'}`,
    title: i.name,
    subtitle: `${i.sku} · ${category}`,
    status: { label: HumanizeStockStatus(i.status), tone: STOCK_TONE[i.status], note: stocked ? `Reorder at ${FormatQty(i.reorderLevel, i.unit)}` : undefined },
    progress: stocked ? { value: i.available, max: Math.max(i.reorderLevel * 2, i.available, 1), label: `${FormatQty(i.available, i.unit)} available` } : null,
    facts: [
      { key: 'on-hand', label: 'On hand', value: FormatQty(i.onHand, i.unit) },
      { key: 'reserved', label: 'Reserved', value: FormatQty(i.reserved, i.unit) },
      { key: 'incoming', label: 'Incoming', value: FormatQty(i.incoming, i.unit), tone: i.incoming ? 'info' : undefined },
      { key: 'value', label: 'Value at cost', value: FormatMoney(i.onHand * i.cost, ctx.currency) },
      ...orders,
      ...deliveries,
    ],
    actions: [
      { label: `Open ${labels.item.toLowerCase()}`, item: i.sku, primary: true },
      { label: `All ${labels.items.toLowerCase()}`, to: paths.inventory },
    ],
  };
};
