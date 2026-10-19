import { useNavigate } from 'react-router';
import { StatCard } from '@/frontend/components/card';
import { paths } from '@/frontend/config/paths';
import { FormatNumber } from '@/frontend/utils/format';
import type { DashboardKpisType } from '../types';

export function KpiGrid({ kpis }: { kpis: DashboardKpisType }) {
  const navigate = useNavigate();
  return (
    <div className="kpis">
      <StatCard label="Total SKUs" value={kpis.totalSkus} icon="box" onClick={() => navigate(paths.inventory)} />
      <StatCard label="Units in stock" value={FormatNumber(kpis.unitsInStock)} icon="package" />
      <StatCard
        label="Low stock items"
        value={kpis.lowStock + kpis.outOfStock}
        hint={`${kpis.outOfStock} out of stock`}
        icon="alert"
        tone={kpis.outOfStock ? 'critical' : kpis.lowStock ? 'warning' : 'neutral'}
        onClick={() => navigate(paths.inventory)}
      />
      <StatCard label="Open orders" value={kpis.openOrders} icon="orders" onClick={() => navigate(paths.orders)} />
      <StatCard
        label="Incoming deliveries"
        value={kpis.incomingDeliveries}
        hint={`${FormatNumber(kpis.incomingUnits)} units expected`}
        icon="truck"
        onClick={() => navigate(paths.deliveries)}
      />
    </div>
  );
}
