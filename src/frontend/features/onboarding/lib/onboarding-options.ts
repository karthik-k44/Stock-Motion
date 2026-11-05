import type { KeyboardEvent } from 'react';
import type { BusinessTypeEnum } from '@/frontend/features/businesses/types';

/** The illustrated scene for each kind of business. */
export const SCENE: Record<BusinessTypeEnum, string> = {
  RETAIL: '/landing/scenarios/picking.jpg',
  CAFE: '/landing/scenarios/cafe.jpg',
  TRADES: '/landing/scenarios/trades.jpg',
};

export const OTHER_CURRENCY = 'OTHER';

export const CURRENCIES = [
  { code: 'USD', name: 'US dollar' },
  { code: 'EUR', name: 'Euro' },
  { code: 'GBP', name: 'British pound' },
  { code: 'INR', name: 'Indian rupee' },
  { code: 'AUD', name: 'Australian dollar' },
  { code: 'CAD', name: 'Canadian dollar' },
  { code: 'NZD', name: 'New Zealand dollar' },
  { code: 'SGD', name: 'Singapore dollar' },
  { code: 'AED', name: 'UAE dirham' },
  { code: 'ZAR', name: 'South African rand' },
  { code: 'JPY', name: 'Japanese yen' },
];

const REGION_CURRENCY: Record<string, string> = {
  US: 'USD', GB: 'GBP', IN: 'INR', AU: 'AUD', CA: 'CAD', NZ: 'NZD', SG: 'SGD', AE: 'AED', ZA: 'ZAR', JP: 'JPY',
  DE: 'EUR', FR: 'EUR', ES: 'EUR', IT: 'EUR', NL: 'EUR', IE: 'EUR', BE: 'EUR', AT: 'EUR', PT: 'EUR', FI: 'EUR',
};

/** A good first guess from the browser's region. It is only the preselected option, so a wrong guess costs one click. */
export const DefaultCurrency = (): string => {
  try {
    return REGION_CURRENCY[new Intl.Locale(navigator.language).region ?? ''] ?? 'USD';
  } catch {
    return 'USD';
  }
};

const ARROWS: Record<string, number> = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };

/** Goes on a radiogroup: arrow keys move to the next option and select it, as native radios do. */
export const MoveRadio = (e: KeyboardEvent<HTMLElement>) => {
  const step = ARROWS[e.key];
  if (!step) return;
  e.preventDefault();
  const radios = [...e.currentTarget.querySelectorAll<HTMLElement>('[role="radio"]')];
  const next = radios[(radios.indexOf(e.target as HTMLElement) + step + radios.length) % radios.length];
  next.focus();
  next.click();
};
