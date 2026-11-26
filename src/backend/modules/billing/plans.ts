import { BillingIntervalTypeEnum, PlanCodeEnum } from '@/backend/types/billing';

/**
 * What each plan costs and allows. The price is per inventory (business): Starter ₹299 and Pro ₹699 a month, or ten
 * months' price for a year (two months free), as on the pricing page (frontend features/landing/lib/pricing-content.ts).
 * An account can own as many inventories as it pays for. The free trial lasts 14 days with Pro's features, for as many
 * inventories as the owner chose. Scale is agreed in person and granted by hand (`npm run billing:grant`), with no
 * inventory limit.
 */
export type PlanType = {
  code: PlanCodeEnum;
  name: string;
  /** Price of one inventory for each interval, in the currency's smallest unit (paise); null when it isn't sold through checkout */
  pricePerInventoryMinor: Record<BillingIntervalTypeEnum, number> | null;
  /** People in one inventory, the owner included */
  maxMembers: number;
  /** "Reorder low stock": one delivery per supplier in one go */
  reorder: boolean;
  /** No limit on inventories, whatever the quantity */
  unlimitedInventories: boolean;
};

/** Razorpay charges this account in rupees (international payments aren't enabled on it). */
export const CURRENCY = 'INR';
export const TRIAL_DAYS = 14;
/** Most inventories one account can pay for at checkout; more is a Scale conversation. */
export const MAX_INVENTORIES = 50;
/** A year costs this many months. */
const MONTHS_PAID_PER_YEAR = 10;

const priced = (monthly: number) => ({
  [BillingIntervalTypeEnum.MONTHLY]: monthly,
  [BillingIntervalTypeEnum.YEARLY]: monthly * MONTHS_PAID_PER_YEAR,
});

export const PLANS: Record<PlanCodeEnum, PlanType> = {
  TRIAL: { code: PlanCodeEnum.TRIAL, name: 'Free trial', pricePerInventoryMinor: null, maxMembers: 10, reorder: true, unlimitedInventories: false },
  STARTER: { code: PlanCodeEnum.STARTER, name: 'Starter', pricePerInventoryMinor: priced(29_900), maxMembers: 1, reorder: false, unlimitedInventories: false },
  PRO: { code: PlanCodeEnum.PRO, name: 'Pro', pricePerInventoryMinor: priced(69_900), maxMembers: 10, reorder: true, unlimitedInventories: false },
  SCALE: { code: PlanCodeEnum.SCALE, name: 'Scale', pricePerInventoryMinor: null, maxMembers: Infinity, reorder: true, unlimitedInventories: true },
};

/** The plans someone can buy at checkout. */
export const PURCHASABLE = [PlanCodeEnum.STARTER, PlanCodeEnum.PRO] as const;
export type PurchasablePlanType = (typeof PURCHASABLE)[number];

export const IsPurchasable = (code: PlanCodeEnum | null): code is PurchasablePlanType =>
  code !== null && (PURCHASABLE as readonly PlanCodeEnum[]).includes(code);

/** What one period of `plan` costs for `quantity` inventories. */
export const TotalMinor = (plan: PlanType, interval: BillingIntervalTypeEnum, quantity: number): number =>
  (plan.pricePerInventoryMinor?.[interval] ?? 0) * quantity;

/** When a period that starts at `from` ends. */
export const PeriodEndFrom = (from: Date, interval: BillingIntervalTypeEnum): Date => {
  const d = new Date(from);
  d.setMonth(d.getMonth() + (interval === BillingIntervalTypeEnum.YEARLY ? 12 : 1));
  return d;
};
