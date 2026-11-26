import { pgEnum } from 'drizzle-orm/pg-core';
import { ActivityKindTypeEnum, ActivityRefTypeEnum } from '@/backend/types/activity';
import { BillingIntervalTypeEnum, BillingProviderTypeEnum, InvoiceStatusTypeEnum, PlanCodeEnum, SubscriptionStatusTypeEnum } from '@/backend/types/billing';
import { DeliveryStatusTypeEnum } from '@/backend/types/delivery';
import { ItemKindTypeEnum, MovementTypeEnum } from '@/backend/types/item';
import { OrderStatusTypeEnum } from '@/backend/types/order';
import { BusinessTypeEnum } from '@/backend/types/template';

/**
 * PostgreSQL enum types for every fixed set of values, built from the TypeScript enums in `backend/types` so the two
 * can't drift: add a value there, then `npm run db:generate` writes the `ALTER TYPE … ADD VALUE` migration.
 */
const valuesOf = <T extends Record<string, string>>(e: T) => Object.values(e) as [T[keyof T], ...T[keyof T][]];

export const businessTypeEnum = pgEnum('business_type', valuesOf(BusinessTypeEnum));
export const itemKindEnum = pgEnum('item_kind', valuesOf(ItemKindTypeEnum));
export const orderStatusEnum = pgEnum('order_status', valuesOf(OrderStatusTypeEnum));
export const deliveryStatusEnum = pgEnum('delivery_status', valuesOf(DeliveryStatusTypeEnum));
export const movementTypeEnum = pgEnum('movement_type', valuesOf(MovementTypeEnum));
export const activityKindEnum = pgEnum('activity_kind', valuesOf(ActivityKindTypeEnum));
export const activityRefTypeEnum = pgEnum('activity_ref_type', valuesOf(ActivityRefTypeEnum));
export const subscriptionPlanEnum = pgEnum('subscription_plan', valuesOf(PlanCodeEnum));
export const subscriptionStatusEnum = pgEnum('subscription_status', valuesOf(SubscriptionStatusTypeEnum));
export const billingProviderEnum = pgEnum('billing_provider', valuesOf(BillingProviderTypeEnum));
export const billingIntervalEnum = pgEnum('billing_interval', valuesOf(BillingIntervalTypeEnum));
export const invoiceStatusEnum = pgEnum('invoice_status', valuesOf(InvoiceStatusTypeEnum));
