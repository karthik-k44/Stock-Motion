import { lte, sql } from 'drizzle-orm';
import type { Queryable } from '@/backend/db/client';
import { rateLimits } from '@/backend/db/schema';

/** Count one hit against `key` and return the count in its current window. Atomic, so concurrent instances all count. */
const Hit = async (q: Queryable, key: string, windowMs: number): Promise<number> => {
  const now = new Date();
  const expired = sql`${rateLimits.reset_at} <= ${now}`;
  const [row] = await q
    .insert(rateLimits)
    .values({ key, count: 1, reset_at: new Date(now.getTime() + windowMs) })
    .onConflictDoUpdate({
      target: rateLimits.key,
      set: {
        count: sql`CASE WHEN ${expired} THEN 1 ELSE ${rateLimits.count} + 1 END`,
        reset_at: sql`CASE WHEN ${expired} THEN excluded.reset_at ELSE ${rateLimits.reset_at} END`,
      },
    })
    .returning({ count: rateLimits.count });
  return row.count;
};

/** Drop counters whose window has passed. */
const DeleteExpired = async (q: Queryable): Promise<void> => {
  await q.delete(rateLimits).where(lte(rateLimits.reset_at, new Date()));
};

export const rateLimitsRepository = { Hit, DeleteExpired };
