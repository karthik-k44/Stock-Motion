import { twMerge } from 'tailwind-merge';

/** Join class names, skipping falsy values. Conflicting Tailwind classes resolve to the last one (`p-2 p-4` → `p-4`). */
export const Cn = (...classes: (string | false | null | undefined)[]): string => {
  return twMerge(classes.filter(Boolean).join(' '));
};

export const Clamp = (value: number, min: number, max: number): number => {
  return Math.min(max, Math.max(min, value));
};

/** shadcn/ui's name for Cn — keeps generated components (`npx shadcn add …`) working unchanged. */
export const cn = Cn;
