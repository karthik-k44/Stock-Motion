import { db } from '@/backend/db/client';
import type { ActivityRow, DeliveryLineRow, DeliveryRow, ItemViewRow } from '@/backend/db/schema';
import { ACTIVITY_COLUMNS, ToActivityResponse } from '@/backend/modules/activity/activity.mapper';
import { DELIVERY_LINES_SQL, ToDeliveryResponse } from '@/backend/modules/deliveries/deliveries.mapper';
import { ITEM_VIEW_COLUMNS, ToItemResponse } from '@/backend/modules/items/items.mapper';
import type { DashboardResponseType } from '@/backend/types/dashboard';
import { CategoryTypeEnum, StockStatusTypeEnum } from '@/backend/types/item';
import { OrderStatusTypeEnum } from '@/backend/types/order';

async function Get(): Promise<DashboardResponseType> {
  const { rows: itemRows } = await db.query<ItemViewRow>(`SELECT ${ITEM_VIEW_COLUMNS} FROM item_views`);
  const items = itemRows.map(ToItemResponse);

  const { rows: statusRows } = await db.query<{ status: OrderStatusTypeEnum; n: number }>(
    'SELECT status, COUNT(*)::int AS n FROM orders GROUP BY status',
  );
  const ordersByStatus = Object.fromEntries(Object.values(OrderStatusTypeEnum).map((s) => [s, 0])) as Record<OrderStatusTypeEnum, number>;
  statusRows.forEach((r) => (ordersByStatus[r.status] = r.n));

  const { rows: deliveryRows } = await db.query<DeliveryRow>(
    `SELECT * FROM deliveries WHERE status <> 'RECEIVED' ORDER BY expected_at`,
  );
  const { rows: lineRows } = deliveryRows.length
    ? await db.query<DeliveryLineRow>(DELIVERY_LINES_SQL, [deliveryRows.map((d) => d.id)])
    : { rows: [] as DeliveryLineRow[] };
  const upcoming = deliveryRows.map((d) => ToDeliveryResponse(d, lineRows));

  const { rows: activityRows } = await db.query<ActivityRow>(
    `SELECT ${ACTIVITY_COLUMNS} FROM activity ORDER BY at DESC, id DESC LIMIT 8`,
  );

  const count = (s: StockStatusTypeEnum) => items.filter((i) => i.status === s).length;
  return {
    kpis: {
      totalSkus: items.length,
      unitsInStock: items.reduce((s, i) => s + i.onHand, 0),
      lowStock: count(StockStatusTypeEnum.LOW),
      outOfStock: count(StockStatusTypeEnum.OUT),
      openOrders: ordersByStatus.NEW + ordersByStatus.PICKING + ordersByStatus.PACKED,
      incomingDeliveries: upcoming.length,
      incomingUnits: upcoming.reduce((s, d) => s + d.totalExpected, 0),
    },
    stockHealth: {
      inStock: count(StockStatusTypeEnum.IN_STOCK),
      low: count(StockStatusTypeEnum.LOW),
      out: count(StockStatusTypeEnum.OUT),
    },
    ordersByStatus,
    unitsByCategory: Object.values(CategoryTypeEnum).map((category) => ({
      category,
      units: items.filter((i) => i.category === category).reduce((s, i) => s + i.onHand, 0),
    })),
    lowStockItems: items
      .filter((i) => i.status !== StockStatusTypeEnum.IN_STOCK)
      .sort((a, b) => a.available / Math.max(1, a.reorderLevel) - b.available / Math.max(1, b.reorderLevel))
      .slice(0, 6),
    upcomingDeliveries: upcoming.slice(0, 4),
    recentActivity: activityRows.map(ToActivityResponse),
  };
}

export const dashboardService = { Get };
