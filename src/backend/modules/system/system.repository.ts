import type { Queryable } from '@/backend/db/client';

const Ping = async (q: Queryable): Promise<void> => {
  await q.query('SELECT 1');
};

export const systemRepository = { Ping };
