import { GroupBy } from '@/backend/common/utils/group-by';
import { db } from '@/backend/db/client';
import { ToActivityResponse } from '@/backend/modules/activity/activity.mapper';
import { activityRepository } from '@/backend/modules/activity/activity.repository';
import { categoriesRepository } from '@/backend/modules/categories/categories.repository';
import { ToDeliveryResponse } from '@/backend/modules/deliveries/deliveries.mapper';
import { deliveriesRepository } from '@/backend/modules/deliveries/deliveries.repository';
import { ToItemResponse } from '@/backend/modules/items/items.mapper';
import { itemsRepository } from '@/backend/modules/items/items.repository';
import { locationsRepository } from '@/backend/modules/locations/locations.repository';
import type { ScopeType } from '@/backend/types/business';
import type { DailyPointType, DashboardResponseType, ZoneSummaryType } from '@/backend/types/dashboard';
import { ItemKindTypeEnum, StockStatusTypeEnum, type ItemResponseType } from '@/backend/types/item';
import { dashboardRepository, type DailyValueRow } from './dashboard.repository';

const TREND_DAYS = 14;

const round2 = (n: number) => Math.round(n * 100) / 100;

/** Walks today's stock value back through each day's change, so the series ends on the live figure. */
const stockValueTrend = (today: number, changes: DailyValueRow[]): DailyPointType[] => {
  let closing = today;
  const newestFirst = [...changes].reverse().map(({ day, value }) => {
    const point = { day, value: round2(Math.max(0, closing)) };
    closing -= value;
    return point;
  });
  return newestFirst.reverse();
};

/** Everything the dashboard and the 3D world's stat cards show, in one round trip. */
const Get = async (scope: ScopeType): Promise<DashboardResponseType> => {
  const [itemRows, categories, locations, sales, openByStatus, topSellers, stockChanges, dailyRevenue, counts, deliveryRows, activityRows] = await Promise.all([
    itemsRepository.ListViews(db, scope.businessId),
    categoriesRepository.List(db, scope.businessId),
    locationsRepository.List(db, scope.businessId),
    dashboardRepository.SalesSummary(db, scope.businessId),
    dashboardRepository.OpenByStatus(db, scope.businessId),
    dashboardRepository.TopSellers(db, scope.businessId, 5),
    dashboardRepository.DailyStockChange(db, scope.businessId, TREND_DAYS),
    dashboardRepository.DailyRevenue(db, scope.businessId, TREND_DAYS),
    dashboardRepository.Counts(db, scope.businessId),
    deliveriesRepository.List(db, scope.businessId, { view: 'UPCOMING' }),
    activityRepository.List(db, scope.businessId, { limit: 8 }),
  ]);
  const items = itemRows.map(ToItemResponse);
  const stock = items.filter((i) => i.kind === ItemKindTypeEnum.STOCK);
  const deliveryLines = GroupBy(await deliveriesRepository.ListLines(db, deliveryRows.map((d) => d.id)), (l) => l.delivery_id);
  const upcoming = deliveryRows.map((d) => ToDeliveryResponse(d, deliveryLines.get(d.id) ?? []));

  const count = (list: ItemResponseType[], s: StockStatusTypeEnum) => list.filter((i) => i.status === s).length;
  const ordersByStatus: Record<string, number> = Object.fromEntries(
    scope.template.orderFlow.filter((s) => !s.closed).map((s) => [s.status, 0]),
  );
  openByStatus.forEach((r) => (ordersByStatus[r.status] = r.n));

  const zones: ZoneSummaryType[] = [...new Set(locations.map((l) => l.zone))].map((zone) => {
    const codes = new Set(locations.filter((l) => l.zone === zone).map((l) => l.code));
    const inZone = stock.filter((i) => i.location && codes.has(i.location));
    const template = scope.template.zones.find((z) => z.code === zone);
    return {
      zone,
      name: template?.name ?? zone,
      locations: codes.size,
      filled: new Set(inZone.map((i) => i.location)).size,
      units: inZone.reduce((s, i) => s + i.onHand, 0),
      lowStock: count(inZone, StockStatusTypeEnum.LOW),
      outOfStock: count(inZone, StockStatusTypeEnum.OUT),
    };
  });

  const stockValue = round2(stock.reduce((s, i) => s + i.onHand * i.cost, 0));

  return {
    generatedAt: new Date().toISOString(),
    kpis: {
      totalItems: stock.length,
      madeItems: items.filter((i) => i.kind === ItemKindTypeEnum.MADE).length,
      unitsInStock: stock.reduce((s, i) => s + i.onHand, 0),
      stockValue,
      lowStock: count(stock, StockStatusTypeEnum.LOW),
      outOfStock: count(stock, StockStatusTypeEnum.OUT),
      openOrders: openByStatus.reduce((s, r) => s + r.n, 0),
      ordersToday: sales.orders_today,
      closedToday: sales.closed_today,
      revenueToday: round2(sales.revenue_today),
      revenueMonth: round2(sales.revenue_month),
      averageOrder: sales.closed_month ? round2(sales.revenue_month / sales.closed_month) : 0,
      incomingDeliveries: upcoming.length,
      incomingUnits: upcoming.reduce((s, d) => s + d.totalExpected, 0),
      customers: counts.customers,
      newCustomersMonth: counts.new_customers_month,
      team: counts.team,
    },
    stockHealth: {
      inStock: count(stock, StockStatusTypeEnum.IN_STOCK),
      low: count(stock, StockStatusTypeEnum.LOW),
      out: count(stock, StockStatusTypeEnum.OUT),
    },
    trends: {
      stockValue: stockValueTrend(stockValue, stockChanges),
      revenue: dailyRevenue.map((r) => ({ day: r.day, value: round2(r.value) })),
    },
    ordersByStatus,
    unitsByCategory: categories
      .map((c) => ({ category: c.code, name: c.name, units: stock.filter((i) => i.category === c.code).reduce((s, i) => s + i.onHand, 0) }))
      .filter((c) => c.units > 0),
    zones,
    topSellers,
    lowStockItems: stock
      .filter((i) => i.status !== StockStatusTypeEnum.IN_STOCK)
      .sort((a, b) => a.available / Math.max(1, a.reorderLevel) - b.available / Math.max(1, b.reorderLevel))
      .slice(0, 6),
    upcomingDeliveries: upcoming.slice(0, 4),
    recentActivity: activityRows.map(ToActivityResponse),
  };
};

export const dashboardService = { Get };
