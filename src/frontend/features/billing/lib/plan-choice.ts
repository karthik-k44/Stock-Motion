import { BillingIntervalTypeEnum, PlanCodeEnum, type BillingResponseType, type PlanChoiceType, type PurchasablePlanType } from '../types';

const PLANS: readonly string[] = [PlanCodeEnum.STARTER, PlanCodeEnum.PRO];
const INTERVALS: readonly string[] = Object.values(BillingIntervalTypeEnum);

/** `?plan=PRO&interval=YEARLY&quantity=3`: how the plans page hands its choice to the payment page. */
export const PlanChoiceQuery = (choice: PlanChoiceType): string =>
  new URLSearchParams({ plan: choice.plan, interval: choice.interval, quantity: String(choice.quantity) }).toString();

/** The choice in a URL, or null when anything in it is missing or out of range. */
export const ParsePlanChoice = (params: URLSearchParams, maxInventories: number): PlanChoiceType | null => {
  const plan = params.get('plan') ?? '';
  const interval = params.get('interval') ?? '';
  const quantity = Number(params.get('quantity'));
  if (!PLANS.includes(plan) || !INTERVALS.includes(interval)) return null;
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > maxInventories) return null;
  return { plan: plan as PurchasablePlanType, interval: interval as BillingIntervalTypeEnum, quantity };
};

/** Where the plans page starts: what the owner already has or chose, else Pro, monthly, for the inventories they own. */
export const InitialPlanChoice = (b: BillingResponseType): PlanChoiceType => {
  const chosen = b.nextBill?.plan.code ?? b.plan.code;
  return {
    plan: chosen === PlanCodeEnum.STARTER ? PlanCodeEnum.STARTER : PlanCodeEnum.PRO,
    interval: b.interval,
    quantity: Math.min(b.maxInventories, Math.max(1, b.quantity, b.usage.businesses)),
  };
};

/** After choosing or paying: set up the inventories still to make, else straight into the app. */
export const NextAfterPlan = (b: BillingResponseType, setUp: string, app: string): string =>
  b.usage.businesses < (b.usage.maxBusinesses ?? 1) ? setUp : app;
