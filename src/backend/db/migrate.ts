import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { logger } from '@/backend/config/logger';
import { db } from './client';

const MIGRATIONS_DIR = fileURLToPath(new URL('./migrations', import.meta.url));

/** Apply every `migrations/*.sql` file that hasn't been applied yet, in filename order. */
export async function RunMigrations(): Promise<string[]> {
  await db.exec(`CREATE TABLE IF NOT EXISTS schema_migrations (
    name TEXT PRIMARY KEY,
    applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`);
  const { rows } = await db.query<{ name: string }>('SELECT name FROM schema_migrations');
  const applied = new Set(rows.map((r) => r.name));
  const pending = readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql') && !applied.has(f))
    .sort();

  for (const file of pending) {
    const sql = readFileSync(`${MIGRATIONS_DIR}/${file}`, 'utf8');
    await db.transaction(async (tx) => {
      await tx.exec(sql);
      await tx.query('INSERT INTO schema_migrations (name) VALUES ($1)', [file]);
    });
    logger.info(`Applied migration ${file}`);
  }
  return pending;
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  const { env } = await import('@/backend/config/env');
  const { ConnectDb } = await import('./client');
  await ConnectDb({ url: env.DATABASE_URL, dataDir: env.PGLITE_DIR });
  const applied = await RunMigrations();
  logger.info(applied.length ? `Done — ${applied.length} migration(s) applied` : 'Database is up to date');
  await db.close();
}
