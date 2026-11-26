import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { max } from 'drizzle-orm';
import { bigint, pgSchema, serial, text } from 'drizzle-orm/pg-core';
import { logger } from '@/backend/config/logger';
import { db, DriverOf } from './client';

/** The SQL migrations and drizzle-kit's journal of them (copied next to the compiled server by the build). */
const MIGRATIONS_FOLDER = fileURLToPath(new URL('./migrations', import.meta.url));

/** Drizzle records each applied migration here, by the `when` of its journal entry. */
const appliedMigrations = pgSchema('drizzle').table('__drizzle_migrations', {
  id: serial().primaryKey(),
  hash: text().notNull(),
  created_at: bigint({ mode: 'number' }),
});

type JournalType = { entries: { tag: string; when: number }[] };

/** When the newest applied migration was written, or 0 on a database that has never been migrated. */
const lastApplied = async (): Promise<number> => {
  try {
    const [row] = await db.select({ when: max(appliedMigrations.created_at) }).from(appliedMigrations);
    return row?.when ?? 0;
  } catch {
    return 0;
  }
};

/** Apply every migration in `migrations/` that hasn't run yet, all in one transaction. Returns their names. */
export const RunMigrations = async (): Promise<string[]> => {
  const journal = JSON.parse(readFileSync(`${MIGRATIONS_FOLDER}/meta/_journal.json`, 'utf8')) as JournalType;
  const since = await lastApplied();
  const pending = journal.entries.filter((e) => e.when > since).map((e) => e.tag);
  if (!pending.length) return [];
  const config = { migrationsFolder: MIGRATIONS_FOLDER };
  if (DriverOf() === 'pglite') {
    const { migrate } = await import('drizzle-orm/pglite/migrator');
    await migrate(db as never, config);
  } else {
    const { migrate } = await import('drizzle-orm/node-postgres/migrator');
    await migrate(db as never, config);
  }
  for (const tag of pending) logger.info(`Applied migration ${tag}`);
  return pending;
};
