import type { ActivityResponseType } from './activity';
import type { DeliveryResponseType } from './delivery';
import type { CategoryTypeEnum, ItemResponseType } from './item';
import type { OrderStatusTypeEnum } from './order';

export type LocationResponseType = {
  code: string;
  aisle: string;
  level: number;
  bin: number;
  item: ItemResponseType | null;
};

export type DashboardResponseType = {
  kpis: {
    totalSkus: number;
    unitsInStock: number;
    lowStock: number;
    outOfStock: number;
    openOrders: number;
    incomingDeliveries: number;
    incomingUnits: number;
  };
  stockHealth: { inStock: number; low: number; out: number };
  ordersByStatus: Record<OrderStatusTypeEnum, number>;
  unitsByCategory: { category: CategoryTypeEnum; units: number }[];
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
  USERS: 'users',
} as const;
export type ResourceTypeEnum = (typeof ResourceTypeEnum)[keyof typeof ResourceTypeEnum];

/** Payload of the `data:changed` realtime event */
export type DataChangedPayloadType = {
  resources: ResourceTypeEnum[];
  activity: ActivityResponseType[];
};
