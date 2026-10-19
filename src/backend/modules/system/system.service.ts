import { db } from '@/backend/db/client';
import { systemRepository } from './system.repository';

async function Health() {
  await systemRepository.Ping(db);
  return { ok: true, at: new Date().toISOString() };
}

export const systemService = { Health };
