import { boolean, foreignKey, index, integer, pgTable, text, unique } from 'drizzle-orm/pg-core';
import { accounts } from './accounts';
import { createdAt, timestampTz } from './_shared';
import { billingIntervalEnum, billingProviderEnum, invoiceStatusEnum, subscriptionPlanEnum, subscriptionStatusEnum } from './enums';
import { prefixedId } from './ids';

/**
 * One per account: the plan that account's businesses run on. Starts as a 14-day trial on first use. `current_period_end`
 * is when the trial or the paid period ends (null: no end, e.g. a plan granted by hand). During the trial, `next_plan`,
 * `billing_interval` and `quantity` are what the owner chose to pay for once it ends. A checkout in progress waits in
 * the `pending_*` columns, so an active plan keeps working until the new one is paid for.
 */
export const subscriptions = pgTable(
  'subscriptions',
  {
    id: prefixedId('subscriptions'),
    account_id: text().notNull(),
    plan: subscriptionPlanEnum().notNull(),
    /** Inventories (businesses) paid for: the price is per inventory, and the account can own this many */
    quantity: integer().notNull().default(1),
    /** Paid every month or once a year */
    billing_interval: billingIntervalEnum().notNull().default('MONTHLY'),
    /** During the trial: the plan chosen for when it ends (null: not chosen yet) */
    next_plan: subscriptionPlanEnum(),
    status: subscriptionStatusEnum().notNull(),
    provider: billingProviderEnum().notNull(),
    provider_subscription_id: text(),
    current_period_end: timestampTz(),
    cancel_at_period_end: boolean().notNull().default(false),
    pending_plan: subscriptionPlanEnum(),
    pending_quantity: integer(),
    pending_interval: billingIntervalEnum(),
    pending_provider_subscription_id: text(),
    /** A Razorpay order for one period, waiting to be paid (ORDERS mode) */
    pending_order_id: text(),
    created_at: createdAt(),
    updated_at: timestampTz().notNull().defaultNow(),
  },
  (t) => [
    unique('subscriptions_account_id_key').on(t.account_id),
    unique('subscriptions_provider_subscription_id_key').on(t.provider_subscription_id),
    foreignKey({ name: 'subscriptions_account_id_fkey', columns: [t.account_id], foreignColumns: [accounts.id] }).onDelete('cascade'),
  ],
);

/** Razorpay plans this app created, one per plan, interval and price, so each is created once (Razorpay plans can't be edited). */
export const razorpayPlans = pgTable(
  'razorpay_plans',
  {
    plan: subscriptionPlanEnum().notNull(),
    interval: billingIntervalEnum().notNull().default('MONTHLY'),
    /** Price of one inventory per period; the subscription's quantity multiplies it */
    amount: integer().notNull(),
    currency: text().notNull(),
    razorpay_plan_id: text().primaryKey(),
    created_at: createdAt(),
  },
  (t) => [unique('razorpay_plans_plan_interval_amount_currency_key').on(t.plan, t.interval, t.amount, t.currency)],
);

/** Webhook events already applied, by Razorpay's event id: a retried delivery is acknowledged and skipped. */
export const billingEvents = pgTable('billing_events', {
  event_id: text().primaryKey(),
  received_at: createdAt(),
});

/**
 * One per payment that went through: what was bought (plan, interval, inventories, price), for which period, who was
 * billed and how they paid. Written once per Razorpay payment (unique payment id), whichever reports it first.
 */
export const invoices = pgTable(
  'invoices',
  {
    id: prefixedId('invoices'),
    account_id: text().notNull(),
    status: invoiceStatusEnum().notNull().default('PAID'),
    plan: subscriptionPlanEnum().notNull(),
    billing_interval: billingIntervalEnum().notNull(),
    quantity: integer().notNull(),
    /** Price of one inventory for the period, in the currency's smallest unit */
    unit_amount: integer().notNull(),
    /** What was charged: unit_amount × quantity */
    amount: integer().notNull(),
    currency: text().notNull(),
    provider: billingProviderEnum().notNull(),
    provider_payment_id: text(),
    provider_order_id: text(),
    provider_subscription_id: text(),
    /** upi, card, netbanking, wallet … as Razorpay reports it */
    payment_method: text(),
    billed_name: text().notNull(),
    billed_email: text().notNull(),
    billed_contact: text(),
    period_start: timestampTz().notNull(),
    period_end: timestampTz().notNull(),
    paid_at: timestampTz().notNull().defaultNow(),
    created_at: createdAt(),
  },
  (t) => [
    unique('invoices_provider_payment_id_key').on(t.provider_payment_id),
    index('invoices_account_id_idx').on(t.account_id, t.paid_at),
    foreignKey({ name: 'invoices_account_id_fkey', columns: [t.account_id], foreignColumns: [accounts.id] }).onDelete('cascade'),
  ],
);

export type SubscriptionRow = typeof subscriptions.$inferSelect;
export type InvoiceRow = typeof invoices.$inferSelect;
