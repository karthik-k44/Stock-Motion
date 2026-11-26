import { Bell, ClipboardList, Package, PackageCheck, Truck, TriangleAlert, Warehouse, type LucideIcon } from 'lucide-react';

/** What each marketing page's hero shows beside its headline. */
export type HeroObjectType = { src: string; pills: { text: string; left: string; top: string }[]; caption: string };
export type HeroArtType = { image: string; object: HeroObjectType; tagline: string; taglineAccent: string[] };

/** The live card's sample activity, cycling in the hero. Each one lights up the tile for the part of the app it belongs to. */
export type LiveEventType = { icon: LucideIcon; title: string; detail: string };
export type LiveAreaType = { icon: LucideIcon; label: string };

export const LIVE_EVENTS: LiveEventType[] = [
  { icon: Truck, title: 'Truck at Door 1', detail: '260 units to count in' },
  { icon: PackageCheck, title: 'SO-10234 packed', detail: '40 units ready to ship' },
  { icon: Warehouse, title: 'Aisle B counted', detail: 'Shelf 3 · 24 on hand' },
  { icon: TriangleAlert, title: 'Oat milk running low', detail: '3 left · reorder in one go' },
];

/** Same order as `LIVE_EVENTS`. */
export const LIVE_AREAS: LiveAreaType[] = [
  { icon: Truck, label: 'Deliveries' },
  { icon: ClipboardList, label: 'Orders' },
  { icon: Package, label: 'Stock' },
  { icon: Bell, label: 'Alerts' },
];

export const AUDIENCE = [
  { icon: 'catalogue', label: 'Retail' },
  { icon: 'cafe', label: 'Cafés' },
  { icon: 'trades', label: 'Trades' },
];

export const LANDING_ART: HeroArtType = {
  image: '/landing/hero/aisle.webp',
  tagline: 'Every count, live on every screen',
  taglineAccent: ['live'],
  object: {
    src: '/auth/stock-stack.webp',
    caption: 'Modern stock management',
    pills: [
      { text: 'Count', left: '8%', top: '20%' },
      { text: 'Pick', left: '64%', top: '36%' },
      { text: 'Deliver', left: '16%', top: '68%' },
    ],
  },
};

export const FEATURES_ART: HeroArtType = {
  image: '/landing/scenarios/picking.jpg',
  tagline: 'Every shelf, truck and ticket, in one place',
  taglineAccent: ['one', 'place'],
  object: {
    src: '/landing/hero/clipboard.webp',
    caption: 'Stock you can trust',
    pills: [
      { text: 'Count', left: '6%', top: '18%' },
      { text: 'Reorder', left: '58%', top: '30%' },
      { text: 'Track', left: '10%', top: '64%' },
    ],
  },
};

export const HOW_ART: HeroArtType = {
  image: '/landing/scenarios/receiving.jpg',
  tagline: 'Set up once, then stay in sync',
  taglineAccent: ['in', 'sync'],
  object: {
    src: '/landing/hero/loop.webp',
    caption: 'One loop, every day',
    pills: [
      { text: 'Receive', left: '5%', top: '16%' },
      { text: 'Sell', left: '70%', top: '24%' },
      { text: 'Reorder', left: '8%', top: '68%' },
    ],
  },
};

export const PRICING_ART: HeroArtType = {
  image: '/landing/scenarios/today.jpg',
  tagline: 'Every plan includes all three set-ups',
  taglineAccent: ['all', 'three'],
  object: {
    src: '/landing/hero/tag.webp',
    caption: 'Priced per inventory',
    pills: [
      { text: 'Starter', left: '6%', top: '20%' },
      { text: 'Pro', left: '66%', top: '32%' },
      { text: 'Scale', left: '10%', top: '66%' },
    ],
  },
};

export const FAQ_ART: HeroArtType = {
  image: '/landing/scenarios/history.jpg',
  tagline: 'Straight answers, before you sign up',
  taglineAccent: ['Straight'],
  object: {
    src: '/landing/hero/bubble.webp',
    caption: 'How StockMotion works',
    pills: [
      { text: 'Set-up', left: '6%', top: '14%' },
      { text: 'Teams', left: '62%', top: '58%' },
      { text: 'Sync', left: '12%', top: '70%' },
    ],
  },
};
