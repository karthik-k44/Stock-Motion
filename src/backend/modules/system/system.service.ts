import { db } from '@/backend/db/client';
import { SeedDatabase } from '@/backend/db/seed';
import { BroadcastChange } from '@/backend/realtime/socket';
import { ResourceTypeEnum } from '@/backend/types/dashboard';

async function Health() {
  await db.query('SELECT 1');
  return { ok: true, at: new Date().toISOString() };
}

/** Restore the demo data set. */
async function Reset() {
  await SeedDatabase({ reset: true });
  BroadcastChange(Object.values(ResourceTypeEnum));
  return { ok: true };
}

export const systemService = { Health, Reset };
