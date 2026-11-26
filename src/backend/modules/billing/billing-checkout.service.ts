import { z } from 'zod';
import { BadRequest, Unavailable } from '@/backend/common/errors';
import { env } from '@/backend/config/env';
import { logger } from '@/backend/config/logger';
import { db, type Queryable } from '@/backend/db/client';
import type { SubscriptionRow } from '@/backend/db/schema';
import type { AccountResponseType } from '@/backend/types/account';
import {
  BillingIntervalTypeEnum,
  BillingProviderTypeEnum,
  CheckoutModeTypeEnum,
  PlanCodeEnum,
  RazorpayModeTypeEnum,
  SubscriptionStatusTypeEnum,
  type BillingResponseType,
  type CheckoutResponseType,
} from '@/backend/types/billing';
import { billingInvoicesService } from './billing-invoices.service';
import { billingRepository, NO_PENDING } from './billing.repository';
import { billingService } from './billing.service';
import type { PlanChoiceInput, VerifyCheckoutInput } from './billing.validators';
import { CURRENCY, IsPurchasable, PeriodEndFrom, PLANS, TotalMinor } from './plans';
import { ParsePayment, ParseSubscription, razorpayClient, type RazorpayPaymentType, type RazorpaySubscriptionType } from './razorpay.client';

/**
 * Paying for a plan through Razorpay, in either mode (env RAZORPAY_BILLING_MODE):
 * - ORDERS: each month or year is a one-time order. Paying early adds the period after the one already paid for.
 * - SUBSCRIPTIONS: Razorpay renews by itself and reports renewals, failures and cancellations by webhook.
 * The price is per inventory, so every charge is the plan's price for the interval × the inventories chosen.
 * Every payment is applied once, by its id, whichever arrives first: the browser's verification or the webhook.
 */

/** Renewals a Razorpay subscription runs for before it completes (Razorpay requires a number): ten years either way. */
const TOTAL_CYCLES: Record<BillingIntervalTypeEnum, number> = { MONTHLY: 120, YEARLY: 10 };

/** The choice a checkout in progress is for. */
const pendingChoice = (s: SubscriptionRow): PlanChoiceInput | null => {
  if (!IsPurchasable(s.pending_plan)) return null;
  return { plan: s.pending_plan, interval: s.pending_interval ?? BillingIntervalTypeEnum.MONTHLY, quantity: s.pending_quantity ?? 1 };
};

/** Paid time already ahead that a new period follows on from: the rest of the trial, or the same plan paid early. */
const startOfNewPeriod = (s: SubscriptionRow, choice: PlanChoiceInput): Date => {
  const now = new Date();
  if (!billingService.HasAccess(s) || !s.current_period_end || s.current_period_end <= now) return now;
  const onTrial = s.provider === BillingProviderTypeEnum.TRIAL;
  const samePlan = s.plan === choice.plan && s.billing_interval === choice.interval && s.quantity === choice.quantity;
  return onTrial || samePlan ? s.current_period_end : now;
};

/** The columns a paid choice sets on the subscription. */
const planColumns = (choice: PlanChoiceInput) => ({
  plan: choice.plan,
  billing_interval: choice.interval,
  quantity: choice.quantity,
  next_plan: null,
  status: SubscriptionStatusTypeEnum.ACTIVE,
  cancel_at_period_end: false,
  ...NO_PENDING,
});

/** Map Razorpay's subscription status to ours; null when it says nothing new (still at checkout). */
const statusFrom = (rz: RazorpaySubscriptionType): SubscriptionStatusTypeEnum | null => {
  switch (rz.status) {
    case 'active':
      return SubscriptionStatusTypeEnum.ACTIVE;
    case 'pending':
      return SubscriptionStatusTypeEnum.PAST_DUE;
    case 'cancelled':
      return SubscriptionStatusTypeEnum.CANCELLED;
    case 'halted':
    case 'completed':
    case 'expired':
    case 'paused':
      return SubscriptionStatusTypeEnum.EXPIRED;
    default:
      return null;
  }
};

const periodEndFrom = (rz: RazorpaySubscriptionType): Date | null => (rz.current_end ? new Date(rz.current_end * 1000) : null);

/** The Razorpay subscription this one replaces, if any: cancelled once the new plan is in place, so nobody pays twice. */
const replacedBy = (s: SubscriptionRow, keep: string | null): string | null =>
  s.provider === BillingProviderTypeEnum.RAZORPAY && s.provider_subscription_id && s.provider_subscription_id !== keep ? s.provider_subscription_id : null;

const currentChoice = (s: SubscriptionRow): PlanChoiceInput => ({
  plan: IsPurchasable(s.plan) ? s.plan : PlanCodeEnum.PRO,
  interval: s.billing_interval,
  quantity: s.quantity,
});

/** The period a subscription charge paid for, as Razorpay reports it (or one period from now). */
const chargedPeriod = (rz: RazorpaySubscriptionType, interval: BillingIntervalTypeEnum) => {
  const start = rz.current_start ? new Date(rz.current_start * 1000) : new Date();
  return { periodStart: start, periodEnd: periodEndFrom(rz) ?? PeriodEndFrom(start, interval) };
};

/**
 * A subscription's first payment went through: it becomes the account's plan, and the payment (when known) gets its
 * invoice. Returns the subscription it replaces.
 */
const activateSubscription = async (
  tx: Queryable,
  s: SubscriptionRow,
  rz: RazorpaySubscriptionType,
  payment: RazorpayPaymentType | null,
): Promise<string | null> => {
  const replaced = replacedBy(s, rz.id);
  const choice = pendingChoice(s) ?? currentChoice(s);
  const period = chargedPeriod(rz, choice.interval);
  await billingRepository.Update(tx, s.id, {
    ...planColumns(choice),
    provider: BillingProviderTypeEnum.RAZORPAY,
    provider_subscription_id: rz.id,
    // Razorpay sets current_end once the first charge goes through; until then, one period from now.
    current_period_end: period.periodEnd,
  });
  if (payment) await billingInvoicesService.Record(tx, s, choice, { provider: BillingProviderTypeEnum.RAZORPAY, payment, subscriptionId: rz.id, ...period });
  return replaced;
};

/** Apply Razorpay's view of an active subscription (a renewal, a failed charge, a cancellation). */
const applySubscription = async (tx: Queryable, s: SubscriptionRow, rz: RazorpaySubscriptionType): Promise<void> => {
  const status = statusFrom(rz);
  if (!status) return;
  await billingRepository.Update(tx, s.id, {
    status,
    current_period_end: periodEndFrom(rz) ?? s.current_period_end,
    cancel_at_period_end: status === SubscriptionStatusTypeEnum.CANCELLED ? true : s.cancel_at_period_end,
  });
};

const cancelReplaced = async (id: string | null) => {
  if (!id) return;
  await razorpayClient.CancelSubscription(id, false).catch((err: unknown) => logger.error(`Could not cancel replaced subscription ${id}`, err));
};

/** The Razorpay plan for one inventory of `choice`, created once and remembered. */
const razorpayPlanId = async (choice: PlanChoiceInput): Promise<string> => {
  const plan = PLANS[choice.plan];
  const key = { plan: plan.code, interval: choice.interval, amount: TotalMinor(plan, choice.interval, 1), currency: CURRENCY };
  const cached = await billingRepository.FindRazorpayPlan(db, key);
  if (cached) return cached;
  const yearly = choice.interval === BillingIntervalTypeEnum.YEARLY;
  const id = await razorpayClient.FindOrCreatePlan({
    name: `StockMotion ${plan.name} (per inventory, ${yearly ? 'yearly' : 'monthly'})`,
    period: yearly ? 'yearly' : 'monthly',
    amount: key.amount,
    currency: CURRENCY,
  });
  await billingRepository.InsertRazorpayPlan(db, key, id);
  return id;
};

/**
 * A captured payment for an order becomes one period (a month or a year) of the plan chosen, for the inventories chosen.
 * It follows on from the rest of a trial, or from the same plan paid early; otherwise it starts now. Returns the
 * subscription it replaces.
 */
const applyOrderPayment = async (tx: Queryable, s: SubscriptionRow, payment: RazorpayPaymentType): Promise<string | null> => {
  if (!(await billingRepository.RecordEvent(tx, `payment:${payment.id}`))) return null;
  const choice = pendingChoice(s);
  if (!choice) throw BadRequest('That payment isn’t for a plan this account chose');
  if (payment.amount !== TotalMinor(PLANS[choice.plan], choice.interval, choice.quantity) || payment.currency !== CURRENCY) {
    throw BadRequest('That payment doesn’t match the plan’s price');
  }
  const periodStart = startOfNewPeriod(s, choice);
  const periodEnd = PeriodEndFrom(periodStart, choice.interval);
  await billingRepository.Update(tx, s.id, {
    ...planColumns(choice),
    provider: BillingProviderTypeEnum.RAZORPAY,
    provider_subscription_id: null,
    current_period_end: periodEnd,
  });
  await billingInvoicesService.Record(tx, s, choice, { provider: BillingProviderTypeEnum.RAZORPAY, payment, orderId: s.pending_order_id, periodStart, periodEnd });
  return replacedBy(s, null);
};

/** Make sure a payment is captured (accounts set to capture by hand leave it authorised). */
const captured = async (payment: RazorpayPaymentType): Promise<RazorpayPaymentType> => {
  if (payment.status === 'authorized') return razorpayClient.CapturePayment(payment.id, payment.amount, payment.currency);
  return payment;
};

/**
 * Start paying for a plan, for a number of inventories, monthly or yearly: a Razorpay order or subscription for Checkout
 * to take payment for, or (manual mode, development) the plan at once.
 */
const Checkout = async (account: AccountResponseType, choice: PlanChoiceInput): Promise<CheckoutResponseType> => {
  const plan = PLANS[choice.plan];
  const amountMinor = TotalMinor(plan, choice.interval, choice.quantity);
  const mode = billingService.CheckoutMode();
  if (mode === CheckoutModeTypeEnum.NONE) throw Unavailable('Payments aren’t set up on this server yet — add the Razorpay keys');
  await billingService.AssertCoversOwned(db, account.id, choice.quantity);
  if (mode === CheckoutModeTypeEnum.MANUAL) {
    await db.transaction(async (tx) => {
      await billingService.Ensure(tx, account.id);
      const s = (await billingRepository.LockByAccount(tx, account.id))!;
      const periodStart = startOfNewPeriod(s, choice);
      const periodEnd = PeriodEndFrom(periodStart, choice.interval);
      await billingRepository.Update(tx, s.id, {
        ...planColumns(choice),
        provider: BillingProviderTypeEnum.MANUAL,
        provider_subscription_id: null,
        current_period_end: periodEnd,
      });
      await billingInvoicesService.Record(tx, s, choice, { provider: BillingProviderTypeEnum.MANUAL, payment: null, periodStart, periodEnd });
    });
    return { provider: BillingProviderTypeEnum.MANUAL, billing: await billingService.Get(account.id) };
  }

  const s = await billingService.Ensure(db, account.id);
  const pending = { pending_plan: choice.plan, pending_interval: choice.interval, pending_quantity: choice.quantity };
  const common = {
    provider: BillingProviderTypeEnum.RAZORPAY,
    keyId: env.RAZORPAY_KEY_ID!,
    planName: `StockMotion ${plan.name}`,
    interval: choice.interval,
    quantity: choice.quantity,
    amountMinor,
    currency: CURRENCY,
    prefill: { name: account.name, email: account.email },
  };
  const notes = { account_id: account.id, plan: choice.plan, interval: choice.interval, quantity: String(choice.quantity) };
  if (env.RAZORPAY_BILLING_MODE === RazorpayModeTypeEnum.ORDERS) {
    const order = await razorpayClient.CreateOrder({ amount: amountMinor, currency: CURRENCY, receipt: `${s.id}-${Date.now().toString(36)}`, notes });
    await billingRepository.Update(db, s.id, { ...pending, pending_order_id: order.id });
    return { ...common, mode: RazorpayModeTypeEnum.ORDERS, orderId: order.id };
  }
  const rz = await razorpayClient.CreateSubscription({
    planId: await razorpayPlanId(choice),
    quantity: choice.quantity,
    totalCount: TOTAL_CYCLES[choice.interval],
    notes,
  });
  await billingRepository.Update(db, s.id, { ...pending, pending_provider_subscription_id: rz.id });
  return { ...common, mode: RazorpayModeTypeEnum.SUBSCRIPTIONS, subscriptionId: rz.id };
};

const NOT_VERIFIED = 'That payment couldn’t be verified — nothing was changed';

/** Checkout finished in the browser: check Razorpay's signature and the payment itself, then apply it. */
const VerifyCheckout = async (account: AccountResponseType, input: VerifyCheckoutInput): Promise<BillingResponseType> => {
  let replaced: string | null;
  if ('orderId' in input) {
    if (!razorpayClient.VerifyOrderSignature(input)) throw BadRequest(NOT_VERIFIED);
    const payment = await captured(await razorpayClient.FetchPayment(input.paymentId));
    if (payment.order_id !== input.orderId || payment.status !== 'captured') throw BadRequest(NOT_VERIFIED);
    replaced = await db.transaction(async (tx) => {
      const s = await billingRepository.LockByAccount(tx, account.id);
      if (!s) throw BadRequest(NOT_VERIFIED);
      // Already applied (by the webhook, or a second click): nothing more to do.
      if (s.pending_order_id !== input.orderId) return null;
      return applyOrderPayment(tx, s, payment);
    });
  } else {
    if (!razorpayClient.VerifyCheckoutSignature(input)) throw BadRequest(NOT_VERIFIED);
    const rz = await razorpayClient.FetchSubscription(input.subscriptionId);
    const payment = await razorpayClient.FetchPayment(input.paymentId);
    replaced = await db.transaction(async (tx) => {
      const s = await billingRepository.LockByAccount(tx, account.id);
      if (!s || (s.pending_provider_subscription_id !== rz.id && s.provider_subscription_id !== rz.id)) throw BadRequest(NOT_VERIFIED);
      return s.provider_subscription_id === rz.id ? null : activateSubscription(tx, s, rz, payment);
    });
  }
  await cancelReplaced(replaced);
  return billingService.Get(account.id);
};

/** Stop renewing. A paid period keeps working until it ends. */
const Cancel = async (account: AccountResponseType): Promise<BillingResponseType> => {
  const s = await billingService.Ensure(db, account.id);
  if (s.provider === BillingProviderTypeEnum.TRIAL) throw BadRequest('There’s nothing to cancel during the free trial');
  if (s.provider === BillingProviderTypeEnum.RAZORPAY && !s.provider_subscription_id) {
    throw BadRequest('This plan doesn’t renew by itself, so there’s nothing to cancel — it simply ends when the paid period does');
  }
  if (s.provider_subscription_id) await razorpayClient.CancelSubscription(s.provider_subscription_id, true);
  await billingRepository.Update(db, s.id, {
    cancel_at_period_end: true,
    ...(s.provider === BillingProviderTypeEnum.MANUAL && { status: SubscriptionStatusTypeEnum.CANCELLED }),
  });
  return billingService.Get(account.id);
};

/**
 * Ask Razorpay for the latest and apply it: a paid order whose browser closed before verifying, a renewal, a failed
 * charge. Local development has no webhooks, so this is how it catches up.
 */
const Sync = async (account: AccountResponseType): Promise<BillingResponseType> => {
  const s = await billingService.Ensure(db, account.id);
  let replaced: string | null = null;
  if (s.pending_order_id) {
    const orderId = s.pending_order_id;
    const paid = (await razorpayClient.FetchOrderPayments(orderId)).find((p) => p.status === 'captured' || p.status === 'authorized');
    if (paid) {
      const payment = await captured(paid);
      replaced = await db.transaction(async (tx) => {
        const locked = await billingRepository.LockByAccount(tx, account.id);
        return locked?.pending_order_id === orderId ? applyOrderPayment(tx, locked, payment) : null;
      });
    }
  }
  for (const id of [s.pending_provider_subscription_id, s.provider_subscription_id].filter((x): x is string => Boolean(x))) {
    const rz = await razorpayClient.FetchSubscription(id);
    replaced =
      (await db.transaction(async (tx) => {
        const locked = await billingRepository.LockByAccount(tx, account.id);
        if (!locked) return null;
        if (locked.pending_provider_subscription_id === rz.id) return rz.status === 'active' ? activateSubscription(tx, locked, rz, null) : null;
        await applySubscription(tx, locked, rz);
        return null;
      })) ?? replaced;
  }
  await cancelReplaced(replaced);
  return billingService.Get(account.id);
};

const WebhookSchema = z.object({
  event: z.string(),
  payload: z.object({
    subscription: z.object({ entity: z.unknown() }).optional(),
    order: z.object({ entity: z.object({ id: z.string() }) }).optional(),
    payment: z.object({ entity: z.unknown() }).optional(),
  }),
});

/**
 * A Razorpay webhook delivery. Its signature is checked against the raw body; each event is applied once (Razorpay
 * retries deliveries). Events for orders and subscriptions this app doesn't know are acknowledged and ignored.
 */
const HandleWebhook = async (rawBody: string, signature: string, eventId: string | undefined): Promise<void> => {
  const secret = env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) throw Unavailable('Webhooks aren’t set up: add RAZORPAY_WEBHOOK_SECRET');
  if (!razorpayClient.VerifyWebhookSignature(rawBody, signature, secret)) throw BadRequest('Invalid webhook signature');
  const { event, payload } = WebhookSchema.parse(JSON.parse(rawBody));

  const replaced = await db.transaction(async (tx) => {
    if (eventId && !(await billingRepository.RecordEvent(tx, eventId))) return null;
    if (event === 'order.paid' && payload.order && payload.payment) {
      const s = await billingRepository.LockByPendingOrderId(tx, payload.order.entity.id);
      return s ? applyOrderPayment(tx, s, ParsePayment(payload.payment.entity)) : null;
    }
    if (event.startsWith('subscription.') && payload.subscription) {
      const rz = ParseSubscription(payload.subscription.entity);
      const s = await billingRepository.LockByProviderSubscriptionId(tx, rz.id);
      if (!s) return null;
      const payment = payload.payment ? ParsePayment(payload.payment.entity) : null;
      if (s.pending_provider_subscription_id === rz.id) return rz.status === 'active' ? activateSubscription(tx, s, rz, payment) : null;
      await applySubscription(tx, s, rz);
      // A renewal charge: its own invoice, for the period it paid for.
      if (event === 'subscription.charged' && payment) {
        const choice = currentChoice(s);
        await billingInvoicesService.Record(tx, s, choice, { provider: BillingProviderTypeEnum.RAZORPAY, payment, subscriptionId: rz.id, ...chargedPeriod(rz, choice.interval) });
      }
    }
    return null;
  });
  await cancelReplaced(replaced);
};

export const billingCheckoutService = { Checkout, VerifyCheckout, Cancel, Sync, HandleWebhook };
