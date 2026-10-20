import { paths } from '@/frontend/config/paths';
import { FormatMoney } from '@/frontend/utils/format';
import type { WorldLayoutType, WorldObjectSpecType } from '../types';
import { Deliveries, NextDeliveryMinutes, NextDeliveryTag, OpenCount, OpenIn, OrdersTag, ZoneAlert, ZoneStats, ZoneTag } from './world-stats';

const ROAD: [number, number][] = [[-18, -14], [-18, 11], [21, 11], [21, -14]];

const rack = (zone: string, x: number): WorldObjectSpecType => ({
  id: `rack-${zone}`,
  label: `Aisle ${zone}`,
  short: zone,
  kind: `Storage · Aisle ${zone}`,
  icon: 'grid',
  model: 'rack',
  zone,
  position: [x, -6.5],
  tag: (ctx) => ZoneTag(ctx, zone),
  stats: (ctx) => ZoneStats(ctx, zone),
  alert: (ctx) => ZoneAlert(ctx, zone),
  link: { label: 'Open locations', to: paths.locations },
});

/** A warehouse: four racks, the receiving dock, the packing bench, the outbound van and the office. */
export const RETAIL_WORLD: WorldLayoutType = {
  size: [46, 32],
  palette: { ground: '#e4ecd9', floor: '#f6f4f1', wall: '#ece6df', accent: '#ea580c', trim: '#f97316', road: '#cfd3d8' },
  building: { center: [2, -2], size: [30, 18] },
  walkers: [
    [[-8, -3.6], [11, -3.6], [11, -0.5], [-8, -0.5]],
    [[-3, -3], [12.5, 1.5], [6, 4.5], [-6, 2]],
    [[-11, -9.5], [-11, 4], [-4, 4]],
    [[8, 3], [14, -2], [14, 5]],
    [[-6, 5], [10, 5]],
  ],
  road: ROAD,
  trees: [[-21, -12], [-21, 6], [-12, 13.5], [4, 13.5], [16, 13.5], [23, -9], [23, 3], [8, -14.5], [-6, -14.5]],
  objects: [
    rack('A', -6.5),
    rack('B', -1.5),
    rack('C', 3.5),
    rack('D', 8.5),
    {
      id: 'dock',
      label: 'Receiving dock',
      short: 'Dock',
      kind: 'Inbound',
      icon: 'truck',
      model: 'truck',
      handles: 'deliveries',
      position: [-16, -3],
      rotation: Math.PI / 2,
      route: ROAD,
      moving: (ctx) => Deliveries(ctx, 'IN_TRANSIT') > 0 && Deliveries(ctx, 'ARRIVED') === 0,
      present: (ctx) => Deliveries(ctx) > 0,
      tag: NextDeliveryTag,
      stats: (ctx) => [
        { label: `${ctx.template.labels.deliveries} expected`, value: Deliveries(ctx) },
        { label: 'Units on the way', value: ctx.dashboard.kpis.incomingUnits },
        { label: 'At the dock now', value: Deliveries(ctx, 'ARRIVED') },
        { label: 'Next due in (min)', value: NextDeliveryMinutes(ctx) },
      ],
      link: { label: 'Open deliveries', to: paths.deliveries },
      color: '#ea580c',
    },
    {
      id: 'packing',
      label: 'Picking & packing',
      short: 'Packing',
      kind: 'Fulfilment',
      icon: 'orders',
      model: 'bench',
      handles: 'orders',
      position: [13.5, 1.5],
      tag: (ctx) => {
        const picking = OpenIn(ctx, (s) => s.consumeLines);
        const packed = OpenCount(ctx, 'PACKED');
        if (!picking && !packed) return OrdersTag(ctx);
        return { text: [picking && `${picking} picking`, packed && `${packed} packed`].filter(Boolean).join(' · '), tone: 'info' };
      },
      stats: (ctx) => [
        { label: 'Waiting to start', value: OpenIn(ctx, (s) => s.index === 0) },
        { label: 'Being picked', value: OpenIn(ctx, (s) => s.consumeLines) },
        { label: 'Packed, ready to ship', value: OpenCount(ctx, 'PACKED') },
        { label: 'Open orders', value: ctx.dashboard.kpis.openOrders },
      ],
      link: { label: 'Open sales orders', to: paths.orders },
    },
    {
      id: 'outbound',
      label: 'Outbound van',
      short: 'Outbound',
      kind: 'Shipping',
      icon: 'truck',
      model: 'van',
      position: [19.5, 4],
      rotation: Math.PI,
      route: [[21, 4], [21, 11], [-18, 11], [-18, -14], [21, -14]],
      moving: (ctx) => ctx.dashboard.kpis.closedToday > 0,
      present: (ctx) => OpenCount(ctx, 'PACKED') > 0 || ctx.dashboard.kpis.closedToday > 0,
      tag: (ctx) => {
        const packed = OpenCount(ctx, 'PACKED');
        const shipped = ctx.dashboard.kpis.closedToday;
        if (!packed && !shipped) return { text: 'Nothing to ship', tone: 'neutral' };
        return { text: [packed && `${packed} ready`, shipped && `${shipped} shipped today`].filter(Boolean).join(' · '), tone: packed ? 'warning' : 'good' };
      },
      stats: (ctx) => [
        { label: 'Packed, ready to ship', value: OpenCount(ctx, 'PACKED') },
        { label: 'Shipped today', value: ctx.dashboard.kpis.closedToday },
        { label: 'Revenue today', value: ctx.dashboard.kpis.revenueToday, format: 'money' },
        { label: 'Average order', value: ctx.dashboard.kpis.averageOrder, format: 'money' },
      ],
      link: { label: 'Open sales orders', to: paths.orders },
      color: '#f97316',
    },
    {
      id: 'office',
      label: 'Office',
      short: 'Office',
      kind: 'Business',
      icon: 'dashboard',
      model: 'office',
      position: [-9.5, 3.5],
      tag: (ctx) => ({ text: `${FormatMoney(ctx.dashboard.kpis.revenueToday, ctx.currency)} today`, tone: 'good' }),
      stats: (ctx) => [
        { label: 'Revenue this month', value: ctx.dashboard.kpis.revenueMonth, format: 'money' },
        { label: 'Stock value', value: ctx.dashboard.kpis.stockValue, format: 'money' },
        { label: 'Customers', value: ctx.dashboard.kpis.customers },
        { label: 'Team members', value: ctx.dashboard.kpis.team },
      ],
      link: { label: 'Open dashboard', to: paths.dashboard },
    },
  ],
};
