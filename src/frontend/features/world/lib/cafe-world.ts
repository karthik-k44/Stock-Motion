import { paths } from '@/frontend/config/paths';
import { FormatMoney } from '@/frontend/utils/format';
import type { WorldLayoutType, WorldObjectSpecType } from '../types';
import { CafeScene } from './scenes/cafe-scene';
import { Deliveries, NextDeliveryMinutes, NextDeliveryTag, OpenCount, OpenIn, OrdersTag, ZoneAlert, ZoneStats, ZoneTag } from './world-stats';

const storage = (zone: string, label: string, short: string): WorldObjectSpecType => ({
  id: `zone-${zone}`,
  label,
  short,
  kind: 'Storage',
  icon: 'grid',
  zone,
  tabs: ['alerts'],
  tag: (ctx) => ZoneTag(ctx, zone),
  stats: (ctx) => ZoneStats(ctx, zone),
  alert: (ctx) => ZoneAlert(ctx, zone),
  link: { label: 'Open storage', to: paths.locations },
});

/** A café: the counter with its coffee machine and till, storage at the back, tables and guests up front. */
export const CAFE_WORLD: WorldLayoutType = {
  scene: CafeScene,
  objects: [
    {
      id: 'counter',
      label: 'Counter · open tickets',
      short: 'Counter',
      kind: 'Front of house',
      icon: 'orders',
      handles: 'orders',
      tabs: ['orders'],
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
      tag: (ctx) => ({ text: `${FormatMoney(ctx.dashboard.kpis.revenueToday, ctx.currency)} today`, tone: 'good' }),
      stats: (ctx) => [
        { label: 'Revenue today', value: ctx.dashboard.kpis.revenueToday, format: 'money' },
        { label: 'Average ticket', value: ctx.dashboard.kpis.averageOrder, format: 'money' },
        { label: 'Revenue this month', value: ctx.dashboard.kpis.revenueMonth, format: 'money' },
      ],
      link: { label: 'Open dashboard', to: paths.dashboard },
    },
    storage('DRY', 'Dry store', 'Dry'),
    storage('FRIDGE', 'Walk-in fridge', 'Fridge'),
    storage('FREEZER', 'Freezer', 'Freezer'),
    storage('BAR', 'Coffee bar shelves', 'Bar'),
    storage('FRONT', 'Front counter display', 'Display'),
    {
      id: 'tables',
      label: 'Tables & guests',
      short: 'Guests',
      kind: 'Dining room',
      icon: 'users',
      tabs: ['orders'],
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
      handles: 'deliveries',
      tabs: ['deliveries'],
      tag: NextDeliveryTag,
      stats: (ctx) => [
        { label: 'Drop-offs expected', value: Deliveries(ctx) },
        { label: 'On the way now', value: Deliveries(ctx, 'IN_TRANSIT') },
        { label: 'Next due in (min)', value: NextDeliveryMinutes(ctx) },
      ],
      link: { label: 'Open drop-offs', to: paths.deliveries },
    },
  ],
};
