/** `npm run db:migrate`. Kept apart from `db/migrate.ts` so importing that module never runs this. */
import { env } from '@/backend/config/env';
import { logger } from '@/backend/config/logger';
import { CloseDb, ConnectDb } from '@/backend/db/client';
import { RunMigrations } from '@/backend/db/migrate';

await ConnectDb({ url: env.DATABASE_URL, dataDir: env.PGLITE_DIR });
const applied = await RunMigrations();
logger.info(applied.length ? `Done — ${applied.length} migration(s) applied` : 'Database is up to date');
await CloseDb();
