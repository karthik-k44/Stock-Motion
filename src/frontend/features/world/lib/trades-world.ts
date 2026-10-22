import { paths } from '@/frontend/config/paths';
import type { WorldContextType, WorldLayoutType, WorldTagType } from '../types';
import { TradesScene } from './scenes/trades-scene';
import { Deliveries, NextDeliveryMinutes, NextDeliveryTag, OpenCount, ZoneAlert, ZoneStats, ZoneTag } from './world-stats';

/** A van carries its own stock (a storage zone) and is out on a job while jobs of `status` are open. */
const vanTag = (ctx: WorldContextType, zone: string, status: string, doing: string): WorldTagType => {
  const jobs = OpenCount(ctx, status);
  const stock = ZoneTag(ctx, zone);
  return jobs ? { text: `${jobs} ${doing}${stock.tone === 'good' || stock.tone === 'neutral' ? '' : ` · ${stock.text}`}`, tone: stock.tone === 'critical' ? 'critical' : 'info' } : stock;
};

/** A trades business: the depot and its shelves, the site store, two vans on the road and the job sites. */
export const TRADES_WORLD: WorldLayoutType = {
  scene: TradesScene,
  objects: [
    {
      id: 'depot',
      label: 'Depot shelves',
      short: 'Depot',
      kind: 'Storage',
      icon: 'grid',
      zone: 'DEPOT',
      tabs: ['alerts'],
      tag: (ctx) => ZoneTag(ctx, 'DEPOT'),
      stats: (ctx) => ZoneStats(ctx, 'DEPOT'),
      alert: (ctx) => ZoneAlert(ctx, 'DEPOT'),
      link: { label: 'Open depot & vans', to: paths.locations },
    },
    {
      id: 'site',
      label: 'Site store',
      short: 'Site store',
      kind: 'Storage',
      icon: 'package',
      zone: 'SITE',
      tabs: ['alerts'],
      tag: (ctx) => ZoneTag(ctx, 'SITE'),
      stats: (ctx) => ZoneStats(ctx, 'SITE'),
      alert: (ctx) => ZoneAlert(ctx, 'SITE'),
      link: { label: 'Open depot & vans', to: paths.locations },
    },
    {
      id: 'office',
      label: 'Office · quotes',
      short: 'Office',
      kind: 'Business',
      icon: 'dashboard',
      tag: (ctx) => {
        const quotes = OpenCount(ctx, 'QUOTED');
        return quotes ? { text: `${quotes} quote${quotes === 1 ? '' : 's'} waiting`, tone: 'warning' } : { text: 'No quotes waiting', tone: 'neutral' };
      },
      stats: (ctx) => [
        { label: 'Quotes waiting', value: OpenCount(ctx, 'QUOTED') },
        { label: 'Revenue this month', value: ctx.dashboard.kpis.revenueMonth, format: 'money' },
        { label: 'Average job', value: ctx.dashboard.kpis.averageOrder, format: 'money' },
        { label: 'Clients', value: ctx.dashboard.kpis.customers },
      ],
      link: { label: 'Open jobs', to: paths.orders },
    },
    {
      id: 'van1',
      label: 'Van 1',
      short: 'Van 1',
      kind: 'Vehicle · stock on board',
      icon: 'truck',
      zone: 'VAN1',
      tabs: ['alerts', 'orders'],
      tag: (ctx) => vanTag(ctx, 'VAN1', 'IN_PROGRESS', 'on site'),
      stats: (ctx) => [{ label: 'Jobs in progress', value: OpenCount(ctx, 'IN_PROGRESS') }, ...ZoneStats(ctx, 'VAN1').slice(0, 3)],
      alert: (ctx) => ZoneAlert(ctx, 'VAN1'),
      link: { label: 'Open jobs', to: paths.orders },
    },
    {
      id: 'van2',
      label: 'Van 2',
      short: 'Van 2',
      kind: 'Vehicle · stock on board',
      icon: 'truck',
      zone: 'VAN2',
      tabs: ['alerts', 'orders'],
      tag: (ctx) => vanTag(ctx, 'VAN2', 'SCHEDULED', 'booked'),
      stats: (ctx) => [{ label: 'Jobs booked', value: OpenCount(ctx, 'SCHEDULED') }, ...ZoneStats(ctx, 'VAN2').slice(0, 3)],
      alert: (ctx) => ZoneAlert(ctx, 'VAN2'),
      link: { label: 'Open jobs', to: paths.orders },
    },
    {
      id: 'sites',
      label: 'Job sites',
      short: 'Jobs',
      kind: 'Out on the road',
      icon: 'warehouse',
      handles: 'orders',
      tabs: ['orders'],
      tag: (ctx) => {
        const booked = OpenCount(ctx, 'SCHEDULED');
        const doing = OpenCount(ctx, 'IN_PROGRESS');
        if (!booked && !doing) return { text: 'No jobs booked', tone: 'neutral' };
        return { text: [doing && `${doing} in progress`, booked && `${booked} booked`].filter(Boolean).join(' · '), tone: 'info' };
      },
      stats: (ctx) => [
        { label: 'Booked', value: OpenCount(ctx, 'SCHEDULED') },
        { label: 'In progress', value: OpenCount(ctx, 'IN_PROGRESS') },
        { label: 'Done today', value: ctx.dashboard.kpis.closedToday, tone: 'good' },
        { label: 'Revenue today', value: ctx.dashboard.kpis.revenueToday, format: 'money' },
      ],
      link: { label: 'Open jobs', to: paths.orders },
    },
    {
      id: 'courier',
      label: 'Merchant deliveries',
      short: 'Merchant',
      kind: 'Inbound',
      icon: 'truck',
      handles: 'deliveries',
      tabs: ['deliveries'],
      tag: NextDeliveryTag,
      stats: (ctx) => [
        { label: 'Purchase orders open', value: Deliveries(ctx) },
        { label: 'On the way now', value: Deliveries(ctx, 'IN_TRANSIT') },
        { label: 'Units coming', value: ctx.dashboard.kpis.incomingUnits },
        { label: 'Next due in (min)', value: NextDeliveryMinutes(ctx) },
      ],
      link: { label: 'Open purchase orders', to: paths.deliveries },
    },
  ],
};
