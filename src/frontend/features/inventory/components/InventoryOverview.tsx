import { useNavigate } from 'react-router';
import { Badge } from '@/frontend/components/badge';
import { HeroCard, StatCard } from '@/frontend/components/card';
import { Skeleton } from '@/frontend/components/feedback';
import { paths } from '@/frontend/config/paths';
import { businessesService } from '@/frontend/features/businesses/services';
import { dashboardService } from '@/frontend/features/dashboard/services';
import { PercentChange } from '@/frontend/utils/chart';
import { FormatMoney, FormatNumber } from '@/frontend/utils/format';
import { CategoryLabel, ValueByCategory } from '../lib/inventory-stats';
import { categoriesService, inventoryService } from '../services';
import { ItemFilterStatusTypeEnum, ItemKindTypeEnum } from '../types';
import { RestockCard } from './RestockCard';
import { StockValueChart } from './StockValueChart';

type Props = { onReview: (status: ItemFilterStatusTypeEnum) => void };

const WEEK = 7;

/** The whole stockroom at a glance. It always counts everything stocked, whatever the table below is filtered to. */
export const InventoryOverview = ({ onReview }: Props) => {
  const navigate = useNavigate();
  const business = businessesService.useBusiness();
  const { labels } = business.template;
  const { data: dashboard } = dashboardService.useGetDashboard();
  const { data: items } = inventoryService.useGetItems({ kind: ItemKindTypeEnum.STOCK });
  const { data: categories } = categoriesService.useGetCategories();

  if (!dashboard || !items) {
    return (
      <div className="overview" role="status" aria-label="Loading overview">
        <Skeleton className="overview-lead" height={216} />
        {Array.from({ length: 4 }, (_, i) => <Skeleton key={i} height={100} />)}
      </div>
    );
  }

  const { kpis, trends } = dashboard;
  const money = (n: number) => FormatMoney(n, business.currency);
  const byCategory = ValueByCategory(items);
  const trend = trends.stockValue;
  const change = PercentChange(trend[trend.length - 1 - WEEK].value, trend[trend.length - 1].value);
  const largest = byCategory.length ? CategoryLabel(byCategory[0].category, (code) => categoriesService.CategoryName(categories, code)) : null;
  const attention = kpis.lowStock + kpis.outOfStock;

  return (
    <div className="overview">
      <HeroCard
        className="overview-lead"
        label="Stock value"
        value={money(kpis.stockValue)}
        trend={trend}
        trendLabel="Stock value"
        formatValue={money}
        change={change}
        changeLabel={change === null ? 'last 14 days below' : 'from 7 days ago'}
      />
      <StatCard label={`Total ${labels.items.toLowerCase()}`} value={FormatNumber(kpis.totalItems)} hint={`${FormatNumber(kpis.unitsInStock)} units at cost`} icon="box" />
      <StatCard label="Categories" value={byCategory.length} hint={largest ? `Largest: ${largest}` : 'Nothing in stock yet'} icon="grid" />
      <StatCard
        label="Need attention"
        value={attention}
        hint={`${kpis.lowStock} low · ${kpis.outOfStock} out`}
        badge={kpis.outOfStock > 0 && <Badge tone="critical">{kpis.outOfStock} out</Badge>}
        icon="alert"
        tone={kpis.outOfStock ? 'critical' : kpis.lowStock ? 'warning' : 'neutral'}
        onClick={attention ? () => onReview(kpis.outOfStock ? ItemFilterStatusTypeEnum.OUT : ItemFilterStatusTypeEnum.LOW) : undefined}
      />
      <StatCard
        label={labels.deliveries}
        value={kpis.incomingDeliveries}
        hint={`${FormatNumber(kpis.incomingUnits)} units on the way`}
        icon="truck"
        onClick={() => navigate(paths.deliveries)}
      />
      <StockValueChart rows={byCategory} className="overview-wide" />
      <RestockCard items={items} onReview={onReview} className="overview-side" />
    </div>
  );
};
