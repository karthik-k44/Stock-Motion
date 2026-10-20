import { Card } from '@/frontend/components/card';
import { EmptyState, ErrorState, Skeleton, SkeletonRows } from '@/frontend/components/feedback';
import { PageHeader } from '@/frontend/components/layout';
import { ActivityFeed } from '@/frontend/features/activity/components/ActivityFeed';
import { activityService } from '@/frontend/features/activity/services';
import { businessesService } from '@/frontend/features/businesses/services';
import { categoriesService } from '@/frontend/features/inventory/services';
import { useDocumentTitle } from '@/frontend/hooks/use-document-title';
import { CategoryColor } from '@/frontend/utils/category';
import { FormatMoney, FormatNumber } from '@/frontend/utils/format';
import { BarList } from './components/BarList';
import { KpiGrid } from './components/KpiGrid';
import { LowStockList } from './components/LowStockList';
import { StockHealthChart } from './components/StockHealthChart';
import { UpcomingDeliveries } from './components/UpcomingDeliveries';
import { dashboardService } from './services';

export const Dashboard = () => {
  useDocumentTitle('Dashboard');
  const business = businessesService.useBusiness();
  const { labels, orderFlow } = business.template;
  const { data, isPending, isError, error, refetch } = dashboardService.useDashboard();
  const { data: categories } = categoriesService.useCategories();
  const activity = activityService.useActivity({ limit: 8 });

  if (isError) return <ErrorState message={error.message} onRetry={() => refetch()} />;

  return (
    <div className="page">
      <PageHeader title={business.name} description={`${business.template.name} · money, stock and ${labels.orders.toLowerCase()} at a glance. Updates live as your team works.`} />
      {isPending ? (
        <div className="kpis" role="status" aria-label="Loading dashboard">
          {Array.from({ length: 6 }, (_, i) => <Skeleton key={i} height={104} />)}
        </div>
      ) : (
        <KpiGrid kpis={data.kpis} />
      )}
      <div className="grid-3">
        {isPending ? <SkeletonRows rows={3} height={60} /> : <StockHealthChart health={data.stockHealth} />}
        <Card title={`Open ${labels.orders.toLowerCase()} by stage`}>
          {isPending ? (
            <SkeletonRows rows={4} height={24} />
          ) : (
            <BarList label="Open by stage" rows={orderFlow.filter((s) => !s.closed).map((s) => ({ key: s.status, label: s.label, value: data.ordersByStatus[s.status] ?? 0 }))} />
          )}
        </Card>
        <Card title="Best sellers this month">
          {isPending ? (
            <SkeletonRows rows={5} height={20} />
          ) : !data.topSellers.length ? (
            <EmptyState icon="orders" title={`No closed ${labels.orders.toLowerCase()} this month yet`} />
          ) : (
            <BarList label="Best sellers by quantity" rows={data.topSellers.map((t) => ({ key: t.sku, label: t.name, value: t.qty, display: `${t.qty} · ${FormatMoney(t.revenue, business.currency)}` }))} />
          )}
        </Card>
      </div>
      <div className="grid-3">
        {isPending ? <SkeletonRows rows={4} /> : <LowStockList items={data.lowStockItems} />}
        {isPending ? <SkeletonRows rows={4} /> : <UpcomingDeliveries deliveries={data.upcomingDeliveries} />}
        <Card title="Recent activity">
          <ActivityFeed query={activity} compact />
        </Card>
      </div>
      {!isPending && data.unitsByCategory.length > 0 && (
        <Card title="Units on hand by category">
          <BarList
            label="Units on hand by category"
            rows={data.unitsByCategory.map((c) => ({
              key: c.category,
              label: (
                <>
                  <span className="cat-swatch" style={{ background: CategoryColor(categories, c.category) }} aria-hidden />
                  {c.name}
                </>
              ),
              value: c.units,
              display: FormatNumber(c.units),
            }))}
          />
        </Card>
      )}
    </div>
  );
};
