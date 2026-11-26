import type { DbDate } from './_shared';

/** The `rate_limits` table: one counter per limiter key (e.g. `credentials:<ip>`) and window. */
export type RateLimitRecord = {
  key: string;
  count: number;
  reset_at: DbDate;
};
