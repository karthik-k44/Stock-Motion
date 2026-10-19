import type { ActivityKindTypeEnum } from '@/frontend/features/activity/types';
import type { DeliveryStatusTypeEnum } from '@/frontend/features/deliveries/types';
import type { AdjustReasonTypeEnum, CategoryTypeEnum, StockStatusTypeEnum } from '@/frontend/features/inventory/types';
import type { OrderStatusTypeEnum } from '@/frontend/features/orders/types';
import type { UserRoleTypeEnum } from '@/frontend/features/users/types';

const CATEGORY: Record<CategoryTypeEnum, string> = {
  ELECTRONICS: 'Electronics',
  OFFICE: 'Office',
  HOME_KITCHEN: 'Home & Kitchen',
  APPAREL: 'Apparel',
  OUTDOOR: 'Outdoor',
  HEALTH_BEAUTY: 'Health & Beauty',
};
const STOCK: Record<StockStatusTypeEnum, string> = { IN_STOCK: 'In stock', LOW: 'Low stock', OUT: 'Out of stock' };
const ORDER: Record<OrderStatusTypeEnum, string> = { NEW: 'New', PICKING: 'Picking', PACKED: 'Packed', SHIPPED: 'Shipped' };
const DELIVERY: Record<DeliveryStatusTypeEnum, string> = {
  SCHEDULED: 'Scheduled',
  IN_TRANSIT: 'In transit',
  UNLOADING: 'Unloading',
  RECEIVED: 'Received',
};
const ROLE: Record<UserRoleTypeEnum, string> = {
  INVENTORY_MANAGER: 'Inventory manager',
  PICKER: 'Picker',
  FORKLIFT_OPERATOR: 'Forklift operator',
  RECEIVING_LEAD: 'Receiving lead',
  PACKER: 'Packer',
};
const ACTIVITY: Record<ActivityKindTypeEnum, string> = {
  DELIVERY: 'Delivery',
  ADJUSTMENT: 'Adjustment',
  ALLOCATION: 'Allocation',
  PICK: 'Picking',
  PACK: 'Packing',
  SHIP: 'Shipment',
  RELOCATION: 'Relocation',
  SYSTEM: 'Update',
};
const REASON: Record<AdjustReasonTypeEnum, string> = {
  CYCLE_COUNT: 'Cycle count',
  DAMAGED: 'Damaged',
  FOUND: 'Found stock',
  RETURN: 'Customer return',
  OTHER: 'Other',
};

export const HumanizeCategory = (c: CategoryTypeEnum) => CATEGORY[c] ?? c;
export const HumanizeStockStatus = (s: StockStatusTypeEnum) => STOCK[s] ?? s;
export const HumanizeOrderStatus = (s: OrderStatusTypeEnum) => ORDER[s] ?? s;
export const HumanizeDeliveryStatus = (s: DeliveryStatusTypeEnum) => DELIVERY[s] ?? s;
export const HumanizeRole = (r: UserRoleTypeEnum) => ROLE[r] ?? r;
export const HumanizeActivityKind = (k: ActivityKindTypeEnum) => ACTIVITY[k] ?? k;
export const HumanizeReason = (r: AdjustReasonTypeEnum) => REASON[r] ?? r;
