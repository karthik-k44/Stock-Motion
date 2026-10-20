import { twMerge } from 'tailwind-merge';

/** Join class names, skipping falsy values. Conflicting Tailwind classes resolve to the last one (`p-2 p-4` → `p-4`). */
export const Cn = (...classes: (string | false | null | undefined)[]): string => {
  return twMerge(classes.filter(Boolean).join(' '));
};

export const Clamp = (value: number, min: number, max: number): number => {
  return Math.min(max, Math.max(min, value));
};

/** Stable 32-bit hash (FNV-1a) — used for deterministic visual jitter. */
export const HashString = (s: string): number => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
};
