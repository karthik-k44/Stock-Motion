import { Boxes, Building2, Package, Store, Users, Warehouse, Waypoints, type LucideIcon } from 'lucide-react';

/**
 * The pricing page's plans. Prices are per inventory (each business an owner runs): Starter ₹299 and Pro ₹699 a
 * month, or ten months' price for a year — the same the backend charges (backend modules/billing/plans.ts). Scale is
 * agreed in person. The paid plans start sign-up, which leads to choosing a plan; Scale opens an email.
 */
export type PlanType = {
  id: 'starter' | 'pro' | 'scale';
  name: string;
  /** Rupees per inventory per month (the backend charges the same through Razorpay); null when it is agreed in person */
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
    price: 299,
    pitch: 'For owners running their stock on their own.',
    icon: Package,
    highlights: [
      { icon: Store, lead: 'Per inventory', rest: '— add as many as you run' },
      { icon: Waypoints, lead: 'The live world', rest: 'of your business' },
    ],
    builds: 'Includes',
    features: [{ text: 'Inventory, orders and deliveries' }, { text: 'CSV import with a row-by-row preview' }, { text: 'A history of every stock change' }],
    cta: 'Start with Starter',
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    price: 699,
    pitch: 'Run every business and every team from one live view.',
    icon: Boxes,
    highlights: [
      { icon: Building2, lead: 'Every inventory', rest: 'under one login' },
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

/** The pricing page's calculator: how often to pay, and for how many inventories. */
export type PricingIntervalType = 'MONTHLY' | 'YEARLY';
/** A year costs this many months (two free), as the backend charges. */
export const MONTHS_PAID_PER_YEAR = 10;
/** The most inventories the calculator (and checkout) goes up to; more is a Scale conversation. */
export const MAX_PRICED_INVENTORIES = 50;

/** Rupees for one inventory for the interval; null when the plan is agreed in person. */
export const PricePerInventory = (plan: PlanType, interval: PricingIntervalType): number | null =>
  plan.price === null ? null : interval === 'YEARLY' ? plan.price * MONTHS_PAID_PER_YEAR : plan.price;

export const Rupees = (amount: number): string =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
