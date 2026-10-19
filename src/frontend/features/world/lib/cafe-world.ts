import { paths } from '@/frontend/config/paths';
import type { ModelKindType, WorldLayoutType, WorldObjectSpecType } from '../types';
import { Deliveries, NextDeliveryMinutes, OpenCount, OpenIn, ZoneAlert, ZoneStats } from './world-stats';

const storage = (zone: string, label: string, model: ModelKindType, position: [number, number], rotation = 0): WorldObjectSpecType => ({
  id: `zone-${zone}`,
  label,
  model,
  zone,
  position,
  rotation,
  stats: (ctx) => ZoneStats(ctx, zone),
  alert: (ctx) => ZoneAlert(ctx, zone),
  link: { label: 'Open storage', to: paths.locations },
});

/** A café: the counter with its coffee machine and till, storage at the back, tables and guests up front. */
export const CAFE_WORLD: WorldLayoutType = {
  size: [40, 30],
  palette: { ground: '#d7e8cf', floor: '#efe2cf', wall: '#e6cfb4', accent: '#7a4a2a', trim: '#2f9e6d', road: '#a3a7ad' },
  building: { center: [0, -1], size: [26, 18] },
  walkers: [
    [[-6, -4.6], [6, -4.6]],
    [[-12, 10], [-1, 7], [-1, 2.5], [8, 5], [12, 10]],
    [[12, 10], [4, 6.5], [-6, 4], [-10, 9]],
    [[-9, -5], [-9, -3], [-3, -4.8]],
    [[2, 9], [2, 1.5], [-5, 1.5]],
  ],
  road: [[-19, 11.5], [19, 11.5], [19, 13.5], [-19, 13.5]],
  trees: [[-17, -10], [-17, 0], [17, -10], [17, -2], [-15, 9], [15, 8], [-8, 12.5], [8, 12.5]],
  objects: [
    {
      id: 'counter',
      label: 'Counter · open tickets',
      model: 'counter',
      position: [0, -2.2],
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
      model: 'coffee',
      position: [-3, -2.5],
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
      model: 'till',
      position: [3.4, -2.5],
      stats: (ctx) => [
        { label: 'Revenue today', value: ctx.dashboard.kpis.revenueToday, format: 'money' },
        { label: 'Average ticket', value: ctx.dashboard.kpis.averageOrder, format: 'money' },
        { label: 'Revenue this month', value: ctx.dashboard.kpis.revenueMonth, format: 'money' },
      ],
      link: { label: 'Open dashboard', to: paths.dashboard },
      color: '#2f9e6d',
    },
    storage('DRY', 'Dry store', 'shelf', [-10.5, -8]),
    storage('FRIDGE', 'Walk-in fridge', 'fridge', [-6, -8]),
    storage('FREEZER', 'Freezer', 'freezer', [-1.5, -8.2]),
    storage('BAR', 'Coffee bar shelves', 'shelf', [4, -6.5]),
    storage('FRONT', 'Front counter display', 'display', [7.5, -2.2]),
    {
      id: 'tables',
      label: 'Tables & guests',
      model: 'tables',
      position: [0, 4],
      count: (ctx) => Math.min(6, Math.max(3, ctx.dashboard.kpis.openOrders + 1)),
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
      model: 'van',
      position: [-15.5, -4],
      rotation: Math.PI / 2,
      route: [[-19, 11.5], [19, 11.5], [19, 13.5], [-19, 13.5]],
      moving: (ctx) => Deliveries(ctx, 'IN_TRANSIT') > 0,
      stats: (ctx) => [
        { label: 'Drop-offs expected', value: ctx.dashboard.kpis.incomingDeliveries },
        { label: 'On the way now', value: Deliveries(ctx, 'IN_TRANSIT') },
        { label: 'Next due in (min)', value: NextDeliveryMinutes(ctx) },
      ],
      link: { label: 'Open drop-offs', to: paths.deliveries },
      color: '#2f9e6d',
    },
  ],
};
