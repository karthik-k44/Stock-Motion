import { readFileSync } from 'node:fs';
import type { MigrationInterface, QueryRunner } from 'typeorm';

const SCHEMA = new URL('./sql/initial-schema.sql', import.meta.url);

const TABLES =
  'activity, movements, delivery_lines, deliveries, order_lines, orders, item_components, items, customers, suppliers, categories, locations, invites, memberships, businesses, refresh_tokens, accounts';

/**
 * Databases made before TypeORM recorded their SQL files in `schema_migrations`. If the multi-business schema is
 * already there it is adopted as-is: the SQL begins by dropping the very first version's tables, so it must never
 * run against a database that holds real data.
 */
const alreadyApplied = async (qr: QueryRunner): Promise<boolean> => {
  const [{ legacy }] = await qr.query(`SELECT to_regclass('public.schema_migrations') IS NOT NULL AS legacy`);
  if (!legacy) return false;
  const rows = await qr.query(`SELECT 1 FROM schema_migrations WHERE name = $1`, ['002_multi_business.sql']);
  return rows.length > 0;
};

/** Accounts, businesses, the catalogue, orders, deliveries, the ledgers and the `item_views` view. */
export class InitialSchema1792368000000 implements MigrationInterface {
  name = 'InitialSchema1792368000000';

  up = async (qr: QueryRunner): Promise<void> => {
    if (await alreadyApplied(qr)) return;
    await qr.query(readFileSync(SCHEMA, 'utf8'));
  };

  down = async (qr: QueryRunner): Promise<void> => {
    await qr.query(`DROP VIEW IF EXISTS item_views; DROP TABLE IF EXISTS ${TABLES} CASCADE`);
  };
}
