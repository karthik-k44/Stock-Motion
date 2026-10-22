import { mkdirSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';
import pg from 'pg';
import { logger } from '@/backend/config/logger';
import { EnsureDatabase, RedactUrl } from './ensure-database';
import { AcquireDataDirLock } from './pglite-lock';

export type Row = Record<string, unknown>;

/** Anything that can run a parameterised query: the pool or a transaction. */
export interface Queryable {
  query<T extends Row = Row>(text: string, params?: unknown[]): Promise<{ rows: T[] }>;
  /** Run one or more statements without parameters (migrations, truncation). */
  exec(sql: string): Promise<void>;
}

interface Driver extends Queryable {
  kind: 'postgres' | 'pglite';
  transaction<T>(fn: (tx: Queryable) => Promise<T>): Promise<T>;
  close(): Promise<void>;
}

let driver: Driver | null = null;

const postgresDriver = (url: string): Driver => {
  const pool = new pg.Pool({ connectionString: url, max: 10 });
  return {
    kind: 'postgres',
    query: async <T extends Row>(text: string, params?: unknown[]) => {
      const r = await pool.query(text, params);
      return { rows: r.rows as T[] };
    },
    exec: async (sql) => {
      await pool.query(sql);
    },
    transaction: async (fn) => {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        const result = await fn({
          query: async <T extends Row>(text: string, params?: unknown[]) => ({ rows: (await client.query(text, params)).rows as T[] }),
          exec: async (sql: string) => {
            await client.query(sql);
          },
        });
        await client.query('COMMIT');
        return result;
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }
    },
    close: () => pool.end(),
  };
};

const pgliteDriver = async (dataDir?: string): Promise<Driver> => {
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
  return {
    kind: 'pglite',
    query: async <T extends Row>(text: string, params?: unknown[]) => {
      const r = await lite.query<T>(text, params);
      return { rows: r.rows };
    },
    exec: async (sql) => {
      await lite.exec(sql);
    },
    transaction: (fn) =>
      lite.transaction((tx) =>
        fn({
          query: async <T extends Row>(text: string, params?: unknown[]) => ({ rows: (await tx.query<T>(text, params)).rows }),
          exec: async (sql: string) => {
            await tx.exec(sql);
          },
        }),
      ),
    close: async () => {
      await lite.close();
      release();
    },
  };
};

/**
 * Connect once at startup. `url` → real Postgres; otherwise embedded Postgres
 * persisted to `dataDir` (or in memory when `dataDir` is omitted — used by tests).
 */
export const ConnectDb = async (opts: { url?: string; dataDir?: string }): Promise<void> => {
  if (driver) return;
  if (opts.url) {
    await EnsureDatabase(opts.url);
    driver = postgresDriver(opts.url);
    logger.info(`Database connected (postgres: ${RedactUrl(opts.url)})`);
  } else {
    driver = await pgliteDriver(opts.dataDir);
    logger.info(`Database connected (embedded pglite: ${opts.dataDir ?? 'in-memory'})`);
  }
};

const current = (): Driver => {
  if (!driver) throw new Error('Database not connected — call ConnectDb() first');
  return driver;
};

export const db = {
  query: <T extends Row = Row>(text: string, params?: unknown[]) => current().query<T>(text, params),
  exec: (sql: string) => current().exec(sql),
  transaction: <T>(fn: (tx: Queryable) => Promise<T>) => current().transaction(fn),
  close: async () => {
    if (!driver) return;
    await driver.close();
    driver = null;
  },
};
