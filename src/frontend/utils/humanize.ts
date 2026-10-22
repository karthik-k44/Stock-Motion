import type { ActivityKindTypeEnum } from '@/frontend/features/activity/types';
import type { DeliveryStatusTypeEnum } from '@/frontend/features/deliveries/types';
import type { AdjustReasonTypeEnum, ItemKindTypeEnum, MovementTypeEnum, StockStatusTypeEnum } from '@/frontend/features/inventory/types';

const STOCK: Record<StockStatusTypeEnum, string> = { IN_STOCK: 'In stock', LOW: 'Low stock', OUT: 'Out of stock' };
const DELIVERY: Record<DeliveryStatusTypeEnum, string> = {
  SCHEDULED: 'Scheduled',
  IN_TRANSIT: 'On the way',
  ARRIVED: 'Arrived',
  RECEIVED: 'Received',
};
const ACTIVITY: Record<ActivityKindTypeEnum, string> = {
  DELIVERY: 'Deliveries',
  ADJUSTMENT: 'Stock counts & adjustments',
  ALLOCATION: 'Reservations',
  CONSUME: 'Stock used',
  STATUS: 'Order updates',
  RELOCATION: 'Moves',
  CATALOG: 'Catalogue changes',
  TEAM: 'Team',
  SYSTEM: 'System',
};
const REASON: Record<AdjustReasonTypeEnum, string> = {
  CYCLE_COUNT: 'Stock count',
  DAMAGED: 'Damaged',
  WASTE: 'Waste / spoiled',
  FOUND: 'Found stock',
  RETURN: 'Customer return',
  OTHER: 'Other',
};
const MOVEMENT: Record<MovementTypeEnum, string> = { RECEIPT: 'Received', CONSUME: 'Used', ADJUSTMENT: 'Adjusted', RELOCATION: 'Moved' };
const KIND: Record<ItemKindTypeEnum, string> = { STOCK: 'Stock', MADE: 'Made', SERVICE: 'Service' };

export const HumanizeStockStatus = (s: StockStatusTypeEnum) => STOCK[s] ?? s;
export const HumanizeDeliveryStatus = (s: DeliveryStatusTypeEnum) => DELIVERY[s] ?? s;
export const HumanizeActivityKind = (k: ActivityKindTypeEnum) => ACTIVITY[k] ?? k;
export const HumanizeReason = (r: AdjustReasonTypeEnum) => REASON[r] ?? r;
export const HumanizeMovement = (m: MovementTypeEnum) => MOVEMENT[m] ?? m;
export const HumanizeKind = (k: ItemKindTypeEnum) => KIND[k] ?? k;
