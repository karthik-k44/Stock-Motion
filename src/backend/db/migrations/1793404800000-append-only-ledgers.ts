import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * The activity log and the stock ledger are history: nothing may rewrite a row once written. The only update
 * allowed is the foreign key clearing `account_id` when an account is deleted (ON DELETE SET NULL). Deleting
 * rows stays possible — an owner's "reset data" and deleting a business remove their history with them.
 */
export class AppendOnlyLedgers1793404800000 implements MigrationInterface {
  name = 'AppendOnlyLedgers1793404800000';

  up = async (qr: QueryRunner): Promise<void> => {
    await qr.query(`
      CREATE FUNCTION forbid_history_update() RETURNS trigger LANGUAGE plpgsql AS $$
      BEGIN
        IF NEW.account_id IS NULL AND (to_jsonb(NEW) - 'account_id') = (to_jsonb(OLD) - 'account_id') THEN
          RETURN NEW;
        END IF;
        RAISE EXCEPTION '% is append-only: history cannot be changed', TG_TABLE_NAME
          USING ERRCODE = 'insufficient_privilege';
      END;
      $$;
      CREATE TRIGGER activity_append_only BEFORE UPDATE ON activity FOR EACH ROW EXECUTE FUNCTION forbid_history_update();
      CREATE TRIGGER movements_append_only BEFORE UPDATE ON movements FOR EACH ROW EXECUTE FUNCTION forbid_history_update();
    `);
  };

  down = async (qr: QueryRunner): Promise<void> => {
    await qr.query(`
      DROP TRIGGER IF EXISTS activity_append_only ON activity;
      DROP TRIGGER IF EXISTS movements_append_only ON movements;
      DROP FUNCTION IF EXISTS forbid_history_update();
    `);
  };
}
