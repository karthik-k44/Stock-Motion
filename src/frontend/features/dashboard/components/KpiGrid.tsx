import { useNavigate } from 'react-router';
import { StatCard } from '@/frontend/components/card';
import { paths } from '@/frontend/config/paths';
import { businessesService } from '@/frontend/features/businesses/services';
import { FormatMoney, FormatNumber } from '@/frontend/utils/format';
import type { DashboardKpisType } from '../types';

export function KpiGrid({ kpis }: { kpis: DashboardKpisType }) {
  const navigate = useNavigate();
  const business = businessesService.useBusiness();
  const { labels } = business.template;
  const money = (n: number) => FormatMoney(n, business.currency);
  return (
    <div className="kpis">
      <StatCard label="Revenue today" value={money(kpis.revenueToday)} hint={`${kpis.closedToday} closed today · ${money(kpis.revenueMonth)} this month`} icon="dashboard" />
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
}
