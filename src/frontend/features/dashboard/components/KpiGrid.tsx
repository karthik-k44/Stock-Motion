import { useNavigate } from 'react-router';
import { HeroCard, StatCard } from '@/frontend/components/card';
import { paths } from '@/frontend/config/paths';
import { businessesService } from '@/frontend/features/businesses/services';
import { PercentChange } from '@/frontend/utils/chart';
import { FormatMoney, FormatNumber } from '@/frontend/utils/format';
import type { DashboardResponseType } from '../types';

const WEEK = 7;

const total = (days: { value: number }[]) => days.reduce((s, d) => s + d.value, 0);

export const KpiGrid = ({ kpis, trends }: Pick<DashboardResponseType, 'kpis' | 'trends'>) => {
  const navigate = useNavigate();
  const business = businessesService.useBusiness();
  const { labels } = business.template;
  const money = (n: number) => FormatMoney(n, business.currency);
  const lastWeek = total(trends.revenue.slice(-WEEK));
  const weekBefore = total(trends.revenue.slice(-2 * WEEK, -WEEK));
  return (
    <div className="overview overview-dense">
      <HeroCard
        className="overview-lead"
        label="Revenue this month"
        value={money(kpis.revenueMonth)}
        trend={trends.revenue}
        trendLabel="Revenue per day"
        formatValue={money}
        change={PercentChange(weekBefore, lastWeek)}
        changeLabel={weekBefore ? 'last 7 days against the 7 before' : 'last 14 days below'}
      />
      <StatCard label="Revenue today" value={money(kpis.revenueToday)} hint={`${kpis.closedToday} closed today`} icon="money" />
      <StatCard label={`Open ${labels.orders.toLowerCase()}`} value={kpis.openOrders} hint={`${kpis.ordersToday} new today · avg ${money(kpis.averageOrder)}`} icon="orders" onClick={() => navigate(paths.orders)} />
      <StatCard
        label="Low or out of stock"
        value={kpis.lowStock + kpis.outOfStock}
        hint={`${kpis.outOfStock} out · ${kpis.totalItems} ${labels.items.toLowerCase()}`}
        icon="alert"
        tone={kpis.outOfStock ? 'critical' : kpis.lowStock ? 'warning' : 'neutral'}
        onClick={() => navigate(paths.inventory)}
      />
      <StatCard label="Stock value" value={money(kpis.stockValue)} hint={`${FormatNumber(kpis.unitsInStock)} units at cost`} icon="package" />
      <StatCard label={labels.deliveries} value={kpis.incomingDeliveries} hint={`${FormatNumber(kpis.incomingUnits)} units on the way`} icon="truck" onClick={() => navigate(paths.deliveries)} />
      <StatCard label={labels.customers} value={kpis.customers} hint={`${kpis.newCustomersMonth} new this month · team of ${kpis.team}`} icon="user" onClick={() => navigate(paths.customers)} />
    </div>
  );
};
