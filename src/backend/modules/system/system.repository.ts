import type { Queryable } from '@/backend/db/client';
import { accounts } from '@/backend/db/schema';

/** One round trip to the database, for the health check. */
const Ping = async (q: Queryable): Promise<void> => {
  await q.select({ id: accounts.id }).from(accounts).limit(1);
};

export const systemRepository = { Ping };
