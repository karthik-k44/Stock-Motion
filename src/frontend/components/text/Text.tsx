import type { ComponentPropsWithoutRef, ElementType, ReactNode } from 'react';
import { Cn } from '@/frontend/lib/utils';

/**
 * The type scale. Every piece of text picks a variant instead of its own size, weight and spacing,
 * so headings, labels and numbers look the same on every screen.
 */
const VARIANTS = {
  /** Marketing pages (docs/design/style-reference.md): display 72px, −0.03em */
  banner: 'text-[clamp(2.5rem,6vw,4.5rem)] leading-none font-semibold tracking-[-0.03em]',
  /** Marketing: heading-lg 48px, −0.025em */
  hero: 'text-[clamp(2.25rem,5vw,3rem)] leading-[1.2] font-semibold tracking-[-0.025em]',
  /** Marketing: section heading 36–48px */
  section: 'text-[clamp(2rem,4vw,3rem)] leading-[1.2] font-semibold tracking-[-0.025em]',
  /** Marketing: card and FAQ titles, 20px */
  feature: 'text-xl leading-[1.4] font-semibold tracking-[-0.01em]',
  /** Marketing: subheading 20px under headlines */
  lead: 'text-[17px] leading-[1.5] tracking-[-0.01em] sm:text-xl sm:leading-[1.4]',
  display: 'text-[28px] leading-tight font-extrabold tracking-tight',
  title: 'text-[22px] leading-snug font-bold tracking-tight',
  heading: 'text-lg leading-snug font-bold tracking-tight',
  subheading: 'text-[15px] leading-snug font-semibold',
  body: 'text-sm leading-normal',
  small: 'text-[13px] leading-normal',
  caption: 'text-xs leading-snug',
  eyebrow: 'text-[11px] leading-none font-bold uppercase tracking-[0.08em]',
  metric: 'text-2xl leading-none font-extrabold tracking-tight tabular-nums',
  code: 'font-mono text-[13px] leading-snug font-semibold',
} as const;

const TONES = {
  ink: 'text-ink',
  secondary: 'text-ink-2',
  muted: 'text-muted-foreground',
  primary: 'text-primary-700',
  success: 'text-success',
  warning: 'text-warning',
  danger: 'text-danger',
  info: 'text-info',
  inverse: 'text-white',
  /** Takes the parent's colour (inside buttons, pills, links) */
  inherit: '',
} as const;

const WEIGHTS = {
  regular: 'font-normal',
  medium: 'font-medium',
  semibold: 'font-semibold',
  bold: 'font-bold',
  extrabold: 'font-extrabold',
} as const;

export type TextVariant = keyof typeof VARIANTS;
export type TextTone = keyof typeof TONES;
export type TextWeight = keyof typeof WEIGHTS;

/** The element each variant renders by default; `as` overrides it (an `h2` styled as a title, a `span` in a row). */
const ELEMENTS: Record<TextVariant, ElementType> = {
  banner: 'h1',
  hero: 'h1',
  section: 'h2',
  feature: 'h3',
  lead: 'p',
  display: 'h1',
  title: 'h1',
  heading: 'h2',
  subheading: 'h3',
  body: 'p',
  small: 'p',
  caption: 'p',
  eyebrow: 'p',
  metric: 'p',
  code: 'code',
};

const QUIET: TextVariant[] = ['caption', 'eyebrow'];

type TextProps<T extends ElementType> = {
  as?: T;
  variant?: TextVariant;
  /** Defaults to `ink`, or `muted` for captions and eyebrows */
  tone?: TextTone;
  weight?: TextWeight;
  /** One line with an ellipsis */
  truncate?: boolean;
  className?: string;
  children?: ReactNode;
} & Omit<ComponentPropsWithoutRef<T>, 'as' | 'className' | 'children'>;

export const Text = <T extends ElementType = 'p'>({ as, variant = 'body', tone, weight, truncate, className, children, ...rest }: TextProps<T>) => {
  const Element = (as ?? ELEMENTS[variant]) as ElementType<{ className?: string; children?: ReactNode }>;
  const color = TONES[tone ?? (QUIET.includes(variant) ? 'muted' : 'ink')];
  return (
    <Element className={Cn('m-0', VARIANTS[variant], color, weight && WEIGHTS[weight], truncate && 'min-w-0 truncate', className)} {...(rest as object)}>
      {children}
    </Element>
  );
};
