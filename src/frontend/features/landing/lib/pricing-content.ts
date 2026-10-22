/**
 * The pricing page's plans. Prices are the owner's decision (Starter $19, Pro $49 a month, USD).
 * The app doesn't bill or enforce plan limits yet: both buttons start sign-up, and the features listed are how
 * the plans are packaged — review them before launch.
 */
export type PlanType = {
  id: 'starter' | 'pro';
  name: string;
  /** USD per month */
  price: number;
  pitch: string;
  features: string[];
  cta: string;
};

export const PLANS: Record<PlanType['id'], PlanType> = {
  starter: {
    id: 'starter',
    name: 'Starter',
    price: 19,
    pitch: 'For one business getting its stock in order.',
    features: ['One business — retail, café or trades', 'Inventory, orders and deliveries', 'The live world of your business', 'CSV import with a row-by-row preview', 'A history of every stock change'],
    cta: 'Start with Starter',
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    price: 49,
    pitch: 'Run every business and every team from one live view.',
    features: ['Everything in Starter', 'Several businesses under one login', 'Your team invited with roles', 'Low stock reordered by supplier in one go', 'Live sync across every screen'],
    cta: 'Go Pro',
  },
};

export const PRICE = (plan: PlanType) => `$${plan.price}/month`;
