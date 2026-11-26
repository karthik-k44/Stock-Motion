export const PlanCodeEnum = {
  TRIAL: 'TRIAL',
  STARTER: 'STARTER',
  PRO: 'PRO',
  SCALE: 'SCALE',
} as const;
export type PlanCodeEnum = (typeof PlanCodeEnum)[keyof typeof PlanCodeEnum];

/** How often a plan is paid for: every month, or once a year (ten months' price — two months free). */
export const BillingIntervalTypeEnum = {
  MONTHLY: 'MONTHLY',
  YEARLY: 'YEARLY',
} as const;
export type BillingIntervalTypeEnum = (typeof BillingIntervalTypeEnum)[keyof typeof BillingIntervalTypeEnum];

export const SubscriptionStatusTypeEnum = {
  TRIALING: 'TRIALING',
  ACTIVE: 'ACTIVE',
  /** A renewal payment failed and Razorpay is retrying: still usable meanwhile */
  PAST_DUE: 'PAST_DUE',
  /** Won't renew; usable until the end of the paid month */
  CANCELLED: 'CANCELLED',
  /** Trial over or payments stopped: read-only */
  EXPIRED: 'EXPIRED',
} as const;
export type SubscriptionStatusTypeEnum = (typeof SubscriptionStatusTypeEnum)[keyof typeof SubscriptionStatusTypeEnum];

/** An invoice is written when a payment goes through; REFUNDED once the money has been returned. */
export const InvoiceStatusTypeEnum = {
  PAID: 'PAID',
  REFUNDED: 'REFUNDED',
} as const;
export type InvoiceStatusTypeEnum = (typeof InvoiceStatusTypeEnum)[keyof typeof InvoiceStatusTypeEnum];

export const BillingProviderTypeEnum = {
  TRIAL: 'TRIAL',
  MANUAL: 'MANUAL',
  RAZORPAY: 'RAZORPAY',
} as const;
export type BillingProviderTypeEnum = (typeof BillingProviderTypeEnum)[keyof typeof BillingProviderTypeEnum];

/** How "Choose plan" pays: Razorpay Checkout, MANUAL (development: activates at once) or NONE (not configured). */
export const CheckoutModeTypeEnum = {
  RAZORPAY: 'RAZORPAY',
  MANUAL: 'MANUAL',
  NONE: 'NONE',
} as const;
export type CheckoutModeTypeEnum = (typeof CheckoutModeTypeEnum)[keyof typeof CheckoutModeTypeEnum];

/**
 * How Razorpay takes payment. SUBSCRIPTIONS renews every month or year by itself (needs Razorpay Subscriptions enabled
 * on the account); ORDERS takes one period's payment at a time, and the owner pays again before it ends.
 */
export const RazorpayModeTypeEnum = {
  SUBSCRIPTIONS: 'SUBSCRIPTIONS',
  ORDERS: 'ORDERS',
} as const;
export type RazorpayModeTypeEnum = (typeof RazorpayModeTypeEnum)[keyof typeof RazorpayModeTypeEnum];

export type PlanLimitsType = { maxMembers: number | null; reorder: boolean };

export type PlanResponseType = {
  code: PlanCodeEnum;
  name: string;
  /** Price of one inventory per month and per year, in paise; null when it isn't sold through checkout */
  pricePerInventoryMinor: Record<BillingIntervalTypeEnum, number> | null;
  currency: string;
  limits: PlanLimitsType;
};

/** What the owner will be charged next, and when: after the trial, or at the next renewal. */
export type NextBillType = { plan: PlanResponseType; interval: BillingIntervalTypeEnum; quantity: number; amountMinor: number; currency: string; date: string | null };

/** The signed-in account's plan, as the Billing page shows it. */
export type BillingResponseType = {
  plan: PlanResponseType;
  status: SubscriptionStatusTypeEnum;
  provider: BillingProviderTypeEnum;
  interval: BillingIntervalTypeEnum;
  /** Inventories paid for (or covered by the trial) */
  quantity: number;
  /** When the trial or the paid period ends; null when it doesn't */
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  /** True when the plan renews by itself (a Razorpay subscription); false when each period is paid for separately */
  autoRenews: boolean;
  /** False once the trial or plan has ended: the account's businesses are read-only */
  hasAccess: boolean;
  /** Inventories this account owns, and how many it may own (null: no limit) */
  usage: { businesses: number; maxBusinesses: number | null };
  /** During the trial: whether the owner has chosen what to pay for afterwards */
  planChosen: boolean;
  nextBill: NextBillType | null;
  checkout: CheckoutModeTypeEnum;
  /** No real money moves: Razorpay test keys, or development without keys */
  testMode: boolean;
  /** With Razorpay: ORDERS (each period paid for separately) or SUBSCRIPTIONS (renews by itself) */
  razorpayMode: RazorpayModeTypeEnum;
  plans: PlanResponseType[];
  trialDays: number;
  /** Most inventories one checkout can buy */
  maxInventories: number;
};

/** A payment that went through, as an invoice: what was bought, for which period, who paid and how. */
export type InvoiceResponseType = {
  /** Also the invoice number, e.g. IVID100000 */
  id: string;
  status: InvoiceStatusTypeEnum;
  plan: { code: PlanCodeEnum; name: string };
  interval: BillingIntervalTypeEnum;
  quantity: number;
  unitAmountMinor: number;
  amountMinor: number;
  currency: string;
  provider: BillingProviderTypeEnum;
  /** Razorpay's payment id (pay_…); null for a plan switched on without a payment (development) */
  paymentId: string | null;
  orderId: string | null;
  subscriptionId: string | null;
  /** upi, card, netbanking, wallet …; null when unknown */
  paymentMethod: string | null;
  billedTo: { name: string; email: string; contact: string | null };
  periodStart: string;
  periodEnd: string;
  paidAt: string;
};

/** Everything the browser needs to open Razorpay Checkout: for a subscription, or for one period's order. */
export type RazorpayCheckoutResponseType = {
  provider: typeof BillingProviderTypeEnum.RAZORPAY;
  keyId: string;
  planName: string;
  interval: BillingIntervalTypeEnum;
  quantity: number;
  amountMinor: number;
  currency: string;
  prefill: { name: string; email: string };
} & (
  | { mode: typeof RazorpayModeTypeEnum.SUBSCRIPTIONS; subscriptionId: string }
  | { mode: typeof RazorpayModeTypeEnum.ORDERS; orderId: string }
);

export type CheckoutResponseType = RazorpayCheckoutResponseType | { provider: typeof BillingProviderTypeEnum.MANUAL; billing: BillingResponseType };

/** Whether the current business can be changed, decided by its owner's plan. */
export type BusinessAccessType = { writable: boolean; planName: string; ownerIsYou: boolean };
