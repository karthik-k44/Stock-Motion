import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { PGlite } from '@electric-sql/pglite';
import { afterEach, describe, expect, it } from 'vitest';
import { CloseDb, ConnectDb, db } from '@/backend/db/client';
import { RunMigrations } from '@/backend/db/migrate';
import { accounts, activity, businesses, items, memberships } from '@/backend/db/schema';

const ALL = ['0000_initial_schema', '0001_append_only_ledgers', '0002_rate_limits', '0003_remove_sample_data', '0004_prefixed_ids', '0005_billing', '0006_enum_types', '0007_pending_orders', '0008_inventory_pricing', '0009_invoices'];

/** The SQL of a migration file, statement by statement. */
const statements = (tag: string) =>
  readFileSync(new URL(`../db/migrations/${tag}.sql`, import.meta.url), 'utf8').split('--> statement-breakpoint');

let dir = '';
const freshDir = () => (dir = mkdtempSync(join(tmpdir(), 'stockmotion-migrations-')));

afterEach(async () => {
  await CloseDb();
  if (dir) rmSync(dir, { recursive: true, force: true });
  rmSync(`${dir}.lock`, { force: true });
  dir = '';
});

/**
 * A database as the TypeORM migrations left it: their schema (the first three migrations' SQL is the same) and their
 * bookkeeping table, never recorded by Drizzle. `seed` adds old-style rows (uuid ids) to it.
 */
const legacyDatabase = async (seed: string) => {
  const legacy = new PGlite(freshDir());
  for (const tag of ALL.slice(0, 3)) for (const s of statements(tag)) await legacy.exec(s);
  await legacy.exec(`
    CREATE TABLE typeorm_migrations (id SERIAL PRIMARY KEY, timestamp BIGINT NOT NULL, name TEXT NOT NULL);
    INSERT INTO typeorm_migrations (timestamp, name) VALUES (1792368000000, 'InitialSchema1792368000000');
    ${seed}
  `);
  await legacy.close();
  await ConnectDb({ dataDir: dir });
};

describe('migrations', () => {
  it('builds an empty database from scratch, then has nothing left to run', async () => {
    await ConnectDb({ dataDir: freshDir() });
    expect(await RunMigrations()).toEqual(ALL);
    expect(await RunMigrations()).toEqual([]);
    const [account] = await db.insert(accounts).values({ email: 'first@example.com', name: 'First', password_hash: 'x' }).returning();
    expect(account.id).toBe('ACID100000');
  });

  it('adopts a database made by the TypeORM migrations and renumbers its ids, keeping every link', async () => {
    await legacyDatabase(`
      INSERT INTO accounts (id, email, name, password_hash, created_at) VALUES
        ('a1b2c3d4-0000-0000-0000-000000000001', 'kept@example.com', 'Kept', 'x', now() - interval '2 days'),
        ('a1b2c3d4-0000-0000-0000-000000000002', 'second@example.com', 'Second', 'x', now() - interval '1 day');
      INSERT INTO businesses (id, name, type, created_by) VALUES ('b1b2c3d4-0000-0000-0000-000000000001', 'Kept Shop', 'RETAIL', 'a1b2c3d4-0000-0000-0000-000000000002');
      INSERT INTO memberships (business_id, account_id, role, color) VALUES ('b1b2c3d4-0000-0000-0000-000000000001', 'a1b2c3d4-0000-0000-0000-000000000002', 'OWNER', '#000');
    `);
    expect(await RunMigrations()).toEqual(ALL);
    expect(await db.select({ id: accounts.id, email: accounts.email }).from(accounts).orderBy(accounts.id)).toEqual([
      { id: 'ACID100000', email: 'kept@example.com' },
      { id: 'ACID100001', email: 'second@example.com' },
    ]);
    expect(await db.select({ business_id: memberships.business_id, account_id: memberships.account_id }).from(memberships)).toEqual([
      { business_id: 'BSID100000', account_id: 'ACID100001' },
    ]);
    const [next] = await db.insert(accounts).values({ email: 'new@example.com', name: 'New', password_hash: 'x' }).returning();
    expect(next.id).toBe('ACID100002');
  });

  it('clears the sample data from businesses that had it and removes the old demo login', async () => {
    const setUp = (biz: string, withSample: boolean) =>
      `INSERT INTO activity (business_id, kind, message) VALUES ('${biz}', 'SYSTEM', 'Set up Shop as a retail / e-commerce warehouse${withSample ? ' with sample data' : ''}');`;
    await legacyDatabase(`
      INSERT INTO accounts (id, email, name, password_hash) VALUES
        ('a0000000-0000-0000-0000-000000000001', 'demo@stockmotion.local', 'Demo Owner', 'x'),
        ('a0000000-0000-0000-0000-000000000002', 'owner@example.com', 'Owner', 'x');
      INSERT INTO businesses (id, name, type, created_by) VALUES
        ('b0000000-0000-0000-0000-000000000001', 'Old Demo', 'RETAIL', 'a0000000-0000-0000-0000-000000000001'),
        ('b0000000-0000-0000-0000-000000000002', 'Sampled', 'RETAIL', 'a0000000-0000-0000-0000-000000000002'),
        ('b0000000-0000-0000-0000-000000000003', 'Own Data', 'RETAIL', 'a0000000-0000-0000-0000-000000000002');
      INSERT INTO memberships (business_id, account_id, role, color) VALUES
        ('b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000002', 'OWNER', '#000');
      ${setUp('b0000000-0000-0000-0000-000000000001', true)}
      ${setUp('b0000000-0000-0000-0000-000000000002', true)}
      ${setUp('b0000000-0000-0000-0000-000000000003', false)}
      INSERT INTO items (business_id, sku, name, category, unit) VALUES
        ('b0000000-0000-0000-0000-000000000001', 'DEMO-1', 'Demo', 'OFFICE', 'ea'),
        ('b0000000-0000-0000-0000-000000000002', 'SAMPLE-1', 'Sample', 'OFFICE', 'ea'),
        ('b0000000-0000-0000-0000-000000000003', 'MINE-1', 'Mine', 'OFFICE', 'ea');
    `);
    await RunMigrations();
    expect((await db.select({ email: accounts.email }).from(accounts)).map((a) => a.email)).toEqual(['owner@example.com']);
    expect((await db.select({ name: businesses.name }).from(businesses).orderBy(businesses.name)).map((b) => b.name)).toEqual(['Own Data', 'Sampled']);
    expect((await db.select({ sku: items.sku }).from(items)).map((i) => i.sku)).toEqual(['MINE-1']);
    expect((await db.select({ message: activity.message }).from(activity)).map((a) => a.message)).toContainEqual(
      expect.stringMatching(/^Removed the sample data/),
    );
    expect(await db.select().from(memberships)).toHaveLength(1);
  });
});
