import type { Queryable } from '@/backend/db/client';
import { RateLimitEntity } from '@/backend/db/entities';

/** Count one hit against `key` and return the count in its current window. Atomic, so concurrent instances all count. */
const Hit = async (q: Queryable, key: string, windowMs: number): Promise<number> => {
  const rows: { count: number }[] = await q.query(
    `INSERT INTO rate_limits AS r (key, count, reset_at)
     VALUES ($1, 1, now() + make_interval(secs => $2::double precision / 1000))
     ON CONFLICT (key) DO UPDATE SET
       count    = CASE WHEN r.reset_at <= now() THEN 1 ELSE r.count + 1 END,
       reset_at = CASE WHEN r.reset_at <= now() THEN EXCLUDED.reset_at ELSE r.reset_at END
     RETURNING count`,
    [key, windowMs],
  );
  return rows[0].count;
};

/** Drop counters whose window has passed. */
const DeleteExpired = async (q: Queryable): Promise<void> => {
  await q.getRepository(RateLimitEntity).createQueryBuilder().delete().where('reset_at <= now()').execute();
};

export const rateLimitsRepository = { Hit, DeleteExpired };
