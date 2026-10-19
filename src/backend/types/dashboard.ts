import type { ActivityResponseType } from './activity';
import type { DeliveryResponseType } from './delivery';
import type { ItemResponseType } from './item';

export type LocationResponseType = {
  code: string;
  zone: string;
  name: string;
  items: ItemResponseType[];
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
  kpis: {
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
  stockHealth: { inStock: number; low: number; out: number };
  /** Open orders per stage of the template's flow */
  ordersByStatus: Record<string, number>;
  unitsByCategory: { category: string; name: string; units: number }[];
  zones: ZoneSummaryType[];
  topSellers: { sku: string; name: string; qty: number; revenue: number }[];
  lowStockItems: ItemResponseType[];
  upcomingDeliveries: DeliveryResponseType[];
  recentActivity: ActivityResponseType[];
};

export const ResourceTypeEnum = {
  ITEMS: 'items',
  ORDERS: 'orders',
  DELIVERIES: 'deliveries',
  LOCATIONS: 'locations',
  ACTIVITY: 'activity',
  DASHBOARD: 'dashboard',
  CUSTOMERS: 'customers',
  SUPPLIERS: 'suppliers',
  CATEGORIES: 'categories',
  MEMBERS: 'members',
  BUSINESS: 'business',
} as const;
export type ResourceTypeEnum = (typeof ResourceTypeEnum)[keyof typeof ResourceTypeEnum];

/** Payload of the `data:changed` realtime event */
export type DataChangedPayloadType = {
  businessId: string;
  resources: ResourceTypeEnum[];
  activity: ActivityResponseType[];
};
