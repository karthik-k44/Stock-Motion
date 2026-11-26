-- The activity log and the stock ledger are history: nothing may rewrite a row once written. The only update allowed
-- is the foreign key clearing `account_id` when an account is deleted (ON DELETE SET NULL). Deleting rows stays
-- possible: resetting a business and deleting one remove their history with them.
CREATE OR REPLACE FUNCTION forbid_history_update() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.account_id IS NULL AND (to_jsonb(NEW) - 'account_id') = (to_jsonb(OLD) - 'account_id') THEN
    RETURN NEW;
  END IF;
  RAISE EXCEPTION '% is append-only: history cannot be changed', TG_TABLE_NAME
    USING ERRCODE = 'insufficient_privilege';
END;
$$;
--> statement-breakpoint
DROP TRIGGER IF EXISTS activity_append_only ON activity;
--> statement-breakpoint
CREATE TRIGGER activity_append_only BEFORE UPDATE ON activity FOR EACH ROW EXECUTE FUNCTION forbid_history_update();
--> statement-breakpoint
DROP TRIGGER IF EXISTS movements_append_only ON movements;
--> statement-breakpoint
CREATE TRIGGER movements_append_only BEFORE UPDATE ON movements FOR EACH ROW EXECUTE FUNCTION forbid_history_update();
