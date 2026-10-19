import type { ActivityResponseType } from '@/frontend/features/activity/types';
import type { DeliveryResponseType } from '@/frontend/features/deliveries/types';
import type { CategoryTypeEnum, ItemResponseType } from '@/frontend/features/inventory/types';
import type { OrderStatusTypeEnum } from '@/frontend/features/orders/types';

export type DashboardKpisType = {
  totalSkus: number;
  unitsInStock: number;
  lowStock: number;
  outOfStock: number;
  openOrders: number;
  incomingDeliveries: number;
  incomingUnits: number;
};

export type DashboardResponseType = {
  kpis: DashboardKpisType;
  stockHealth: { inStock: number; low: number; out: number };
  ordersByStatus: Record<OrderStatusTypeEnum, number>;
  unitsByCategory: { category: CategoryTypeEnum; units: number }[];
  lowStockItems: ItemResponseType[];
  upcomingDeliveries: DeliveryResponseType[];
  recentActivity: ActivityResponseType[];
};

/** Every dashboard type under one name. */
export type TDashboardType = {
  Response: DashboardResponseType;
  Kpis: DashboardKpisType;
};
