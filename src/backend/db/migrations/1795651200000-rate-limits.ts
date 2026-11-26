import type { MigrationInterface, QueryRunner } from 'typeorm';

/** Rate-limit counters shared by every server instance, so sign-in attempts can't be spread across instances. */
export class RateLimits1795651200000 implements MigrationInterface {
  name = 'RateLimits1795651200000';

  up = async (qr: QueryRunner): Promise<void> => {
    await qr.query(`
      CREATE TABLE rate_limits (
        key       TEXT PRIMARY KEY,
        count     INT NOT NULL,
        reset_at  TIMESTAMPTZ NOT NULL
      );
      CREATE INDEX rate_limits_reset_at_idx ON rate_limits (reset_at);
    `);
  };

  down = async (qr: QueryRunner): Promise<void> => {
    await qr.query(`DROP TABLE IF EXISTS rate_limits;`);
  };
}
