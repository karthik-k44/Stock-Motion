import { CANCELLED_STATUS } from '@/frontend/features/orders/types';
import { DayLabel, FormatMoney, FormatTime } from '@/frontend/utils/format';
import type { WorldContextType, WorldKpiType } from '../types';

/** The four numbers above the scene, worded in the business's own vocabulary. */
export const BuildKpis = (ctx: WorldContextType): WorldKpiType[] => {
  const { kpis, ordersByStatus } = ctx.dashboard;
  const { labels, orderFlow } = ctx.template;
  const closedStage = orderFlow.find((s) => s.closed && s.status !== CANCELLED_STATUS);
  const openStages = orderFlow.filter((s) => !s.closed).map((s) => ({ label: s.label, n: ordersByStatus[s.status] ?? 0 }));
  const busiest = openStages.slice(1).reduce<{ label: string; n: number } | null>((b, s) => (s.n && (!b || s.n > b.n) ? s : b), null);
  const next = ctx.deliveries[0];
  const short = kpis.lowStock + kpis.outOfStock;

  return [
    {
      key: 'revenue',
      label: 'Revenue today',
      value: kpis.revenueToday,
      format: 'money',
      icon: 'money',
      tone: 'good',
      chip: kpis.closedToday ? { text: `${kpis.closedToday} ${(closedStage?.label ?? 'closed').toLowerCase()}`, tone: 'good' } : null,
      sub: `${FormatMoney(kpis.revenueMonth, ctx.currency)} this month`,
    },
    {
      key: 'orders',
      label: `Open ${labels.orders.toLowerCase()}`,
      value: kpis.openOrders,
      format: 'number',
      icon: 'orders',
      tone: 'info',
      chip: busiest ? { text: `${busiest.n} ${busiest.label.toLowerCase()}`, tone: 'info' } : null,
      sub: kpis.openOrders
        ? openStages.filter((s) => s.n).map((s) => `${s.n} ${s.label.toLowerCase()}`).join(' · ')
        : `No open ${labels.orders.toLowerCase()} right now`,
    },
    {
      key: 'stock',
      label: 'Low or out of stock',
      value: short,
      format: 'number',
      icon: 'alert',
      tone: kpis.outOfStock ? 'critical' : short ? 'warning' : 'good',
      chip: kpis.outOfStock ? { text: `${kpis.outOfStock} out`, tone: 'critical' } : null,
      sub: `${kpis.lowStock} low · of ${kpis.totalItems} ${labels.items.toLowerCase()}`,
    },
    {
      key: 'incoming',
      label: 'Units incoming',
      value: ctx.deliveries.reduce((s, d) => s + d.totalExpected, 0),
      format: 'number',
      icon: 'truck',
      tone: 'info',
      chip: ctx.deliveries.length ? { text: `${ctx.deliveries.length} ${labels.deliveries.toLowerCase()}`, tone: 'info' } : null,
      sub: next ? `Next: ${next.number} · ${DayLabel(next.expectedAt).toLowerCase()} ${FormatTime(next.expectedAt)}` : `No ${labels.deliveries.toLowerCase()} booked`,
    },
  ];
};
