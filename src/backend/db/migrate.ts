import { logger } from '@/backend/config/logger';
import { DataSourceOf } from './client';

/** Apply every migration in `migrations/index.ts` that hasn't run yet, each in its own transaction. CLI: `db/cli/migrate.ts`. */
export const RunMigrations = async (): Promise<string[]> => {
  const applied = await DataSourceOf().runMigrations({ transaction: 'each' });
  for (const m of applied) logger.info(`Applied migration ${m.name}`);
  return applied.map((m) => m.name);
};
