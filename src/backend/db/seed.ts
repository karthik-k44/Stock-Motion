import { pathToFileURL } from 'node:url';
import { logger } from '@/backend/config/logger';
import { authService } from '@/backend/modules/auth/auth.service';
import { businessesService } from '@/backend/modules/businesses/businesses.service';
import { BusinessTypeEnum } from '@/backend/types/template';
import { db } from './client';
import { ALL_TABLES } from './schema';

/** Local demo login, created only in development. Listed in README.md. */
export const DEMO_ACCOUNT = { name: 'Demo Owner', email: 'demo@stockmotion.local', password: 'stockmotion-demo' };

const DEMO_BUSINESSES = [
  { name: 'Harborline Supply Co.', type: BusinessTypeEnum.RETAIL, currency: 'USD' },
  { name: 'Ember & Oat Café', type: BusinessTypeEnum.CAFE, currency: 'USD' },
  { name: 'Brightwire Trades', type: BusinessTypeEnum.TRADES, currency: 'USD' },
];

const isEmpty = async (): Promise<boolean> => {
  const { rows } = await db.query<{ n: number }>('SELECT COUNT(*)::int AS n FROM accounts');
  return rows[0].n === 0;
};

/**
 * Create the demo account with one sample business per template. With `reset`, every row in the
 * database is wiped first; otherwise it only runs on an empty database.
 */
export const SeedDatabase = async (opts: { reset?: boolean } = {}): Promise<boolean> => {
  if (opts.reset) await db.exec(`TRUNCATE ${ALL_TABLES.join(', ')} RESTART IDENTITY CASCADE`);
  else if (!(await isEmpty())) return false;
  const { account } = await authService.Register(DEMO_ACCOUNT);
  for (const b of DEMO_BUSINESSES) await businessesService.Create(account, { ...b, sampleData: true });
  logger.info(`Seeded demo data — sign in as ${DEMO_ACCOUNT.email} / ${DEMO_ACCOUNT.password}`);
  return true;
};

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  const { env } = await import('@/backend/config/env');
  if (env.NODE_ENV === 'production') {
    logger.error('Refusing to seed a production database with a known demo password');
    process.exit(1);
  }
  const { ConnectDb } = await import('./client');
  const { RunMigrations } = await import('./migrate');
  await ConnectDb({ url: env.DATABASE_URL, dataDir: env.PGLITE_DIR });
  await RunMigrations();
  await SeedDatabase({ reset: true });
  await db.close();
}
