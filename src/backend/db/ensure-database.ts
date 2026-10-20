import pg from 'pg';
import { logger } from '@/backend/config/logger';

/** The connection URL with the password masked, safe for logs. */
export const RedactUrl = (url: string): string => {
  try {
    const u = new URL(url);
    if (u.password) u.password = '****';
    return u.toString();
  } catch {
    return '<invalid DATABASE_URL>';
  }
};

const explain = (err: unknown, url: string): Error => {
  const e = err as { code?: string; message?: string };
  const u = new URL(url);
  const where = `${u.hostname}:${u.port || 5432}`;
  switch (e.code) {
    case '28P01':
      return new Error(`Postgres rejected the password for user "${decodeURIComponent(u.username)}". Fix DATABASE_URL in .env.`);
    case '28000':
      return new Error(`Postgres refused user "${decodeURIComponent(u.username)}" (check pg_hba.conf or the user name in DATABASE_URL).`);
    case 'ECONNREFUSED':
      return new Error(`Nothing is accepting connections at ${where}. Is the PostgreSQL service running?`);
    case 'ENOTFOUND':
      return new Error(`Unknown database host "${u.hostname}" in DATABASE_URL.`);
    default:
      return new Error(`Could not connect to ${RedactUrl(url)}: ${e.message ?? String(err)}`);
  }
};

const quoteIdent = (name: string) => `"${name.replace(/"/g, '""')}"`;

/**
 * Make sure the database named in DATABASE_URL exists, creating it on first
 * run (connects to the `postgres` maintenance database to do so).
 */
export const EnsureDatabase = async (url: string): Promise<void> => {
  const probe = new pg.Client({ connectionString: url });
  try {
    await probe.connect();
    await probe.end();
    return;
  } catch (err) {
    await probe.end().catch(() => undefined);
    if ((err as { code?: string }).code !== '3D000') throw explain(err, url);
  }

  const target = new URL(url);
  const name = decodeURIComponent(target.pathname.replace(/^\//, ''));
  if (!name) throw new Error('DATABASE_URL must include a database name, e.g. postgres://user:pass@localhost:5432/stockmotion');
  target.pathname = '/postgres';
  const admin = new pg.Client({ connectionString: target.toString() });
  try {
    await admin.connect();
    await admin.query(`CREATE DATABASE ${quoteIdent(name)}`);
    logger.info(`Created database "${name}"`);
  } catch (err) {
    throw explain(err, url);
  } finally {
    await admin.end().catch(() => undefined);
  }
};
