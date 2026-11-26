-- Ids become a readable prefix and a number from the table's own sequence (db/schema/ids.ts): ACID100000 is the
-- first account. Existing rows are renumbered in the order they were created and every reference follows them,
-- including the assignee ids kept in activity details. Foreign keys are dropped while ids change and restored as
-- they were; the history tables' append-only triggers are paused for the same reason.
ALTER TABLE activity DISABLE TRIGGER activity_append_only;
--> statement-breakpoint
ALTER TABLE movements DISABLE TRIGGER movements_append_only;
--> statement-breakpoint
ALTER TABLE "refresh_tokens" DROP CONSTRAINT "refresh_tokens_account_id_fkey";
--> statement-breakpoint
ALTER TABLE "businesses" DROP CONSTRAINT "businesses_created_by_fkey";
--> statement-breakpoint
ALTER TABLE "invites" DROP CONSTRAINT "invites_business_id_fkey";
--> statement-breakpoint
ALTER TABLE "invites" DROP CONSTRAINT "invites_created_by_fkey";
--> statement-breakpoint
ALTER TABLE "invites" DROP CONSTRAINT "invites_accepted_by_fkey";
--> statement-breakpoint
ALTER TABLE "memberships" DROP CONSTRAINT "memberships_business_id_fkey";
--> statement-breakpoint
ALTER TABLE "memberships" DROP CONSTRAINT "memberships_account_id_fkey";
--> statement-breakpoint
ALTER TABLE "categories" DROP CONSTRAINT "categories_business_id_fkey";
--> statement-breakpoint
ALTER TABLE "customers" DROP CONSTRAINT "customers_business_id_fkey";
--> statement-breakpoint
ALTER TABLE "locations" DROP CONSTRAINT "locations_business_id_fkey";
--> statement-breakpoint
ALTER TABLE "suppliers" DROP CONSTRAINT "suppliers_business_id_fkey";
--> statement-breakpoint
ALTER TABLE "item_components" DROP CONSTRAINT "item_components_parent_id_fkey";
--> statement-breakpoint
ALTER TABLE "item_components" DROP CONSTRAINT "item_components_component_id_fkey";
--> statement-breakpoint
ALTER TABLE "items" DROP CONSTRAINT "items_business_id_fkey";
--> statement-breakpoint
ALTER TABLE "items" DROP CONSTRAINT "items_supplier_id_fkey";
--> statement-breakpoint
ALTER TABLE "items" DROP CONSTRAINT "items_business_id_location_fkey";
--> statement-breakpoint
ALTER TABLE "order_lines" DROP CONSTRAINT "order_lines_order_id_fkey";
--> statement-breakpoint
ALTER TABLE "order_lines" DROP CONSTRAINT "order_lines_item_id_fkey";
--> statement-breakpoint
ALTER TABLE "orders" DROP CONSTRAINT "orders_business_id_fkey";
--> statement-breakpoint
ALTER TABLE "orders" DROP CONSTRAINT "orders_customer_id_fkey";
--> statement-breakpoint
ALTER TABLE "orders" DROP CONSTRAINT "orders_assignee_id_fkey";
--> statement-breakpoint
ALTER TABLE "deliveries" DROP CONSTRAINT "deliveries_business_id_fkey";
--> statement-breakpoint
ALTER TABLE "deliveries" DROP CONSTRAINT "deliveries_supplier_id_fkey";
--> statement-breakpoint
ALTER TABLE "delivery_lines" DROP CONSTRAINT "delivery_lines_delivery_id_fkey";
--> statement-breakpoint
ALTER TABLE "delivery_lines" DROP CONSTRAINT "delivery_lines_item_id_fkey";
--> statement-breakpoint
ALTER TABLE "activity" DROP CONSTRAINT "activity_business_id_fkey";
--> statement-breakpoint
ALTER TABLE "activity" DROP CONSTRAINT "activity_account_id_fkey";
--> statement-breakpoint
ALTER TABLE "movements" DROP CONSTRAINT "movements_business_id_fkey";
--> statement-breakpoint
ALTER TABLE "movements" DROP CONSTRAINT "movements_item_id_fkey";
--> statement-breakpoint
ALTER TABLE "movements" DROP CONSTRAINT "movements_account_id_fkey";
--> statement-breakpoint
CREATE TEMP TABLE id_map_accounts ON COMMIT DROP AS
SELECT id::text AS old_id, 'ACID' || (99999 + row_number() OVER (ORDER BY created_at, id)) AS new_id FROM accounts;
--> statement-breakpoint
CREATE TEMP TABLE id_map_businesses ON COMMIT DROP AS
SELECT id::text AS old_id, 'BSID' || (99999 + row_number() OVER (ORDER BY created_at, id)) AS new_id FROM businesses;
--> statement-breakpoint
CREATE TEMP TABLE id_map_invites ON COMMIT DROP AS
SELECT id::text AS old_id, 'INID' || (99999 + row_number() OVER (ORDER BY created_at, id)) AS new_id FROM invites;
--> statement-breakpoint
CREATE TEMP TABLE id_map_suppliers ON COMMIT DROP AS
SELECT id::text AS old_id, 'SPID' || (99999 + row_number() OVER (ORDER BY created_at, id)) AS new_id FROM suppliers;
--> statement-breakpoint
CREATE TEMP TABLE id_map_customers ON COMMIT DROP AS
SELECT id::text AS old_id, 'CSID' || (99999 + row_number() OVER (ORDER BY created_at, id)) AS new_id FROM customers;
--> statement-breakpoint
CREATE TEMP TABLE id_map_items ON COMMIT DROP AS
SELECT id::text AS old_id, 'ITID' || (99999 + row_number() OVER (ORDER BY created_at, id)) AS new_id FROM items;
--> statement-breakpoint
CREATE TEMP TABLE id_map_orders ON COMMIT DROP AS
SELECT id::text AS old_id, 'ORID' || (99999 + row_number() OVER (ORDER BY created_at, id)) AS new_id FROM orders;
--> statement-breakpoint
CREATE TEMP TABLE id_map_deliveries ON COMMIT DROP AS
SELECT id::text AS old_id, 'DLID' || (99999 + row_number() OVER (ORDER BY created_at, id)) AS new_id FROM deliveries;
--> statement-breakpoint
CREATE TEMP TABLE id_map_movements ON COMMIT DROP AS
SELECT id::text AS old_id, 'MVID' || (99999 + row_number() OVER (ORDER BY at, id)) AS new_id FROM movements;
--> statement-breakpoint
CREATE TEMP TABLE id_map_activity ON COMMIT DROP AS
SELECT id::text AS old_id, 'ATID' || (99999 + row_number() OVER (ORDER BY at, id)) AS new_id FROM activity;
--> statement-breakpoint
ALTER TABLE movements ALTER COLUMN id DROP DEFAULT;
--> statement-breakpoint
ALTER TABLE movements ALTER COLUMN id SET DATA TYPE text USING id::text;
--> statement-breakpoint
DROP SEQUENCE IF EXISTS movements_id_seq;
--> statement-breakpoint
ALTER TABLE activity ALTER COLUMN id DROP DEFAULT;
--> statement-breakpoint
ALTER TABLE activity ALTER COLUMN id SET DATA TYPE text USING id::text;
--> statement-breakpoint
DROP SEQUENCE IF EXISTS activity_id_seq;
--> statement-breakpoint
UPDATE accounts SET id = m.new_id FROM id_map_accounts m WHERE accounts.id = m.old_id;
--> statement-breakpoint
UPDATE refresh_tokens SET account_id = m.new_id FROM id_map_accounts m WHERE refresh_tokens.account_id = m.old_id;
--> statement-breakpoint
UPDATE businesses SET created_by = m.new_id FROM id_map_accounts m WHERE businesses.created_by = m.old_id;
--> statement-breakpoint
UPDATE memberships SET account_id = m.new_id FROM id_map_accounts m WHERE memberships.account_id = m.old_id;
--> statement-breakpoint
UPDATE invites SET created_by = m.new_id FROM id_map_accounts m WHERE invites.created_by = m.old_id;
--> statement-breakpoint
UPDATE invites SET accepted_by = m.new_id FROM id_map_accounts m WHERE invites.accepted_by = m.old_id;
--> statement-breakpoint
UPDATE orders SET assignee_id = m.new_id FROM id_map_accounts m WHERE orders.assignee_id = m.old_id;
--> statement-breakpoint
UPDATE movements SET account_id = m.new_id FROM id_map_accounts m WHERE movements.account_id = m.old_id;
--> statement-breakpoint
UPDATE activity SET account_id = m.new_id FROM id_map_accounts m WHERE activity.account_id = m.old_id;
--> statement-breakpoint
UPDATE businesses SET id = m.new_id FROM id_map_businesses m WHERE businesses.id = m.old_id;
--> statement-breakpoint
UPDATE memberships SET business_id = m.new_id FROM id_map_businesses m WHERE memberships.business_id = m.old_id;
--> statement-breakpoint
UPDATE invites SET business_id = m.new_id FROM id_map_businesses m WHERE invites.business_id = m.old_id;
--> statement-breakpoint
UPDATE locations SET business_id = m.new_id FROM id_map_businesses m WHERE locations.business_id = m.old_id;
--> statement-breakpoint
UPDATE categories SET business_id = m.new_id FROM id_map_businesses m WHERE categories.business_id = m.old_id;
--> statement-breakpoint
UPDATE suppliers SET business_id = m.new_id FROM id_map_businesses m WHERE suppliers.business_id = m.old_id;
--> statement-breakpoint
UPDATE customers SET business_id = m.new_id FROM id_map_businesses m WHERE customers.business_id = m.old_id;
--> statement-breakpoint
UPDATE items SET business_id = m.new_id FROM id_map_businesses m WHERE items.business_id = m.old_id;
--> statement-breakpoint
UPDATE orders SET business_id = m.new_id FROM id_map_businesses m WHERE orders.business_id = m.old_id;
--> statement-breakpoint
UPDATE deliveries SET business_id = m.new_id FROM id_map_businesses m WHERE deliveries.business_id = m.old_id;
--> statement-breakpoint
UPDATE movements SET business_id = m.new_id FROM id_map_businesses m WHERE movements.business_id = m.old_id;
--> statement-breakpoint
UPDATE activity SET business_id = m.new_id FROM id_map_businesses m WHERE activity.business_id = m.old_id;
--> statement-breakpoint
UPDATE invites SET id = m.new_id FROM id_map_invites m WHERE invites.id = m.old_id;
--> statement-breakpoint
UPDATE suppliers SET id = m.new_id FROM id_map_suppliers m WHERE suppliers.id = m.old_id;
--> statement-breakpoint
UPDATE items SET supplier_id = m.new_id FROM id_map_suppliers m WHERE items.supplier_id = m.old_id;
--> statement-breakpoint
UPDATE deliveries SET supplier_id = m.new_id FROM id_map_suppliers m WHERE deliveries.supplier_id = m.old_id;
--> statement-breakpoint
UPDATE customers SET id = m.new_id FROM id_map_customers m WHERE customers.id = m.old_id;
--> statement-breakpoint
UPDATE orders SET customer_id = m.new_id FROM id_map_customers m WHERE orders.customer_id = m.old_id;
--> statement-breakpoint
UPDATE items SET id = m.new_id FROM id_map_items m WHERE items.id = m.old_id;
--> statement-breakpoint
UPDATE item_components SET parent_id = m.new_id FROM id_map_items m WHERE item_components.parent_id = m.old_id;
--> statement-breakpoint
UPDATE item_components SET component_id = m.new_id FROM id_map_items m WHERE item_components.component_id = m.old_id;
--> statement-breakpoint
UPDATE order_lines SET item_id = m.new_id FROM id_map_items m WHERE order_lines.item_id = m.old_id;
--> statement-breakpoint
UPDATE delivery_lines SET item_id = m.new_id FROM id_map_items m WHERE delivery_lines.item_id = m.old_id;
--> statement-breakpoint
UPDATE movements SET item_id = m.new_id FROM id_map_items m WHERE movements.item_id = m.old_id;
--> statement-breakpoint
UPDATE orders SET id = m.new_id FROM id_map_orders m WHERE orders.id = m.old_id;
--> statement-breakpoint
UPDATE order_lines SET order_id = m.new_id FROM id_map_orders m WHERE order_lines.order_id = m.old_id;
--> statement-breakpoint
UPDATE deliveries SET id = m.new_id FROM id_map_deliveries m WHERE deliveries.id = m.old_id;
--> statement-breakpoint
UPDATE delivery_lines SET delivery_id = m.new_id FROM id_map_deliveries m WHERE delivery_lines.delivery_id = m.old_id;
--> statement-breakpoint
UPDATE movements SET id = m.new_id FROM id_map_movements m WHERE movements.id = m.old_id;
--> statement-breakpoint
UPDATE activity SET id = m.new_id FROM id_map_activity m WHERE activity.id = m.old_id;
--> statement-breakpoint
UPDATE activity SET meta = jsonb_set(meta, '{assignee}', to_jsonb(m.new_id)) FROM id_map_accounts m WHERE activity.meta->>'assignee' = m.old_id;
--> statement-breakpoint
UPDATE activity SET ref_id = m.new_id FROM id_map_customers m WHERE activity.ref_type = 'CUSTOMER' AND activity.ref_id = m.old_id;
--> statement-breakpoint
UPDATE activity SET ref_id = m.new_id FROM id_map_suppliers m WHERE activity.ref_type = 'SUPPLIER' AND activity.ref_id = m.old_id;
--> statement-breakpoint
CREATE SEQUENCE "public"."accounts_id_seq" INCREMENT BY 1 MINVALUE 100000 MAXVALUE 9223372036854775807 START WITH 100000 CACHE 1;
--> statement-breakpoint
SELECT setval('accounts_id_seq', 100000 + (SELECT count(*) FROM id_map_accounts), false);
--> statement-breakpoint
ALTER TABLE "accounts" ALTER COLUMN "id" SET DEFAULT 'ACID' || nextval('accounts_id_seq');
--> statement-breakpoint
CREATE SEQUENCE "public"."businesses_id_seq" INCREMENT BY 1 MINVALUE 100000 MAXVALUE 9223372036854775807 START WITH 100000 CACHE 1;
--> statement-breakpoint
SELECT setval('businesses_id_seq', 100000 + (SELECT count(*) FROM id_map_businesses), false);
--> statement-breakpoint
ALTER TABLE "businesses" ALTER COLUMN "id" SET DEFAULT 'BSID' || nextval('businesses_id_seq');
--> statement-breakpoint
CREATE SEQUENCE "public"."invites_id_seq" INCREMENT BY 1 MINVALUE 100000 MAXVALUE 9223372036854775807 START WITH 100000 CACHE 1;
--> statement-breakpoint
SELECT setval('invites_id_seq', 100000 + (SELECT count(*) FROM id_map_invites), false);
--> statement-breakpoint
ALTER TABLE "invites" ALTER COLUMN "id" SET DEFAULT 'INID' || nextval('invites_id_seq');
--> statement-breakpoint
CREATE SEQUENCE "public"."suppliers_id_seq" INCREMENT BY 1 MINVALUE 100000 MAXVALUE 9223372036854775807 START WITH 100000 CACHE 1;
--> statement-breakpoint
SELECT setval('suppliers_id_seq', 100000 + (SELECT count(*) FROM id_map_suppliers), false);
--> statement-breakpoint
ALTER TABLE "suppliers" ALTER COLUMN "id" SET DEFAULT 'SPID' || nextval('suppliers_id_seq');
--> statement-breakpoint
CREATE SEQUENCE "public"."customers_id_seq" INCREMENT BY 1 MINVALUE 100000 MAXVALUE 9223372036854775807 START WITH 100000 CACHE 1;
--> statement-breakpoint
SELECT setval('customers_id_seq', 100000 + (SELECT count(*) FROM id_map_customers), false);
--> statement-breakpoint
ALTER TABLE "customers" ALTER COLUMN "id" SET DEFAULT 'CSID' || nextval('customers_id_seq');
--> statement-breakpoint
CREATE SEQUENCE "public"."items_id_seq" INCREMENT BY 1 MINVALUE 100000 MAXVALUE 9223372036854775807 START WITH 100000 CACHE 1;
--> statement-breakpoint
SELECT setval('items_id_seq', 100000 + (SELECT count(*) FROM id_map_items), false);
--> statement-breakpoint
ALTER TABLE "items" ALTER COLUMN "id" SET DEFAULT 'ITID' || nextval('items_id_seq');
--> statement-breakpoint
CREATE SEQUENCE "public"."orders_id_seq" INCREMENT BY 1 MINVALUE 100000 MAXVALUE 9223372036854775807 START WITH 100000 CACHE 1;
--> statement-breakpoint
SELECT setval('orders_id_seq', 100000 + (SELECT count(*) FROM id_map_orders), false);
--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "id" SET DEFAULT 'ORID' || nextval('orders_id_seq');
--> statement-breakpoint
CREATE SEQUENCE "public"."deliveries_id_seq" INCREMENT BY 1 MINVALUE 100000 MAXVALUE 9223372036854775807 START WITH 100000 CACHE 1;
--> statement-breakpoint
SELECT setval('deliveries_id_seq', 100000 + (SELECT count(*) FROM id_map_deliveries), false);
--> statement-breakpoint
ALTER TABLE "deliveries" ALTER COLUMN "id" SET DEFAULT 'DLID' || nextval('deliveries_id_seq');
--> statement-breakpoint
CREATE SEQUENCE "public"."movements_id_seq" INCREMENT BY 1 MINVALUE 100000 MAXVALUE 9223372036854775807 START WITH 100000 CACHE 1;
--> statement-breakpoint
SELECT setval('movements_id_seq', 100000 + (SELECT count(*) FROM id_map_movements), false);
--> statement-breakpoint
ALTER TABLE "movements" ALTER COLUMN "id" SET DEFAULT 'MVID' || nextval('movements_id_seq');
--> statement-breakpoint
CREATE SEQUENCE "public"."activity_id_seq" INCREMENT BY 1 MINVALUE 100000 MAXVALUE 9223372036854775807 START WITH 100000 CACHE 1;
--> statement-breakpoint
SELECT setval('activity_id_seq', 100000 + (SELECT count(*) FROM id_map_activity), false);
--> statement-breakpoint
ALTER TABLE "activity" ALTER COLUMN "id" SET DEFAULT 'ATID' || nextval('activity_id_seq');
--> statement-breakpoint
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "businesses" ADD CONSTRAINT "businesses_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."accounts"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "invites" ADD CONSTRAINT "invites_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "invites" ADD CONSTRAINT "invites_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."accounts"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "invites" ADD CONSTRAINT "invites_accepted_by_fkey" FOREIGN KEY ("accepted_by") REFERENCES "public"."accounts"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "categories" ADD CONSTRAINT "categories_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "customers" ADD CONSTRAINT "customers_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "locations" ADD CONSTRAINT "locations_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "suppliers" ADD CONSTRAINT "suppliers_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "item_components" ADD CONSTRAINT "item_components_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "public"."items"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "item_components" ADD CONSTRAINT "item_components_component_id_fkey" FOREIGN KEY ("component_id") REFERENCES "public"."items"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "items" ADD CONSTRAINT "items_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "items" ADD CONSTRAINT "items_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "items" ADD CONSTRAINT "items_business_id_location_fkey" FOREIGN KEY ("business_id","location") REFERENCES "public"."locations"("business_id","code") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "order_lines" ADD CONSTRAINT "order_lines_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "order_lines" ADD CONSTRAINT "order_lines_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_assignee_id_fkey" FOREIGN KEY ("assignee_id") REFERENCES "public"."accounts"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "deliveries" ADD CONSTRAINT "deliveries_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "deliveries" ADD CONSTRAINT "deliveries_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "delivery_lines" ADD CONSTRAINT "delivery_lines_delivery_id_fkey" FOREIGN KEY ("delivery_id") REFERENCES "public"."deliveries"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "delivery_lines" ADD CONSTRAINT "delivery_lines_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "activity" ADD CONSTRAINT "activity_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "activity" ADD CONSTRAINT "activity_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "movements" ADD CONSTRAINT "movements_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "movements" ADD CONSTRAINT "movements_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "movements" ADD CONSTRAINT "movements_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE activity ENABLE TRIGGER activity_append_only;
--> statement-breakpoint
ALTER TABLE movements ENABLE TRIGGER movements_append_only;
