import type { ActivityResponseType } from '@/frontend/features/activity/types';
import type { DeliveryResponseType } from '@/frontend/features/deliveries/types';
import type { ItemResponseType } from '@/frontend/features/inventory/types';

export type DashboardKpisType = {
  totalItems: number;
  madeItems: number;
  unitsInStock: number;
  stockValue: number;
  lowStock: number;
  outOfStock: number;
  openOrders: number;
  ordersToday: number;
  closedToday: number;
  revenueToday: number;
  revenueMonth: number;
  averageOrder: number;
  incomingDeliveries: number;
  incomingUnits: number;
  customers: number;
  newCustomersMonth: number;
  team: number;
};

export type ZoneSummaryType = {
  zone: string;
  name: string;
  locations: number;
  filled: number;
  units: number;
  lowStock: number;
  outOfStock: number;
};

export type DashboardResponseType = {
  generatedAt: string;
  kpis: DashboardKpisType;
  stockHealth: { inStock: number; low: number; out: number };
  ordersByStatus: Record<string, number>;
  unitsByCategory: { category: string; name: string; units: number }[];
  zones: ZoneSummaryType[];
  topSellers: { sku: string; name: string; qty: number; revenue: number }[];
  lowStockItems: ItemResponseType[];
  upcomingDeliveries: DeliveryResponseType[];
  recentActivity: ActivityResponseType[];
};

/** Every dashboard type under one name. */
export type TDashboardType = {
  Response: DashboardResponseType;
  Kpis: DashboardKpisType;
  Zone: ZoneSummaryType;
};
