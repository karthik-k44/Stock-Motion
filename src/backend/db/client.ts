import { mkdirSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';
import { DataSource, type DataSourceOptions, type EntityManager } from 'typeorm';
import { logger } from '@/backend/config/logger';
import { ENTITIES } from './entities';
import { EnsureDatabase, RedactUrl } from './ensure-database';
import { MIGRATIONS } from './migrations';
import { AcquireDataDirLock } from './pglite-lock';
import { PGliteDriverFor } from './pglite-pool';
import { ALL_TABLES } from './schema';

/** What every repository function takes first: the shared `db`, or the manager of the transaction it runs in. */
export type Queryable = EntityManager;

/**
 * The entity manager for work outside a transaction. `db.transaction(async (tx) => …)` runs work in one and hands
 * it `tx` to pass on. Set by ConnectDb — module exports are live bindings, so importers see it once connected.
 */
export let db = undefined as unknown as EntityManager;

let source: DataSource | null = null;
let closeEmbedded = async () => {};

const SHARED = {
  type: 'postgres',
  entities: ENTITIES,
  migrations: MIGRATIONS,
  migrationsTableName: 'typeorm_migrations',
  // The migrations own the schema; TypeORM never alters tables on its own.
  synchronize: false,
  migrationsRun: false,
  logging: false,
} as const;

const embedded = async (dataDir?: string): Promise<DataSourceOptions> => {
  let release = () => {};
  if (dataDir) {
    mkdirSync(dataDir, { recursive: true });
    release = await AcquireDataDirLock(dataDir);
  }
  const lite = dataDir ? new PGlite(dataDir) : new PGlite();
  await lite.waitReady.catch((err) => {
    release();
    throw err;
  });
  closeEmbedded = async () => {
    await lite.close();
    release();
  };
  return { ...SHARED, driver: PGliteDriverFor(lite) };
};

/**
 * Connect once at startup. `url` → PostgreSQL (created if missing); otherwise embedded PostgreSQL (PGlite)
 * persisted to `dataDir`, or in memory when `dataDir` is omitted — used by tests.
 */
export const ConnectDb = async (opts: { url?: string; dataDir?: string }): Promise<DataSource> => {
  if (source) return source;
  if (opts.url) await EnsureDatabase(opts.url);
  const options: DataSourceOptions = opts.url ? { ...SHARED, url: opts.url, poolSize: 10 } : await embedded(opts.dataDir);
  source = await new DataSource(options).initialize();
  db = source.manager;
  logger.info(
    opts.url ? `Database connected (postgres: ${RedactUrl(opts.url)})` : `Database connected (embedded pglite: ${opts.dataDir ?? 'in-memory'})`,
  );
  return source;
};

export const DataSourceOf = (): DataSource => {
  if (!source) throw new Error('Database not connected — call ConnectDb() first');
  return source;
};

export const CloseDb = async (): Promise<void> => {
  if (!source) return;
  await source.destroy();
  await closeEmbedded();
  closeEmbedded = async () => {};
  source = null;
  db = undefined as unknown as EntityManager;
};

/** Empty every table (demo reseed and tests). Never used on a production database. */
export const WipeDatabase = async (q: Queryable = db): Promise<void> => {
  await q.query(`TRUNCATE ${ALL_TABLES.join(', ')} RESTART IDENTITY CASCADE`);
};
