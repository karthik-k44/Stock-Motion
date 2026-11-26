import { and, desc, eq, or } from 'drizzle-orm';
import type { Queryable } from '@/backend/db/client';
import { billingEvents, businesses, invoices, razorpayPlans, subscriptions, type InvoiceRow, type SubscriptionRow } from '@/backend/db/schema';
import { NewestIdFirst } from '@/backend/db/schema/ids';
import { type BillingIntervalTypeEnum, BillingProviderTypeEnum, PlanCodeEnum, SubscriptionStatusTypeEnum } from '@/backend/types/billing';

export type SubscriptionChangesType = Partial<
  Pick<
    SubscriptionRow,
    | 'plan'
    | 'quantity'
    | 'billing_interval'
    | 'next_plan'
    | 'status'
    | 'provider'
    | 'provider_subscription_id'
    | 'current_period_end'
    | 'cancel_at_period_end'
    | 'pending_plan'
    | 'pending_quantity'
    | 'pending_interval'
    | 'pending_provider_subscription_id'
    | 'pending_order_id'
  >
>;

const FindByAccount = async (q: Queryable, accountId: string): Promise<SubscriptionRow | undefined> => {
  const [row] = await q.select().from(subscriptions).where(eq(subscriptions.account_id, accountId));
  return row;
};

/** Locked until the transaction ends, so two checkouts or webhooks for one account apply one at a time. */
const LockByAccount = async (q: Queryable, accountId: string): Promise<SubscriptionRow | undefined> => {
  const [row] = await q.select().from(subscriptions).where(eq(subscriptions.account_id, accountId)).for('update');
  return row;
};

/** The subscription a Razorpay subscription id belongs to, active or still at checkout. Locked. */
const LockByProviderSubscriptionId = async (q: Queryable, providerSubscriptionId: string): Promise<SubscriptionRow | undefined> => {
  const [row] = await q
    .select()
    .from(subscriptions)
    .where(
      or(
        eq(subscriptions.provider_subscription_id, providerSubscriptionId),
        eq(subscriptions.pending_provider_subscription_id, providerSubscriptionId),
      ),
    )
    .for('update');
  return row;
};

/** The subscription waiting on a one-month Razorpay order. Locked. */
const LockByPendingOrderId = async (q: Queryable, orderId: string): Promise<SubscriptionRow | undefined> => {
  const [row] = await q.select().from(subscriptions).where(eq(subscriptions.pending_order_id, orderId)).for('update');
  return row;
};

/** Start a trial for an account that has no subscription yet; does nothing if it already has one. */
const InsertTrialIfMissing = async (q: Queryable, accountId: string, trialEndsAt: Date): Promise<void> => {
  await q
    .insert(subscriptions)
    .values({
      account_id: accountId,
      plan: PlanCodeEnum.TRIAL,
      status: SubscriptionStatusTypeEnum.TRIALING,
      provider: BillingProviderTypeEnum.TRIAL,
      current_period_end: trialEndsAt,
    })
    .onConflictDoNothing({ target: subscriptions.account_id });
};

/** Clears a checkout in progress. */
export const NO_PENDING = {
  pending_plan: null,
  pending_quantity: null,
  pending_interval: null,
  pending_provider_subscription_id: null,
  pending_order_id: null,
} as const satisfies SubscriptionChangesType;

const Update = async (q: Queryable, id: string, changes: SubscriptionChangesType): Promise<SubscriptionRow> => {
  const [row] = await q.update(subscriptions).set({ ...changes, updated_at: new Date() }).where(eq(subscriptions.id, id)).returning();
  return row;
};

/** Set an account's plan outright (plans granted by hand, the demo account), creating the row if needed. */
const Assign = async (
  q: Queryable,
  accountId: string,
  values: Required<Pick<SubscriptionChangesType, 'plan' | 'status' | 'provider' | 'current_period_end'>>,
): Promise<void> => {
  const changes = { ...values, provider_subscription_id: null, cancel_at_period_end: false, next_plan: null, ...NO_PENDING };
  await q
    .insert(subscriptions)
    .values({ account_id: accountId, ...changes })
    .onConflictDoUpdate({ target: subscriptions.account_id, set: { ...changes, updated_at: new Date() } });
};

/** Who pays for a business (whoever created it) and their subscription, if they have one yet. */
const FindForBusiness = async (q: Queryable, businessId: string): Promise<{ owner_id: string | null; subscription: SubscriptionRow | null } | undefined> => {
  const [row] = await q
    .select({ owner_id: businesses.created_by, subscription: subscriptions })
    .from(businesses)
    .leftJoin(subscriptions, eq(subscriptions.account_id, businesses.created_by))
    .where(eq(businesses.id, businessId));
  return row;
};

const CountBusinessesCreatedBy = (q: Queryable, accountId: string): Promise<number> => {
  return q.$count(businesses, eq(businesses.created_by, accountId));
};

export type RazorpayPlanKeyType = { plan: PlanCodeEnum; interval: BillingIntervalTypeEnum; amount: number; currency: string };

const FindRazorpayPlan = async (q: Queryable, key: RazorpayPlanKeyType): Promise<string | undefined> => {
  const [row] = await q
    .select({ id: razorpayPlans.razorpay_plan_id })
    .from(razorpayPlans)
    .where(
      and(
        eq(razorpayPlans.plan, key.plan),
        eq(razorpayPlans.interval, key.interval),
        eq(razorpayPlans.amount, key.amount),
        eq(razorpayPlans.currency, key.currency),
      ),
    );
  return row?.id;
};

const InsertRazorpayPlan = async (q: Queryable, key: RazorpayPlanKeyType, razorpayPlanId: string): Promise<void> => {
  await q
    .insert(razorpayPlans)
    .values({ plan: key.plan, interval: key.interval, amount: key.amount, currency: key.currency, razorpay_plan_id: razorpayPlanId })
    .onConflictDoNothing();
};

/** Record a webhook event as applied. False when it already was (a retried delivery). */
const RecordEvent = async (q: Queryable, eventId: string): Promise<boolean> => {
  const inserted = await q.insert(billingEvents).values({ event_id: eventId }).onConflictDoNothing().returning({ id: billingEvents.event_id });
  return inserted.length > 0;
};

export type NewInvoiceType = typeof invoices.$inferInsert;

/** Write an invoice; a payment already invoiced (same Razorpay payment id) is left as it is. */
const InsertInvoice = async (q: Queryable, invoice: NewInvoiceType): Promise<void> => {
  await q.insert(invoices).values(invoice).onConflictDoNothing({ target: invoices.provider_payment_id });
};

/** An account's invoices, newest first. */
const ListInvoices = (q: Queryable, accountId: string): Promise<InvoiceRow[]> => {
  return q
    .select()
    .from(invoices)
    .where(eq(invoices.account_id, accountId))
    .orderBy(desc(invoices.paid_at), ...NewestIdFirst(invoices.id));
};

/** One of the account's invoices; undefined for someone else's. */
const FindInvoice = async (q: Queryable, accountId: string, id: string): Promise<InvoiceRow | undefined> => {
  const [row] = await q.select().from(invoices).where(and(eq(invoices.id, id), eq(invoices.account_id, accountId)));
  return row;
};

export const billingRepository = {
  FindByAccount,
  LockByAccount,
  LockByProviderSubscriptionId,
  LockByPendingOrderId,
  InsertTrialIfMissing,
  Update,
  Assign,
  FindForBusiness,
  CountBusinessesCreatedBy,
  FindRazorpayPlan,
  InsertRazorpayPlan,
  RecordEvent,
  InsertInvoice,
  ListInvoices,
  FindInvoice,
};
