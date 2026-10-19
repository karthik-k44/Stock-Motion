import { pathToFileURL } from 'node:url';
import { logger } from '@/backend/config/logger';
import { db, type Queryable } from './client';
import { ALL_TABLES } from './schema';
import {
  SEED_ACTIVITY,
  SEED_DELIVERIES,
  SEED_ITEMS,
  SEED_MOVEMENTS,
  SEED_ORDERS,
  SEED_USERS,
} from './seed-data';

const AISLES = ['A', 'B', 'C', 'D'];
const LEVELS = [1, 2, 3];
const BINS = [1, 2, 3, 4];

function at(dayOffset: number, hour: number, minute = 0): Date {
  const d = new Date();
  d.setDate(d.getDate() + dayOffset);
  d.setHours(hour, minute, 0, 0);
  return d;
}
const minutesAgo = (m: number) => new Date(Date.now() - m * 60_000);

async function insertAll(tx: Queryable) {
  for (const u of SEED_USERS) {
    await tx.query('INSERT INTO users (id, name, role, initials, vest, skin, hat) VALUES ($1,$2,$3,$4,$5,$6,$7)', [
      u.id, u.name, u.role, u.initials, u.vest, u.skin, u.hat,
    ]);
  }
  for (const a of AISLES)
    for (const l of LEVELS)
      for (const b of BINS)
        await tx.query('INSERT INTO locations (code, aisle, level, bin) VALUES ($1,$2,$3,$4)', [`${a}-${l}-${b}`, a, l, b]);

  for (const [sku, name, category, unit, onHand, reorder, location] of SEED_ITEMS) {
    await tx.query(
      'INSERT INTO items (sku, name, category, unit, on_hand, reorder_level, location) VALUES ($1,$2,$3,$4,$5,$6,$7)',
      [sku, name, category, unit, onHand, reorder, location],
    );
  }
  for (const o of SEED_ORDERS) {
    await tx.query(
      'INSERT INTO orders (id, customer, requested_date, created_at, status, assignee) VALUES ($1,$2,$3,$4,$5,$6)',
      [o.id, o.customer, at(o.dueDays, o.dueHour), minutesAgo(o.createdMinsAgo), o.status, o.assignee],
    );
    let pos = 0;
    for (const [sku, qty, picked] of o.lines) {
      await tx.query('INSERT INTO order_lines (order_id, sku, position, qty, picked) VALUES ($1,$2,$3,$4,$5)', [o.id, sku, pos++, qty, picked]);
    }
  }
  for (const d of SEED_DELIVERIES) {
    const received = d.status === 'RECEIVED';
    await tx.query(
      'INSERT INTO deliveries (id, supplier, truck, plate, expected_at, received_at, status) VALUES ($1,$2,$3,$4,$5,$6,$7)',
      [d.id, d.supplier, d.truck, d.plate, at(d.dueDays, d.dueHour, d.dueMin), received ? minutesAgo(1700) : null, d.status],
    );
    let pos = 0;
    for (const [sku, expected] of d.lines) {
      await tx.query('INSERT INTO delivery_lines (delivery_id, sku, position, expected, received) VALUES ($1,$2,$3,$4,$5)', [
        d.id, sku, pos++, expected, received ? expected : null,
      ]);
    }
  }
  for (const [mins, sku, type, delta, balance, ref, user, note] of SEED_MOVEMENTS) {
    await tx.query('INSERT INTO movements (at, sku, type, delta, balance, ref, user_id, note) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)', [
      minutesAgo(mins), sku, type, delta, balance, ref, user, note,
    ]);
  }
  for (const [mins, kind, user, message, refType, refId, meta] of [...SEED_ACTIVITY].sort((a, b) => b[0] - a[0])) {
    await tx.query('INSERT INTO activity (at, kind, user_id, message, ref_type, ref_id, meta) VALUES ($1,$2,$3,$4,$5,$6,$7)', [
      minutesAgo(mins), kind, user, message, refType, refId, JSON.stringify(meta),
    ]);
  }
}

/** Seed the demo data. With `reset`, existing rows are wiped first; otherwise seeding only runs on an empty database. */
export async function SeedDatabase(opts: { reset?: boolean } = {}): Promise<boolean> {
  if (!opts.reset) {
    const { rows } = await db.query<{ n: number }>('SELECT COUNT(*)::int AS n FROM users');
    if (rows[0].n > 0) return false;
  }
  await db.transaction(async (tx) => {
    if (opts.reset) await tx.exec(`TRUNCATE ${ALL_TABLES.join(', ')} RESTART IDENTITY CASCADE`);
    await insertAll(tx);
  });
  logger.info('Seeded demo data');
  return true;
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  const { env } = await import('@/backend/config/env');
  const { ConnectDb } = await import('./client');
  const { RunMigrations } = await import('./migrate');
  await ConnectDb({ url: env.DATABASE_URL, dataDir: env.PGLITE_DIR });
  await RunMigrations();
  await SeedDatabase({ reset: true });
  await db.close();
}
