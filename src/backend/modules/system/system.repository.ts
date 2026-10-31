import type { Queryable } from '@/backend/db/client';

/** One round trip to the database, for the health check. */
const Ping = async (q: Queryable): Promise<void> => {
  await q.query('SELECT 1');
};

export const systemRepository = { Ping };
