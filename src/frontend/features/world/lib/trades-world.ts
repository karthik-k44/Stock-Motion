import { paths } from '@/frontend/config/paths';
import type { WorldContextType, WorldLayoutType, WorldTagType } from '../types';
import { Deliveries, NextDeliveryMinutes, NextDeliveryTag, OpenCount, ZoneAlert, ZoneStats, ZoneTag } from './world-stats';

const ROAD: [number, number][] = [[4.5, -13], [4.5, 11], [21, 11], [21, -13]];

/** A van carries its own stock (a storage zone) and is out on a job while jobs of `status` are open. */
const vanTag = (ctx: WorldContextType, zone: string, status: string, doing: string): WorldTagType => {
  const jobs = OpenCount(ctx, status);
  const stock = ZoneTag(ctx, zone);
  return jobs ? { text: `${jobs} ${doing}${stock.tone === 'good' || stock.tone === 'neutral' ? '' : ` · ${stock.text}`}`, tone: stock.tone === 'critical' ? 'critical' : 'info' } : stock;
};

/** A trades business: the depot and its shelves, the site store, two vans on the road and the job sites. */
export const TRADES_WORLD: WorldLayoutType = {
  size: [46, 32],
  palette: { ground: '#e4ecd9', floor: '#f2efeb', wall: '#e6e0d8', accent: '#ea580c', trim: '#f97316', road: '#cfd3d8' },
  building: { center: [-7, -4], size: [18, 12] },
  walkers: [
    [[-13, -3], [-2, -3], [-2, 0.5], [-13, 0.5]],
    [[-12, -8.5], [-6, -8.5], [-6, -1]],
    [[2, -6], [6, 2], [2, 4]],
  ],
  road: ROAD,
  trees: [[-21, -12], [-21, 4], [-14, 9], [-4, 9], [24, -10], [24, 2], [12, -15], [0, -15]],
  objects: [
    {
      id: 'depot',
      label: 'Depot shelves',
      short: 'Depot',
      kind: 'Storage',
      icon: 'grid',
      model: 'rack',
      zone: 'DEPOT',
      position: [-9, -8],
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
      model: 'pallets',
      zone: 'SITE',
      position: [-12.5, -0.5],
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
      model: 'office',
      position: [-2, -1],
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
      model: 'van',
      zone: 'VAN1',
      position: [7, -7],
      rotation: Math.PI,
      route: ROAD,
      moving: (ctx) => OpenCount(ctx, 'IN_PROGRESS') > 0,
      tag: (ctx) => vanTag(ctx, 'VAN1', 'IN_PROGRESS', 'on site'),
      stats: (ctx) => [{ label: 'Jobs in progress', value: OpenCount(ctx, 'IN_PROGRESS') }, ...ZoneStats(ctx, 'VAN1').slice(0, 3)],
      alert: (ctx) => ZoneAlert(ctx, 'VAN1'),
      link: { label: 'Open jobs', to: paths.orders },
      color: '#ea580c',
    },
    {
      id: 'van2',
      label: 'Van 2',
      short: 'Van 2',
      kind: 'Vehicle · stock on board',
      icon: 'truck',
      model: 'van',
      zone: 'VAN2',
      position: [7, -3],
      rotation: Math.PI,
      route: [...ROAD].reverse(),
      moving: (ctx) => OpenCount(ctx, 'SCHEDULED') > 0,
      tag: (ctx) => vanTag(ctx, 'VAN2', 'SCHEDULED', 'booked'),
      stats: (ctx) => [{ label: 'Jobs booked', value: OpenCount(ctx, 'SCHEDULED') }, ...ZoneStats(ctx, 'VAN2').slice(0, 3)],
      alert: (ctx) => ZoneAlert(ctx, 'VAN2'),
      link: { label: 'Open jobs', to: paths.orders },
      color: '#57534e',
    },
    {
      id: 'sites',
      label: 'Job sites',
      short: 'Jobs',
      kind: 'Out on the road',
      icon: 'warehouse',
      model: 'houses',
      handles: 'orders',
      position: [14, 0],
      // One house per job that is booked or under way, so an empty street means no jobs.
      count: (ctx) => Math.min(4, OpenCount(ctx, 'SCHEDULED') + OpenCount(ctx, 'IN_PROGRESS')),
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
      model: 'truck',
      handles: 'deliveries',
      position: [-18, 5],
      rotation: 0,
      route: [[-19, 12], [-19, -13], [4.5, -13], [4.5, 12]],
      moving: (ctx) => Deliveries(ctx, 'IN_TRANSIT') > 0,
      present: (ctx) => Deliveries(ctx) > 0,
      tag: NextDeliveryTag,
      stats: (ctx) => [
        { label: 'Purchase orders open', value: Deliveries(ctx) },
        { label: 'On the way now', value: Deliveries(ctx, 'IN_TRANSIT') },
        { label: 'Units coming', value: ctx.dashboard.kpis.incomingUnits },
        { label: 'Next due in (min)', value: NextDeliveryMinutes(ctx) },
      ],
      link: { label: 'Open purchase orders', to: paths.deliveries },
      color: '#78716c',
    },
  ],
};
