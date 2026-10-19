import type { Queryable } from '@/backend/db/client';

async function Ping(q: Queryable): Promise<void> {
  await q.query('SELECT 1');
}

export const systemRepository = { Ping };
