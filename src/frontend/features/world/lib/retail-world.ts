import { paths } from '@/frontend/config/paths';
import type { WorldLayoutType, WorldObjectSpecType } from '../types';
import { DockDoors, INBOUND_DOORS, PackedOrders } from './scenes/scene-data';
import { RetailScene } from './scenes/retail-scene';
import { DeliveryTag, Deliveries, NextDeliveryMinutes, OpenCount, OpenIn, OrdersTag, ZoneAlert, ZoneStats, ZoneTag } from './world-stats';

const rack = (zone: string): WorldObjectSpecType => ({
  id: `rack-${zone}`,
  label: `Aisle ${zone}`,
  short: zone,
  kind: `Storage · Aisle ${zone}`,
  icon: 'grid',
  zone,
  tabs: ['alerts'],
  tag: (ctx) => ZoneTag(ctx, zone),
  stats: (ctx) => ZoneStats(ctx, zone),
  alert: (ctx) => ZoneAlert(ctx, zone),
  link: { label: 'Open locations', to: paths.locations },
});

const door = (n: number): WorldObjectSpecType => ({
  id: `door-${n}`,
  label: `Door ${n}`,
  short: `Door ${n}`,
  kind: 'Dock · inbound',
  icon: 'truck',
  tabs: ['deliveries'],
  tag: (ctx) => {
    const d = DockDoors(ctx)[n - 1];
    return d ? DeliveryTag(d) : { text: 'Free', tone: 'neutral' };
  },
  stats: (ctx) => [
    { label: `${ctx.template.labels.deliveries} booked`, value: Deliveries(ctx) },
    { label: 'At the dock now', value: Deliveries(ctx, 'ARRIVED') },
    { label: 'On the way', value: Deliveries(ctx, 'IN_TRANSIT') },
    { label: 'Waiting for a door', value: Math.max(0, Deliveries(ctx) - INBOUND_DOORS) },
  ],
  link: { label: 'Open deliveries', to: paths.deliveries },
});

/** The warehouse: racks per aisle, three inbound doors, the outbound door, the packing bench and the road. */
export const RETAIL_WORLD: WorldLayoutType = {
  scene: RetailScene,
  objects: [
    rack('A'),
    rack('B'),
    rack('C'),
    rack('D'),
    door(1),
    door(2),
    door(3),
    {
      id: 'door-4',
      label: 'Door 4 · outbound',
      short: 'Door 4',
      kind: 'Dock · outbound',
      icon: 'package',
      tabs: ['orders'],
      tag: (ctx) => {
        const next = PackedOrders(ctx)[0];
        return next ? { text: `${next.number} loading`, tone: 'warning' } : { text: 'Free', tone: 'neutral' };
      },
      stats: (ctx) => [
        { label: 'Packed, ready to ship', value: OpenCount(ctx, 'PACKED') },
        { label: 'Shipped today', value: ctx.dashboard.kpis.closedToday, tone: 'good' },
        { label: 'Revenue today', value: ctx.dashboard.kpis.revenueToday, format: 'money' },
        { label: 'Average order', value: ctx.dashboard.kpis.averageOrder, format: 'money' },
      ],
      link: { label: 'Open sales orders', to: paths.orders },
    },
    {
      id: 'packing',
      label: 'Picking & packing',
      short: 'Packing',
      kind: 'Fulfilment',
      icon: 'orders',
      handles: 'orders',
      tabs: ['orders'],
      tag: (ctx) => {
        const picking = OpenIn(ctx, (s) => s.consumeLines);
        const packed = OpenCount(ctx, 'PACKED');
        if (!picking && !packed) return OrdersTag(ctx);
        return { text: [picking && `${picking} picking`, packed && `${packed} packed`].filter(Boolean).join(' · '), tone: 'good' };
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
      id: 'road',
      label: 'On the road',
      short: 'Road',
      kind: 'Inbound',
      icon: 'truck',
      handles: 'deliveries',
      tabs: ['deliveries'],
      tag: (ctx) => {
        const n = Deliveries(ctx, 'IN_TRANSIT');
        return n ? { text: `${n} on the way`, tone: 'info' } : { text: 'Nothing on the way', tone: 'neutral' };
      },
      stats: (ctx) => [
        { label: 'On the way now', value: Deliveries(ctx, 'IN_TRANSIT') },
        { label: 'Units on the way', value: ctx.dashboard.kpis.incomingUnits },
        { label: 'Next due in (min)', value: NextDeliveryMinutes(ctx) },
      ],
      link: { label: 'Open deliveries', to: paths.deliveries },
    },
  ],
};
