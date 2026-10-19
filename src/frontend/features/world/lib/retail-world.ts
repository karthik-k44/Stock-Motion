import { paths } from '@/frontend/config/paths';
import type { WorldLayoutType, WorldObjectSpecType } from '../types';
import { Deliveries, NextDeliveryMinutes, OpenCount, OpenIn, ZoneAlert, ZoneStats } from './world-stats';

const rack = (zone: string, x: number): WorldObjectSpecType => ({
  id: `rack-${zone}`,
  label: `Aisle ${zone}`,
  model: 'rack',
  zone,
  position: [x, -6.5],
  stats: (ctx) => ZoneStats(ctx, zone),
  alert: (ctx) => ZoneAlert(ctx, zone),
  link: { label: 'Open locations', to: paths.locations },
});

/** A warehouse diorama: four racks, Dock 1 with its truck, the packing bench, the outbound van and the office. */
export const RETAIL_WORLD: WorldLayoutType = {
  size: [46, 32],
  palette: { ground: '#cfe3c4', floor: '#e9e6df', wall: '#c9d3e3', accent: '#2b4c7e', trim: '#f2c230', road: '#9aa1ab' },
  building: { center: [2, -2], size: [30, 18] },
  walkers: [
    [[-8, -3.6], [11, -3.6], [11, -0.5], [-8, -0.5]],
    [[-3, -3], [12.5, 1.5], [6, 4.5], [-6, 2]],
    [[-11, -9.5], [-11, 4], [-4, 4]],
    [[8, 3], [14, -2], [14, 5]],
    [[-6, 5], [10, 5]],
  ],
  road: [[-18, -14], [-18, 11], [21, 11], [21, -14]],
  trees: [[-21, -12], [-21, 6], [-12, 13.5], [4, 13.5], [16, 13.5], [23, -9], [23, 3], [8, -14.5], [-6, -14.5]],
  objects: [
    rack('A', -6.5),
    rack('B', -1.5),
    rack('C', 3.5),
    rack('D', 8.5),
    {
      id: 'dock',
      label: 'Dock 1 · inbound truck',
      model: 'truck',
      position: [-16, -3],
      rotation: Math.PI / 2,
      route: [[-18, -14], [-18, 11], [21, 11], [21, -14]],
      moving: (ctx) => Deliveries(ctx, 'IN_TRANSIT') > 0 && Deliveries(ctx, 'ARRIVED') === 0,
      stats: (ctx) => [
        { label: `${ctx.template.labels.deliveries} expected`, value: ctx.dashboard.kpis.incomingDeliveries },
        { label: 'Units on the way', value: ctx.dashboard.kpis.incomingUnits },
        { label: 'At the dock now', value: Deliveries(ctx, 'ARRIVED') },
        { label: 'Next due in (min)', value: NextDeliveryMinutes(ctx) },
      ],
      link: { label: 'Open deliveries', to: paths.deliveries },
      color: '#e86b2c',
    },
    {
      id: 'packing',
      label: 'Picking & packing',
      model: 'bench',
      position: [13.5, 1.5],
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
      model: 'van',
      position: [19.5, 4],
      rotation: Math.PI,
      route: [[21, 4], [21, 11], [-18, 11], [-18, -14], [21, -14]],
      moving: (ctx) => ctx.dashboard.kpis.closedToday > 0,
      stats: (ctx) => [
        { label: 'Shipped today', value: ctx.dashboard.kpis.closedToday },
        { label: 'Revenue today', value: ctx.dashboard.kpis.revenueToday, format: 'money' },
        { label: 'Average order', value: ctx.dashboard.kpis.averageOrder, format: 'money' },
      ],
      color: '#3a7bd5',
    },
    {
      id: 'office',
      label: 'Office',
      model: 'office',
      position: [-9.5, 3.5],
      stats: (ctx) => [
        { label: 'Revenue this month', value: ctx.dashboard.kpis.revenueMonth, format: 'money' },
        { label: 'Stock value', value: ctx.dashboard.kpis.stockValue, format: 'money' },
        { label: 'Customers', value: ctx.dashboard.kpis.customers },
        { label: 'Team on shift', value: ctx.dashboard.kpis.team },
      ],
      link: { label: 'Open dashboard', to: paths.dashboard },
    },
  ],
};
