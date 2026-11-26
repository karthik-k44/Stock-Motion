import type { BadgeTone } from '@/frontend/components/badge';
import { BillingIntervalTypeEnum, SubscriptionStatusTypeEnum, type BillingResponseType, type PlanResponseType } from '../types';

/** ₹2,097 — an amount in the currency's smallest unit, shown in whole units (paise only when there are some). */
export const FormatMoney = (minor: number, currency: string): string =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency, maximumFractionDigits: minor % 100 === 0 ? 0 : 2 }).format(minor / 100);

/** One inventory's price for an interval; null for a plan that isn't sold through checkout. */
export const PricePerInventory = (plan: PlanResponseType, interval: BillingIntervalTypeEnum): number | null =>
  plan.pricePerInventoryMinor?.[interval] ?? null;

/** What a period costs for `quantity` inventories. */
export const TotalFor = (plan: PlanResponseType, interval: BillingIntervalTypeEnum, quantity: number): number =>
  (PricePerInventory(plan, interval) ?? 0) * quantity;

/** What paying yearly saves over twelve monthly payments, for `quantity` inventories. */
export const YearlySaving = (plan: PlanResponseType, quantity: number): number =>
  Math.max(0, TotalFor(plan, BillingIntervalTypeEnum.MONTHLY, quantity) * 12 - TotalFor(plan, BillingIntervalTypeEnum.YEARLY, quantity));

export const PER: Record<BillingIntervalTypeEnum, string> = { MONTHLY: 'month', YEARLY: 'year' };
export const INTERVAL_LABEL: Record<BillingIntervalTypeEnum, string> = { MONTHLY: 'Monthly', YEARLY: 'Yearly' };

/** "1 inventory", "3 inventories" */
export const Inventories = (n: number): string => `${n} ${n === 1 ? 'inventory' : 'inventories'}`;

const DAY_MS = 24 * 60 * 60 * 1000;

/** Whole days until `iso` (0 on the last day); null when there's no date. */
export const DaysLeft = (iso: string | null): number | null => (iso === null ? null : Math.max(0, Math.ceil((new Date(iso).getTime() - Date.now()) / DAY_MS)));

/** 15 March 2027 */
export const LongDate = (iso: string) => new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' });

/** One line on where the plan stands: when the trial ends, when it renews, or that it has ended. */
export const PlanStanding = (b: BillingResponseType): string => {
  const end = b.currentPeriodEnd;
  if (!b.hasAccess) return end ? `Ended on ${LongDate(end)} — your inventories are read-only until you choose a plan.` : 'Ended — choose a plan to keep going.';
  if (b.status === SubscriptionStatusTypeEnum.TRIALING && end) {
    const days = DaysLeft(end) ?? 0;
    return `Free trial for ${Inventories(b.quantity)} — ${days === 0 ? 'ends today' : `${days} day${days === 1 ? '' : 's'} left`}, until ${LongDate(end)}.`;
  }
  if (b.status === SubscriptionStatusTypeEnum.PAST_DUE) return 'The last payment didn’t go through. Razorpay will try again; update your card if it keeps failing.';
  if (!end) return 'No end date.';
  if (b.cancelAtPeriodEnd) return `Cancelled — works until ${LongDate(end)}, then won’t renew.`;
  return b.autoRenews ? `Renews on ${LongDate(end)}.` : `Paid until ${LongDate(end)}.`;
};

export const STATUS_BADGE: Record<SubscriptionStatusTypeEnum, { label: string; tone: BadgeTone }> = {
  TRIALING: { label: 'Free trial', tone: 'info' },
  ACTIVE: { label: 'Active', tone: 'good' },
  PAST_DUE: { label: 'Payment due', tone: 'warning' },
  CANCELLED: { label: 'Cancelled', tone: 'neutral' },
  EXPIRED: { label: 'Ended', tone: 'critical' },
};

/**
 * How far through its current period the plan is, for the progress bar: the trial, or the paid month or year.
 * Null when the plan has no end date.
 */
export const PeriodProgress = (b: BillingResponseType): { daysLeft: number; totalDays: number } | null => {
  if (!b.currentPeriodEnd || !b.hasAccess) return null;
  const end = new Date(b.currentPeriodEnd);
  const start = new Date(end);
  if (b.status === SubscriptionStatusTypeEnum.TRIALING) start.setDate(start.getDate() - b.trialDays);
  else start.setMonth(start.getMonth() - (b.interval === BillingIntervalTypeEnum.YEARLY ? 12 : 1));
  const totalDays = Math.max(1, Math.round((end.getTime() - start.getTime()) / DAY_MS));
  return { daysLeft: Math.min(totalDays, DaysLeft(b.currentPeriodEnd) ?? 0), totalDays };
};
