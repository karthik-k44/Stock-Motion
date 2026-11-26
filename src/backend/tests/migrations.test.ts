import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { PGlite } from '@electric-sql/pglite';
import { afterEach, describe, expect, it } from 'vitest';
import { CloseDb, ConnectDb, db } from '@/backend/db/client';
import { RunMigrations } from '@/backend/db/migrate';

const SCHEMA = readFileSync(new URL('../db/migrations/sql/initial-schema.sql', import.meta.url), 'utf8');

let dir = '';
const freshDir = () => (dir = mkdtempSync(join(tmpdir(), 'stockmotion-migrations-')));

afterEach(async () => {
  await CloseDb();
  if (dir) rmSync(dir, { recursive: true, force: true });
  rmSync(`${dir}.lock`, { force: true });
  dir = '';
});

describe('migrations', () => {
  it('builds an empty database from scratch, then has nothing left to run', async () => {
    await ConnectDb({ dataDir: freshDir() });
    expect(await RunMigrations()).toEqual(['InitialSchema1792368000000', 'AppendOnlyLedgers1793404800000', 'RateLimits1795651200000']);
    expect(await RunMigrations()).toEqual([]);
  });

  it('adopts a database made by the old SQL-file runner without touching its data', async () => {
    // What the old runner left behind: the schema, its bookkeeping table and real data.
    const legacy = new PGlite(freshDir());
    await legacy.exec(SCHEMA);
    await legacy.exec(`
      CREATE TABLE schema_migrations (name TEXT PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT now());
      INSERT INTO schema_migrations (name) VALUES ('001_init.sql'), ('002_multi_business.sql');
      INSERT INTO accounts (email, name, password_hash) VALUES ('kept@example.com', 'Kept', 'x');
    `);
    await legacy.close();

    await ConnectDb({ dataDir: dir });
    expect(await RunMigrations()).toEqual(['InitialSchema1792368000000', 'AppendOnlyLedgers1793404800000', 'RateLimits1795651200000']);
    expect(await db.query('SELECT email FROM accounts')).toEqual([{ email: 'kept@example.com' }]);
  });
});
