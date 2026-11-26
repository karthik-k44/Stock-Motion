import { index, integer, pgTable, text } from 'drizzle-orm/pg-core';
import { timestampTz } from './_shared';

/** One counter per limiter key (e.g. `credentials:<ip>`) and window, shared by every server instance. */
export const rateLimits = pgTable(
  'rate_limits',
  {
    key: text().primaryKey(),
    count: integer().notNull(),
    reset_at: timestampTz().notNull(),
  },
  (t) => [index('rate_limits_reset_at_idx').on(t.reset_at)],
);
