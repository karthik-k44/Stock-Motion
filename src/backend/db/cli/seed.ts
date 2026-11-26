/** `npm run db:seed` — wipe the local database and load the demo login with one sample business per template. */
import { env } from '@/backend/config/env';
import { logger } from '@/backend/config/logger';
import { CloseDb, ConnectDb } from '@/backend/db/client';
import { RunMigrations } from '@/backend/db/migrate';
import { SeedDatabase } from '@/backend/db/seed';

if (env.NODE_ENV === 'production') {
  logger.error('Refusing to seed a production database with a known demo password');
  process.exit(1);
}
await ConnectDb({ url: env.DATABASE_URL, dataDir: env.PGLITE_DIR });
await RunMigrations();
await SeedDatabase({ reset: true });
await CloseDb();
