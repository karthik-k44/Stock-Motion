import type { ZodError } from 'zod';

/** First message per field from a zod error, keyed by the top-level field (or `field.index.sub`). */
export function FieldErrors(error: ZodError, depth = 1): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.slice(0, depth).join('.') || 'form';
    out[key] ??= issue.message;
  }
  return out;
}

/** "12" → 12, "" or junk → NaN, so zod reports "Enter a number" instead of silently using 0. */
export const ToNumber = (value: string): number => (value.trim() === '' ? Number.NaN : Number(value));
