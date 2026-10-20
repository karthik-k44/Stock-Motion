import type { WorldToneType } from '../types';

/** Tailwind classes per status tone. Kept as literal strings so Tailwind can find them. */
export const TONE_CLASSES: Record<WorldToneType, { solid: string; soft: string; text: string; bar: string }> = {
  neutral: { solid: 'bg-neutral text-white', soft: 'bg-neutral-bg text-neutral', text: 'text-neutral', bar: 'bg-neutral' },
  good: { solid: 'bg-success text-white', soft: 'bg-success-bg text-success', text: 'text-success', bar: 'bg-success' },
  warning: { solid: 'bg-warning text-white', soft: 'bg-warning-bg text-warning', text: 'text-warning', bar: 'bg-warning' },
  critical: { solid: 'bg-danger text-white', soft: 'bg-danger-bg text-danger', text: 'text-danger', bar: 'bg-danger' },
  info: { solid: 'bg-info text-white', soft: 'bg-info-bg text-info', text: 'text-info', bar: 'bg-info' },
  reserved: { solid: 'bg-reserved text-white', soft: 'bg-reserved-bg text-reserved', text: 'text-reserved', bar: 'bg-reserved' },
  incoming: { solid: 'bg-incoming text-white', soft: 'bg-incoming-bg text-incoming', text: 'text-incoming', bar: 'bg-incoming' },
};
