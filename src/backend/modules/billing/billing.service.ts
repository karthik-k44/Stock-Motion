import { BadRequest, PlanLimit, SubscriptionRequired } from '@/backend/common/errors';
import { DaysFromNow, ToIsoOrNull } from '@/backend/common/utils/dates';
import { env, isProduction } from '@/backend/config/env';
import { db, type Queryable } from '@/backend/db/client';
import type { SubscriptionRow } from '@/backend/db/schema';
import {
  BillingProviderTypeEnum,
  CheckoutModeTypeEnum,
  SubscriptionStatusTypeEnum,
  type BillingResponseType,
  type BusinessAccessType,
  type NextBillType,
  type PlanCodeEnum,
  type PlanResponseType,
} from '@/backend/types/billing';
import { billingRepository } from './billing.repository';
import type { PlanChoiceInput } from './billing.validators';
import { CURRENCY, IsPurchasable, MAX_INVENTORIES, PLANS, PURCHASABLE, TotalMinor, TRIAL_DAYS, type PlanType } from './plans';
import { IsRazorpayConfigured } from './razorpay.client';

/** Statuses that keep an account's businesses usable while the period lasts. PAST_DUE: Razorpay is retrying a charge. */
const USABLE = new Set<SubscriptionStatusTypeEnum>([
  SubscriptionStatusTypeEnum.TRIALING,
  SubscriptionStatusTypeEnum.ACTIVE,
  SubscriptionStatusTypeEnum.CANCELLED,
]);

const HasAccess = (s: SubscriptionRow): boolean => {
  if (s.status === SubscriptionStatusTypeEnum.PAST_DUE) return true;
  return USABLE.has(s.status) && (s.current_period_end === null || s.current_period_end.getTime() > Date.now());
};

const PlanOf = (s: SubscriptionRow): PlanType => PLANS[s.plan];

/** True when Razorpay renews the plan by itself; a plan paid period by period (or by hand) doesn't. */
const AutoRenews = (s: SubscriptionRow): boolean => s.provider === BillingProviderTypeEnum.RAZORPAY && s.provider_subscription_id !== null;

/** Inventories the account may own: as many as it pays for (or the trial covers); Scale has no limit. */
const MaxBusinesses = (s: SubscriptionRow): number => (PlanOf(s).unlimitedInventories ? Infinity : s.quantity);

const finite = (n: number) => (Number.isFinite(n) ? n : null);

const toPlan = (p: PlanType): PlanResponseType => ({
  code: p.code,
  name: p.name,
  pricePerInventoryMinor: p.pricePerInventoryMinor,
  currency: CURRENCY,
  limits: { maxMembers: finite(p.maxMembers), reorder: p.reorder },
});

/**
 * The next charge: once the trial ends, the plan chosen for afterwards, for the inventories the trial covers; on a paid
 * plan, the same again when the period ends. None when nothing is due (nothing chosen yet, cancelled, granted by hand).
 */
const nextBill = (s: SubscriptionRow): NextBillType | null => {
  const code = s.provider === BillingProviderTypeEnum.TRIAL ? s.next_plan : s.plan;
  if (!IsPurchasable(code) || s.cancel_at_period_end || s.provider === BillingProviderTypeEnum.MANUAL) return null;
  const plan = PLANS[code];
  return {
    plan: toPlan(plan),
    interval: s.billing_interval,
    quantity: s.quantity,
    amountMinor: TotalMinor(plan, s.billing_interval, s.quantity),
    currency: CURRENCY,
    date: ToIsoOrNull(s.current_period_end),
  };
};

/** How "Choose plan" pays here: Razorpay when keys are set; outside production without keys, it just activates. */
const CheckoutMode = (): CheckoutModeTypeEnum => {
  if (IsRazorpayConfigured()) return CheckoutModeTypeEnum.RAZORPAY;
  return isProduction ? CheckoutModeTypeEnum.NONE : CheckoutModeTypeEnum.MANUAL;
};

/** An account's subscription, starting its trial the first time it's needed (new and existing accounts alike). */
const Ensure = async (q: Queryable, accountId: string): Promise<SubscriptionRow> => {
  await billingRepository.InsertTrialIfMissing(q, accountId, DaysFromNow(TRIAL_DAYS));
  return (await billingRepository.FindByAccount(q, accountId))!;
};

/** A paid plan past its end reads as ended (a trial keeps saying trial, so the page can say "your trial ended"). */
const shownStatus = (s: SubscriptionRow): SubscriptionStatusTypeEnum =>
  HasAccess(s) || s.status === SubscriptionStatusTypeEnum.TRIALING ? s.status : SubscriptionStatusTypeEnum.EXPIRED;

const toBilling = (s: SubscriptionRow, businesses: number): BillingResponseType => ({
  plan: toPlan(PlanOf(s)),
  status: shownStatus(s),
  provider: s.provider,
  interval: s.billing_interval,
  quantity: s.quantity,
  currentPeriodEnd: ToIsoOrNull(s.current_period_end),
  cancelAtPeriodEnd: s.cancel_at_period_end,
  autoRenews: AutoRenews(s),
  hasAccess: HasAccess(s),
  usage: { businesses, maxBusinesses: finite(MaxBusinesses(s)) },
  planChosen: s.provider !== BillingProviderTypeEnum.TRIAL || s.next_plan !== null,
  nextBill: nextBill(s),
  checkout: CheckoutMode(),
  testMode: CheckoutMode() === CheckoutModeTypeEnum.MANUAL || Boolean(env.RAZORPAY_KEY_ID?.startsWith('rzp_test_')),
  razorpayMode: env.RAZORPAY_BILLING_MODE,
  plans: PURCHASABLE.map((code) => toPlan(PLANS[code])),
  trialDays: TRIAL_DAYS,
  maxInventories: MAX_INVENTORIES,
});

const Get = async (accountId: string): Promise<BillingResponseType> => {
  const s = await Ensure(db, accountId);
  return toBilling(s, await billingRepository.CountBusinessesCreatedBy(db, accountId));
};

const ENDED = 'Your plan has ended — choose one under Billing to keep making changes. Nothing has been deleted.';

const inventories = (n: number) => (n === 1 ? 'one inventory' : `${n} inventories`);

/** Creating `adding` businesses: the account's plan must be active and cover that many more. */
const AssertCanCreateBusiness = async (tx: Queryable, accountId: string, adding = 1): Promise<void> => {
  const s = await Ensure(tx, accountId);
  if (!HasAccess(s)) throw SubscriptionRequired(ENDED);
  const max = MaxBusinesses(s);
  const count = await billingRepository.CountBusinessesCreatedBy(tx, accountId);
  if (count + adding > max) {
    const covered = s.provider === BillingProviderTypeEnum.TRIAL ? 'Your free trial covers' : 'Your plan covers';
    throw PlanLimit(`${covered} ${inventories(max)} and you have ${count} — add more under Billing`);
  }
};

/** A plan must cover the inventories the account already has. */
const AssertCoversOwned = async (q: Queryable, accountId: string, quantity: number): Promise<void> => {
  const owned = await billingRepository.CountBusinessesCreatedBy(q, accountId);
  if (quantity < owned) throw BadRequest(`You already have ${inventories(owned)} — choose at least ${owned}`);
};

/**
 * During the free trial: what to pay for once it ends. The trial covers that many inventories, and the next bill shows
 * their price.
 */
const ChooseTrialPlan = async (accountId: string, choice: PlanChoiceInput): Promise<BillingResponseType> => {
  await db.transaction(async (tx) => {
    await Ensure(tx, accountId);
    const s = (await billingRepository.LockByAccount(tx, accountId))!;
    if (s.provider !== BillingProviderTypeEnum.TRIAL) throw BadRequest('Your free trial has already been used — choose a plan to pay for instead');
    await AssertCoversOwned(tx, accountId, choice.quantity);
    await billingRepository.Update(tx, s.id, { next_plan: choice.plan, billing_interval: choice.interval, quantity: choice.quantity });
  });
  return Get(accountId);
};

/** The plan a business runs on: its creator's. A business without one (its creator's account is gone) isn't limited. */
const businessPlan = async (q: Queryable, businessId: string): Promise<{ subscription: SubscriptionRow | null; ownerId: string | null }> => {
  const found = await billingRepository.FindForBusiness(q, businessId);
  if (!found?.owner_id) return { subscription: null, ownerId: null };
  return { subscription: found.subscription ?? (await Ensure(q, found.owner_id)), ownerId: found.owner_id };
};

/** Changes to a business need its owner's plan to be active; reading never does. */
const AssertWritable = async (q: Queryable, businessId: string): Promise<void> => {
  const { subscription } = await businessPlan(q, businessId);
  if (subscription && !HasAccess(subscription)) {
    throw SubscriptionRequired('This business is read-only: its owner’s plan has ended. The owner can choose one under Billing.');
  }
};

/** Adding someone to a business (an invite, or accepting one): `current` people are on it or invited already. */
const AssertRoomForMember = async (q: Queryable, businessId: string, current: number): Promise<void> => {
  const { subscription } = await businessPlan(q, businessId);
  if (!subscription) return;
  const plan = PlanOf(subscription);
  if (current >= plan.maxMembers) {
    throw PlanLimit(
      plan.maxMembers === 1
        ? `${plan.name} is for one person — upgrade to Pro under Billing to invite your team`
        : `${plan.name} includes up to ${plan.maxMembers} people per business — upgrade under Billing for more`,
    );
  }
};

const AssertReorder = async (q: Queryable, businessId: string): Promise<void> => {
  const { subscription } = await businessPlan(q, businessId);
  if (subscription && !PlanOf(subscription).reorder) throw PlanLimit('Reordering low stock in one go is part of Pro — upgrade under Billing');
};

/** Whether the current business can be changed, for the app's banner. */
const BusinessAccess = async (q: Queryable, businessId: string, accountId: string): Promise<BusinessAccessType> => {
  const { subscription, ownerId } = await businessPlan(q, businessId);
  return {
    writable: !subscription || HasAccess(subscription),
    planName: subscription ? PlanOf(subscription).name : PLANS.SCALE.name,
    ownerIsYou: ownerId === accountId,
  };
};

/** Give an account a plan by hand (Scale, agreed in person). `months` null: no end date. */
const Grant = async (accountId: string, code: PlanCodeEnum, months: number | null, q: Queryable = db): Promise<void> => {
  await billingRepository.Assign(q, accountId, {
    plan: code,
    status: SubscriptionStatusTypeEnum.ACTIVE,
    provider: BillingProviderTypeEnum.MANUAL,
    current_period_end: months === null ? null : new Date(new Date().setMonth(new Date().getMonth() + months)),
  });
};

export const billingService = {
  HasAccess,
  PlanOf,
  AutoRenews,
  CheckoutMode,
  MaxBusinesses,
  Ensure,
  Get,
  ChooseTrialPlan,
  AssertCanCreateBusiness,
  AssertCoversOwned,
  AssertWritable,
  AssertRoomForMember,
  AssertReorder,
  BusinessAccess,
  Grant,
};
