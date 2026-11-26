import { createHmac, timingSafeEqual } from 'node:crypto';
import { z } from 'zod';
import { PaymentProviderError } from '@/backend/common/errors';
import { env } from '@/backend/config/env';
import { logger } from '@/backend/config/logger';

/** Razorpay's REST API (https://razorpay.com/docs/api). Amounts are in the currency's smallest unit: cents for USD. */
const API = 'https://api.razorpay.com/v1';
const TIMEOUT_MS = 15_000;

export const IsRazorpayConfigured = (): boolean => Boolean(env.RAZORPAY_KEY_ID && env.RAZORPAY_KEY_SECRET);

const PlanSchema = z.object({
  id: z.string(),
  period: z.string(),
  interval: z.number(),
  item: z.object({ name: z.string(), amount: z.number(), currency: z.string() }),
});

const SubscriptionSchema = z.object({
  id: z.string(),
  plan_id: z.string(),
  /** created → authenticated → active; pending (retrying a failed charge) → halted; cancelled; completed; expired; paused */
  status: z.string(),
  current_start: z.number().nullable().optional(),
  current_end: z.number().nullable().optional(),
  charge_at: z.number().nullable().optional(),
});

export type RazorpaySubscriptionType = z.infer<typeof SubscriptionSchema>;

/** A subscription entity from a webhook payload. */
export const ParseSubscription = (entity: unknown): RazorpaySubscriptionType => SubscriptionSchema.parse(entity);

const call = async <T>(schema: z.ZodType<T>, method: 'GET' | 'POST', path: string, body?: object): Promise<T> => {
  const credentials = Buffer.from(`${env.RAZORPAY_KEY_ID}:${env.RAZORPAY_KEY_SECRET}`).toString('base64');
  let res: Response;
  try {
    res = await fetch(`${API}${path}`, {
      method,
      headers: { authorization: `Basic ${credentials}`, 'content-type': 'application/json' },
      body: body && JSON.stringify(body),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (err) {
    logger.warn(`Razorpay ${method} ${path} failed`, err);
    throw PaymentProviderError('Couldn’t reach Razorpay — please try again in a moment');
  }
  const json: unknown = await res.json().catch(() => null);
  if (!res.ok) {
    logger.warn(`Razorpay ${method} ${path} answered ${res.status}`, json);
    // A bare {"error":"Unauthorized"} with valid keys: the account doesn't have the Subscriptions product.
    if (res.status === 401 && /^\/(plans|subscriptions)\b/.test(path)) {
      throw PaymentProviderError('Razorpay refused: Subscriptions isn’t enabled on this Razorpay account yet (Dashboard → Subscriptions)');
    }
    const description = (json as { error?: { description?: string } } | null)?.error?.description;
    throw PaymentProviderError(description ? `Razorpay: ${description}` : `Razorpay answered ${res.status}`);
  }
  return schema.parse(json);
};

export type RazorpayPeriodType = 'monthly' | 'yearly';

/**
 * The Razorpay plan for a price: one already in the account (made here before, or in the Dashboard) with the same
 * period, amount and currency, otherwise a new one. The amount is one inventory's; a subscription's quantity multiplies it.
 */
const FindOrCreatePlan = async (input: { name: string; period: RazorpayPeriodType; amount: number; currency: string }): Promise<string> => {
  const existing = await call(z.object({ items: z.array(PlanSchema) }), 'GET', '/plans?count=100');
  const match = existing.items.find(
    (p) => p.period === input.period && p.interval === 1 && p.item.amount === input.amount && p.item.currency === input.currency,
  );
  if (match) return match.id;
  const created = await call(PlanSchema, 'POST', '/plans', {
    period: input.period,
    interval: 1,
    item: { name: input.name, amount: input.amount, currency: input.currency },
  });
  return created.id;
};

/** `totalCount`: how many renewals before it ends by itself. */
const CreateSubscription = (input: { planId: string; quantity: number; totalCount: number; notes: Record<string, string> }): Promise<RazorpaySubscriptionType> => {
  return call(SubscriptionSchema, 'POST', '/subscriptions', {
    plan_id: input.planId,
    quantity: input.quantity,
    total_count: input.totalCount,
    customer_notify: 1,
    notes: input.notes,
  });
};

const FetchSubscription = (id: string): Promise<RazorpaySubscriptionType> => {
  return call(SubscriptionSchema, 'GET', `/subscriptions/${encodeURIComponent(id)}`);
};

/** `atCycleEnd`: keeps working until the paid period ends; otherwise stops now. */
const CancelSubscription = (id: string, atCycleEnd: boolean): Promise<RazorpaySubscriptionType> => {
  return call(SubscriptionSchema, 'POST', `/subscriptions/${encodeURIComponent(id)}/cancel`, { cancel_at_cycle_end: atCycleEnd ? 1 : 0 });
};

const OrderSchema = z.object({
  id: z.string(),
  amount: z.number(),
  currency: z.string(),
  /** created → attempted → paid */
  status: z.string(),
  notes: z.union([z.record(z.string()), z.array(z.unknown())]).optional(),
});

const PaymentSchema = z.object({
  id: z.string(),
  order_id: z.string().nullable().optional(),
  amount: z.number(),
  currency: z.string(),
  /** created → authorized → captured; failed; refunded */
  status: z.string(),
  /** upi, card, netbanking, wallet, emi … */
  method: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
  contact: z.string().nullable().optional(),
});

export type RazorpayOrderType = z.infer<typeof OrderSchema>;
export type RazorpayPaymentType = z.infer<typeof PaymentSchema>;

/** A one-time order for `amount` (smallest unit). `receipt` is ours, up to 40 characters. */
const CreateOrder = (input: { amount: number; currency: string; receipt: string; notes: Record<string, string> }): Promise<RazorpayOrderType> => {
  return call(OrderSchema, 'POST', '/orders', input);
};

const FetchOrder = (id: string): Promise<RazorpayOrderType> => call(OrderSchema, 'GET', `/orders/${encodeURIComponent(id)}`);

const FetchPayment = (id: string): Promise<RazorpayPaymentType> => call(PaymentSchema, 'GET', `/payments/${encodeURIComponent(id)}`);

/** Every payment attempt on an order (failed ones included). */
const FetchOrderPayments = async (orderId: string): Promise<RazorpayPaymentType[]> => {
  return (await call(z.object({ items: z.array(PaymentSchema) }), 'GET', `/orders/${encodeURIComponent(orderId)}/payments`)).items;
};

/** Accounts set to capture payments by hand leave them `authorized`; this takes the money. */
const CapturePayment = (id: string, amount: number, currency: string): Promise<RazorpayPaymentType> => {
  return call(PaymentSchema, 'POST', `/payments/${encodeURIComponent(id)}/capture`, { amount, currency });
};

/** A payment entity from a webhook payload. */
export const ParsePayment = (entity: unknown): RazorpayPaymentType => PaymentSchema.parse(entity);

/** Constant-time comparison of a hex HMAC-SHA256 with the signature Razorpay sent. */
const signatureMatches = (payload: string, signature: string, secret: string): boolean => {
  const expected = Buffer.from(createHmac('sha256', secret).update(payload).digest('hex'));
  const given = Buffer.from(signature);
  return expected.length === given.length && timingSafeEqual(expected, given);
};

/** Checkout's proof of payment for a subscription: HMAC of "payment_id|subscription_id" with the key secret. */
const VerifyCheckoutSignature = (input: { paymentId: string; subscriptionId: string; signature: string }): boolean => {
  return signatureMatches(`${input.paymentId}|${input.subscriptionId}`, input.signature, env.RAZORPAY_KEY_SECRET ?? '');
};

/** Checkout's proof of payment for an order: HMAC of "order_id|payment_id" (the other way round from subscriptions). */
const VerifyOrderSignature = (input: { orderId: string; paymentId: string; signature: string }): boolean => {
  return signatureMatches(`${input.orderId}|${input.paymentId}`, input.signature, env.RAZORPAY_KEY_SECRET ?? '');
};

/** A webhook delivery's X-Razorpay-Signature: HMAC of the raw request body with the webhook secret. */
const VerifyWebhookSignature = (rawBody: string, signature: string, secret: string): boolean => {
  return signatureMatches(rawBody, signature, secret);
};

export const razorpayClient = {
  FindOrCreatePlan,
  CreateSubscription,
  FetchSubscription,
  CancelSubscription,
  CreateOrder,
  FetchOrder,
  FetchPayment,
  FetchOrderPayments,
  CapturePayment,
  VerifyCheckoutSignature,
  VerifyOrderSignature,
  VerifyWebhookSignature,
};
