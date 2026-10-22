import { ItemKindTypeEnum, StockStatusTypeEnum, type ItemResponseType } from '@/frontend/features/inventory/types';
import { StatusLabel, StatusLook } from '@/frontend/features/orders/lib/order-flow';
import { DayLabel, FormatMoney, FormatTime, IsPast } from '@/frontend/utils/format';
import { HumanizeDeliveryStatus, HumanizeStockStatus } from '@/frontend/utils/humanize';
import type { WorldContextType, WorldRowType, WorldTrackerTabType } from '../types';
import { DELIVERY_TONE, STOCK_TONE } from './inspect';

const when = (iso: string) => `${DayLabel(iso)} ${FormatTime(iso)}`;

const DeliveryRows = (ctx: WorldContextType): WorldRowType[] => {
  return ctx.deliveries.map((d) => ({
    key: `d-${d.number}`,
    select: { kind: 'delivery', number: d.number },
    id: d.number,
    where: d.vehicle || d.reference || ctx.template.labels.delivery,
    text: `${d.supplierName} · ${d.totalExpected} units`,
    status: { label: HumanizeDeliveryStatus(d.status), tone: DELIVERY_TONE[d.status] },
    note: d.status === 'SCHEDULED' && IsPast(d.expectedAt) ? `Late · ${when(d.expectedAt)}` : when(d.expectedAt),
    progress: null,
  }));
};

const OrderRows = (ctx: WorldContextType): WorldRowType[] => {
  const { orderFlow, labels } = ctx.template;
  return ctx.orders.map((o) => ({
    key: `o-${o.number}`,
    select: { kind: 'order', number: o.number },
    id: o.number,
    where: o.assigneeName ?? (o.dueAt ? `Due ${when(o.dueAt)}` : 'Unassigned'),
    text: `${o.customerName} · ${FormatMoney(o.total, ctx.currency)}`,
    status: { label: StatusLabel(orderFlow, o.status), tone: StatusLook(orderFlow, o.status).tone },
    note: o.totalUnits ? `${o.doneUnits} / ${o.totalUnits} ${labels.consumed.toLowerCase()}` : '—',
    progress: o.totalUnits ? { value: o.doneUnits, max: o.totalUnits } : null,
  }));
};

const ItemRow = (i: ItemResponseType): WorldRowType => {
  const service = i.kind === ItemKindTypeEnum.SERVICE;
  const stocked = i.kind === ItemKindTypeEnum.STOCK;
  return {
    key: `i-${i.sku}`,
    select: { kind: 'item', sku: i.sku },
    id: i.sku,
    where: i.location ?? 'No location',
    text: `${i.name}${i.incoming ? ` · ${i.incoming} incoming` : ''}`,
    status: service ? { label: 'Service', tone: 'info' } : { label: HumanizeStockStatus(i.status), tone: STOCK_TONE[i.status] },
    note: stocked ? `${i.available} / ${i.reorderLevel} ${i.unit}` : service ? '—' : `${i.available} can be made`,
    progress: stocked ? { value: i.available, max: Math.max(i.reorderLevel * 2, i.available, 1) } : null,
  };
};

const SHORT_FIRST: Record<StockStatusTypeEnum, number> = { OUT: 0, LOW: 1, IN_STOCK: 2 };

const AlertRows = (ctx: WorldContextType): WorldRowType[] => {
  return ctx.items
    .filter((i) => i.kind !== ItemKindTypeEnum.SERVICE && i.status !== StockStatusTypeEnum.IN_STOCK)
    .sort((a, b) => SHORT_FIRST[a.status] - SHORT_FIRST[b.status] || a.name.localeCompare(b.name))
    .map(ItemRow);
};

export const TRACKER_ROWS: Record<WorldTrackerTabType, (ctx: WorldContextType) => WorldRowType[]> = {
  deliveries: DeliveryRows,
  orders: OrderRows,
  alerts: AlertRows,
};

const SEARCH_LIMIT = 50;

/** Everything the business has added that matches the search: items, open orders, deliveries on the way. */
export const SearchRows = (ctx: WorldContextType, query: string): WorldRowType[] => {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const has = (...fields: (string | null | undefined)[]) => fields.some((f) => f?.toLowerCase().includes(q));
  const items = ctx.items.filter((i) => has(i.sku, i.name, i.location)).map(ItemRow);
  const orders = OrderRows(ctx).filter((_, n) => has(ctx.orders[n].number, ctx.orders[n].customerName, ctx.orders[n].assigneeName));
  const deliveries = DeliveryRows(ctx).filter((_, n) => has(ctx.deliveries[n].number, ctx.deliveries[n].supplierName, ctx.deliveries[n].vehicle, ctx.deliveries[n].reference));
  return [...items, ...orders, ...deliveries].slice(0, SEARCH_LIMIT);
};
