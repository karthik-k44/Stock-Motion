import { Card } from '@/frontend/components/card';
import { ErrorState, Skeleton, SkeletonRows } from '@/frontend/components/feedback';
import { PageHeader } from '@/frontend/components/layout';
import { ActivityFeed } from '@/frontend/features/activity/components/ActivityFeed';
import { activityService } from '@/frontend/features/activity/services';
import { ORDER_STEPS } from '@/frontend/features/orders/lib/order-flow';
import { useDocumentTitle } from '@/frontend/hooks/use-document-title';
import { CATEGORY_COLOR } from '@/frontend/utils/category';
import { FormatNumber } from '@/frontend/utils/format';
import { HumanizeCategory, HumanizeOrderStatus } from '@/frontend/utils/humanize';
import { BarList } from './components/BarList';
import { KpiGrid } from './components/KpiGrid';
import { LowStockList } from './components/LowStockList';
import { StockHealthChart } from './components/StockHealthChart';
import { UpcomingDeliveries } from './components/UpcomingDeliveries';
import { dashboardService } from './services';

export function Dashboard() {
  useDocumentTitle('Dashboard');
  const { data, isPending, isError, error, refetch } = dashboardService.useDashboard();
  const activity = activityService.useActivity({ limit: 8 });

  if (isError) return <ErrorState message={error.message} onRetry={() => refetch()} />;

  return (
    <div className="page">
      <PageHeader title="Dashboard" description="Stock, orders and inbound trucks at a glance. Updates live as work happens." />
      {isPending ? (
        <div className="kpis" role="status" aria-label="Loading dashboard">
          {Array.from({ length: 5 }, (_, i) => (
            <Skeleton key={i} height={104} />
          ))}
        </div>
      ) : (
        <KpiGrid kpis={data.kpis} />
      )}
      <div className="grid-3">
        {isPending ? <SkeletonRows rows={3} height={60} /> : <StockHealthChart health={data.stockHealth} />}
        <Card title="Orders by status">
          {isPending ? (
            <SkeletonRows rows={4} height={24} />
          ) : (
            <BarList
              label="Orders by status"
              rows={ORDER_STEPS.map((s) => ({ key: s, label: HumanizeOrderStatus(s), value: data.ordersByStatus[s] }))}
            />
          )}
        </Card>
        <Card title="Units by category">
          {isPending ? (
            <SkeletonRows rows={6} height={20} />
          ) : (
            <BarList
              label="Units on hand by category"
              rows={data.unitsByCategory.map((c) => ({
                key: c.category,
                label: (
                  <>
                    <span className="cat-swatch" style={{ background: CATEGORY_COLOR[c.category] }} aria-hidden />
                    {HumanizeCategory(c.category)}
                  </>
                ),
                value: c.units,
                display: FormatNumber(c.units),
              }))}
            />
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
    </div>
  );
}
