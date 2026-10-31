import { pathToFileURL } from 'node:url';
import { logger } from '@/backend/config/logger';
import { DataSourceOf } from './client';

/** Apply every migration in `migrations/index.ts` that hasn't run yet, each in its own transaction. */
export const RunMigrations = async (): Promise<string[]> => {
  const applied = await DataSourceOf().runMigrations({ transaction: 'each' });
  for (const m of applied) logger.info(`Applied migration ${m.name}`);
  return applied.map((m) => m.name);
};

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  const { env } = await import('@/backend/config/env');
  const { CloseDb, ConnectDb } = await import('./client');
  await ConnectDb({ url: env.DATABASE_URL, dataDir: env.PGLITE_DIR });
  const applied = await RunMigrations();
  logger.info(applied.length ? `Done — ${applied.length} migration(s) applied` : 'Database is up to date');
  await CloseDb();
}
