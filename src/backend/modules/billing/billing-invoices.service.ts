import { NotFound } from '@/backend/common/errors';
import { ToIso } from '@/backend/common/utils/dates';
import { db, type Queryable } from '@/backend/db/client';
import type { InvoiceRow, SubscriptionRow } from '@/backend/db/schema';
import { authRepository } from '@/backend/modules/auth/auth.repository';
import type { BillingProviderTypeEnum, InvoiceResponseType } from '@/backend/types/billing';
import { billingRepository } from './billing.repository';
import type { PlanChoiceInput } from './billing.validators';
import { CURRENCY, PLANS, TotalMinor } from './plans';
import type { RazorpayPaymentType } from './razorpay.client';

export type InvoiceSourceType = {
  provider: BillingProviderTypeEnum;
  /** The Razorpay payment; null when a plan was switched on without one (development) */
  payment: RazorpayPaymentType | null;
  periodStart: Date;
  periodEnd: Date;
  orderId?: string | null;
  subscriptionId?: string | null;
};

/** Write the invoice for a payment that went through, inside the transaction that applied it. Idempotent per payment. */
const Record = async (tx: Queryable, s: SubscriptionRow, choice: PlanChoiceInput, source: InvoiceSourceType): Promise<void> => {
  const account = await authRepository.FindAccountById(tx, s.account_id);
  if (!account) return;
  const plan = PLANS[choice.plan];
  const { payment } = source;
  await billingRepository.InsertInvoice(tx, {
    account_id: s.account_id,
    plan: choice.plan,
    billing_interval: choice.interval,
    quantity: choice.quantity,
    unit_amount: TotalMinor(plan, choice.interval, 1),
    amount: payment?.amount ?? TotalMinor(plan, choice.interval, choice.quantity),
    currency: payment?.currency ?? CURRENCY,
    provider: source.provider,
    provider_payment_id: payment?.id ?? null,
    provider_order_id: source.orderId ?? payment?.order_id ?? null,
    provider_subscription_id: source.subscriptionId ?? null,
    payment_method: payment?.method ?? null,
    billed_name: account.name,
    billed_email: payment?.email || account.email,
    billed_contact: payment?.contact || null,
    period_start: source.periodStart,
    period_end: source.periodEnd,
  });
};

const toInvoice = (r: InvoiceRow): InvoiceResponseType => ({
  id: r.id,
  status: r.status,
  plan: { code: r.plan, name: PLANS[r.plan].name },
  interval: r.billing_interval,
  quantity: r.quantity,
  unitAmountMinor: r.unit_amount,
  amountMinor: r.amount,
  currency: r.currency,
  provider: r.provider,
  paymentId: r.provider_payment_id,
  orderId: r.provider_order_id,
  subscriptionId: r.provider_subscription_id,
  paymentMethod: r.payment_method,
  billedTo: { name: r.billed_name, email: r.billed_email, contact: r.billed_contact },
  periodStart: ToIso(r.period_start),
  periodEnd: ToIso(r.period_end),
  paidAt: ToIso(r.paid_at),
});

const List = async (accountId: string): Promise<InvoiceResponseType[]> => (await billingRepository.ListInvoices(db, accountId)).map(toInvoice);

const Get = async (accountId: string, id: string): Promise<InvoiceResponseType> => {
  const row = await billingRepository.FindInvoice(db, accountId, id);
  if (!row) throw NotFound('Invoice', id);
  return toInvoice(row);
};

export const billingInvoicesService = { Record, List, Get };
