import { mkdirSync } from 'node:fs';
import type { ExtractTablesWithRelations } from 'drizzle-orm';
import { drizzle as drizzlePostgres } from 'drizzle-orm/node-postgres';
import type { PgDatabase, PgQueryResultHKT } from 'drizzle-orm/pg-core';
import { drizzle as drizzlePglite } from 'drizzle-orm/pglite';
import pg from 'pg';
import { logger } from '@/backend/config/logger';
import { CONNECT_TIMEOUT_MS, EnsureDatabase, RedactUrl } from './ensure-database';
import { AcquireDataDirLock } from './pglite-lock';
import * as schema from './schema';

export type SchemaType = typeof schema;
export type Database = PgDatabase<PgQueryResultHKT, SchemaType, ExtractTablesWithRelations<SchemaType>>;

/**
 * What every repository function takes first: the shared `db`, or the transaction it runs in (`db.transaction(async
 * (tx) => …)` hands it `tx`). Inside a transaction always pass `tx` on: on the embedded database the shared `db`
 * waits for the transaction to finish, i.e. forever.
 */
export type Queryable = Database;

/** Set by ConnectDb — module exports are live bindings, so importers see it once connected. */
export let db = undefined as unknown as Database;

export type DriverType = 'postgres' | 'pglite';
let driver: DriverType | null = null;
let close = async () => {};
const queryWatchers = new Set<(query: string) => void>();

const queryLogger = {
  logQuery: (query: string) => {
    logger.debug(`SQL ${query}`);
    queryWatchers.forEach((watch) => watch(query));
  },
};

/** Call `watch` with every statement sent until the returned function is called (tests count round trips). */
export const WatchQueries = (watch: (query: string) => void): (() => void) => {
  queryWatchers.add(watch);
  return () => queryWatchers.delete(watch);
};

const connectPostgres = async (url: string, poolSize: number): Promise<Database> => {
  await EnsureDatabase(url);
  const pool = new pg.Pool({ connectionString: url, max: poolSize, connectionTimeoutMillis: CONNECT_TIMEOUT_MS });
  (await pool.connect()).release();
  close = () => pool.end();
  logger.info(`Database connected (postgres: ${RedactUrl(url)})`);
  return drizzlePostgres(pool, { schema, logger: queryLogger }) as unknown as Database;
};

const connectPglite = async (dataDir?: string): Promise<Database> => {
  let release = () => {};
  if (dataDir) {
    mkdirSync(dataDir, { recursive: true });
    release = await AcquireDataDirLock(dataDir);
  }
  // Loaded only when used, so a PostgreSQL-only build (the Vercel function) doesn't need PGlite at all.
  const { PGlite } = await import('@electric-sql/pglite');
  const lite = dataDir ? new PGlite(dataDir) : new PGlite();
  await lite.waitReady.catch((err) => {
    release();
    throw err;
  });
  close = async () => {
    await lite.close();
    release();
  };
  logger.info(`Database connected (embedded pglite: ${dataDir ?? 'in-memory'})`);
  return drizzlePglite(lite, { schema, logger: queryLogger }) as unknown as Database;
};

/**
 * Connect once at startup. `url` → PostgreSQL (created if missing); otherwise embedded PostgreSQL (PGlite) persisted
 * to `dataDir`, or in memory when `dataDir` is omitted — used by tests.
 */
export const ConnectDb = async (opts: { url?: string; dataDir?: string; poolSize?: number }): Promise<Database> => {
  if (driver) return db;
  db = opts.url ? await connectPostgres(opts.url, opts.poolSize ?? 10) : await connectPglite(opts.dataDir);
  driver = opts.url ? 'postgres' : 'pglite';
  return db;
};

export const DriverOf = (): DriverType => {
  if (!driver) throw new Error('Database not connected — call ConnectDb() first');
  return driver;
};

export const CloseDb = async (): Promise<void> => {
  if (!driver) return;
  await close();
  close = async () => {};
  driver = null;
  db = undefined as unknown as Database;
};

/** Every table, children before parents, so rows can be deleted in order. */
const ALL_TABLES = [
  schema.activity,
  schema.movements,
  schema.deliveryLines,
  schema.deliveries,
  schema.orderLines,
  schema.orders,
  schema.itemComponents,
  schema.items,
  schema.customers,
  schema.suppliers,
  schema.categories,
  schema.locations,
  schema.invites,
  schema.memberships,
  schema.businesses,
  schema.refreshTokens,
  schema.accounts,
  schema.rateLimits,
];

/** Empty every table (tests). Never used on a production database. */
export const WipeDatabase = async (q: Queryable = db): Promise<void> => {
  for (const table of ALL_TABLES) await q.delete(table);
};
