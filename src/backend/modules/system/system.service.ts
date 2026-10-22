import { db } from '@/backend/db/client';
import { systemRepository } from './system.repository';

const Health = async () => {
  await systemRepository.Ping(db);
  return { ok: true, at: new Date().toISOString() };
};

export const systemService = { Health };
