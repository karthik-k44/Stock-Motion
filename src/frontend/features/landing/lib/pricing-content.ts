import { Boxes, Building2, Package, Store, Users, Warehouse, Waypoints, type LucideIcon } from 'lucide-react';

/**
 * The pricing page's plans. Prices are the owner's decision (Starter $19, Pro $49 a month, USD; Scale is agreed in
 * person). The app doesn't bill or enforce plan limits yet: the paid plans start sign-up, Scale opens an email, and
 * the features listed are how the plans are packaged — review them before launch.
 */
export type PlanType = {
  id: 'starter' | 'pro' | 'scale';
  name: string;
  /** USD per month; null when it is agreed in person */
  price: number | null;
  pitch: string;
  icon: LucideIcon;
  /** The two lines under the button: `lead` is set bold, `rest` follows it. */
  highlights: { icon: LucideIcon; lead: string; rest: string }[];
  /** The label on the divider above `features` */
  builds: string;
  features: { text: string; tag?: string }[];
  cta: string;
};

export const PLANS: Record<PlanType['id'], PlanType> = {
  starter: {
    id: 'starter',
    name: 'Starter',
    price: 19,
    pitch: 'For one business getting its stock in order.',
    icon: Package,
    highlights: [
      { icon: Store, lead: '1', rest: 'business' },
      { icon: Waypoints, lead: 'The live world', rest: 'of your business' },
    ],
    builds: 'Includes',
    features: [{ text: 'Inventory, orders and deliveries' }, { text: 'CSV import with a row-by-row preview' }, { text: 'A history of every stock change' }],
    cta: 'Start with Starter',
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    price: 49,
    pitch: 'Run every business and every team from one live view.',
    icon: Boxes,
    highlights: [
      { icon: Building2, lead: 'Several', rest: 'businesses under one login' },
      { icon: Users, lead: 'Your team', rest: 'invited with roles' },
    ],
    builds: 'Starter +',
    features: [{ text: 'Low stock reordered by supplier', tag: 'In one go' }, { text: 'Live sync across every screen' }],
    cta: 'Go Pro',
  },
  scale: {
    id: 'scale',
    name: 'Scale',
    price: null,
    pitch: 'For groups that want help moving across and a person to call.',
    icon: Warehouse,
    highlights: [
      { icon: Building2, lead: 'Unlimited', rest: 'businesses' },
      { icon: Users, lead: 'Unlimited', rest: 'team members' },
    ],
    builds: 'Starter & Pro +',
    features: [{ text: 'Help moving your stock across' }, { text: 'A set-up session with your team' }, { text: 'A named person to call' }],
    cta: 'Contact us',
  },
};

export const PRICE = (plan: PlanType) => (plan.price === null ? 'Contact us' : `$${plan.price}/month`);
