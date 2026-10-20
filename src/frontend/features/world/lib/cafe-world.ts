import { paths } from '@/frontend/config/paths';
import { FormatMoney } from '@/frontend/utils/format';
import type { ModelKindType, WorldLayoutType, WorldObjectSpecType } from '../types';
import { Deliveries, NextDeliveryMinutes, NextDeliveryTag, OpenCount, OpenIn, OrdersTag, ZoneAlert, ZoneStats, ZoneTag } from './world-stats';

const ROAD: [number, number][] = [[-19, 11.5], [19, 11.5], [19, 13.5], [-19, 13.5]];

const storage = (zone: string, label: string, short: string, model: ModelKindType, position: [number, number], rotation = 0): WorldObjectSpecType => ({
  id: `zone-${zone}`,
  label,
  short,
  kind: 'Storage',
  icon: 'grid',
  model,
  zone,
  position,
  rotation,
  tag: (ctx) => ZoneTag(ctx, zone),
  stats: (ctx) => ZoneStats(ctx, zone),
  alert: (ctx) => ZoneAlert(ctx, zone),
  link: { label: 'Open storage', to: paths.locations },
});

/** A café: the counter with its coffee machine and till, storage at the back, tables and guests up front. */
export const CAFE_WORLD: WorldLayoutType = {
  size: [40, 30],
  palette: { ground: '#e4ecd9', floor: '#f7efe6', wall: '#efe2d3', accent: '#c2410c', trim: '#f97316', road: '#cfd3d8' },
  building: { center: [0, -1], size: [26, 18] },
  walkers: [
    [[-6, -4.6], [6, -4.6]],
    [[-12, 10], [-1, 7], [-1, 2.5], [8, 5], [12, 10]],
    [[12, 10], [4, 6.5], [-6, 4], [-10, 9]],
    [[-9, -5], [-9, -3], [-3, -4.8]],
    [[2, 9], [2, 1.5], [-5, 1.5]],
  ],
  road: ROAD,
  trees: [[-17, -10], [-17, 0], [17, -10], [17, -2], [-15, 9], [15, 8], [-8, 12.5], [8, 12.5]],
  objects: [
    {
      id: 'counter',
      label: 'Counter · open tickets',
      short: 'Counter',
      kind: 'Front of house',
      icon: 'orders',
      model: 'counter',
      handles: 'orders',
      position: [0, -2.2],
      tag: (ctx) => {
        const preparing = OpenIn(ctx, (s) => s.reserves);
        return preparing ? { text: `${preparing} being prepared`, tone: 'info' } : OrdersTag(ctx);
      },
      stats: (ctx) => [
        { label: 'New tickets', value: OpenIn(ctx, (s) => s.index === 0) },
        { label: 'Being prepared', value: OpenIn(ctx, (s) => s.reserves) },
        { label: 'Tickets today', value: ctx.dashboard.kpis.ordersToday },
        { label: 'Served today', value: ctx.dashboard.kpis.closedToday, tone: 'good' },
      ],
      link: { label: 'Open tickets', to: paths.orders },
    },
    {
      id: 'coffee',
      label: 'Coffee machine · menu',
      short: 'Menu',
      kind: 'Kitchen',
      icon: 'package',
      model: 'coffee',
      position: [-3, -2.5],
      tag: (ctx) => {
        const top = ctx.dashboard.topSellers[0];
        return top ? { text: `Top: ${top.name}`, tone: 'good' } : { text: `${ctx.dashboard.kpis.madeItems} on the menu`, tone: 'neutral' };
      },
      stats: (ctx) => [
        { label: 'Menu items', value: ctx.dashboard.kpis.madeItems },
        { label: `Top seller: ${ctx.dashboard.topSellers[0]?.name ?? '—'}`, value: ctx.dashboard.topSellers[0]?.qty ?? 0, suffix: 'sold' },
        { label: 'Preparing now', value: OpenCount(ctx, 'PREPARING') },
      ],
      link: { label: 'Open menu', to: paths.inventory },
    },
    {
      id: 'till',
      label: 'Till',
      short: 'Till',
      kind: 'Sales',
      icon: 'money',
      model: 'till',
      position: [3.4, -2.5],
      tag: (ctx) => ({ text: `${FormatMoney(ctx.dashboard.kpis.revenueToday, ctx.currency)} today`, tone: 'good' }),
      stats: (ctx) => [
        { label: 'Revenue today', value: ctx.dashboard.kpis.revenueToday, format: 'money' },
        { label: 'Average ticket', value: ctx.dashboard.kpis.averageOrder, format: 'money' },
        { label: 'Revenue this month', value: ctx.dashboard.kpis.revenueMonth, format: 'money' },
      ],
      link: { label: 'Open dashboard', to: paths.dashboard },
      color: '#c2410c',
    },
    storage('DRY', 'Dry store', 'Dry', 'shelf', [-10.5, -8]),
    storage('FRIDGE', 'Walk-in fridge', 'Fridge', 'fridge', [-6, -8]),
    storage('FREEZER', 'Freezer', 'Freezer', 'freezer', [-1.5, -8.2]),
    storage('BAR', 'Coffee bar shelves', 'Bar', 'shelf', [4, -6.5]),
    storage('FRONT', 'Front counter display', 'Display', 'display', [7.5, -2.2]),
    {
      id: 'tables',
      label: 'Tables & guests',
      short: 'Guests',
      kind: 'Dining room',
      icon: 'users',
      model: 'tables',
      position: [0, 4],
      tag: (ctx) => ({ text: `${ctx.dashboard.kpis.customers} on record`, tone: 'neutral' }),
      stats: (ctx) => [
        { label: 'Guests on record', value: ctx.dashboard.kpis.customers },
        { label: 'New this month', value: ctx.dashboard.kpis.newCustomersMonth },
        { label: 'Open tickets', value: ctx.dashboard.kpis.openOrders },
      ],
      link: { label: 'Open customers', to: paths.customers },
    },
    {
      id: 'supplier-van',
      label: 'Supplier drop-offs',
      short: 'Drop-offs',
      kind: 'Inbound',
      icon: 'truck',
      model: 'van',
      handles: 'deliveries',
      position: [-15.5, -4],
      rotation: Math.PI / 2,
      route: ROAD,
      moving: (ctx) => Deliveries(ctx, 'IN_TRANSIT') > 0,
      present: (ctx) => Deliveries(ctx) > 0,
      tag: NextDeliveryTag,
      stats: (ctx) => [
        { label: 'Drop-offs expected', value: Deliveries(ctx) },
        { label: 'On the way now', value: Deliveries(ctx, 'IN_TRANSIT') },
        { label: 'Next due in (min)', value: NextDeliveryMinutes(ctx) },
      ],
      link: { label: 'Open drop-offs', to: paths.deliveries },
      color: '#ea580c',
    },
  ],
};
