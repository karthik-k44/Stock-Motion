-- Sample data now lives only in the shared demo account (sampledata@gmail.com, created on its first sign-in), so it is
-- removed everywhere else. A business whose latest setup or reset loaded sample data has its data cleared, as
-- Settings → reset would: products, orders, deliveries, customers, suppliers and history go; the business, its team,
-- invites, storage locations and categories stay. The old development demo login and its businesses are deleted.
CREATE TEMP TABLE old_demo_businesses ON COMMIT DROP AS
SELECT id FROM businesses WHERE created_by IN (SELECT id FROM accounts WHERE email = 'demo@stockmotion.local');
--> statement-breakpoint
CREATE TEMP TABLE sample_businesses ON COMMIT DROP AS
SELECT business_id AS id FROM (
  SELECT DISTINCT ON (business_id) business_id, message
  FROM activity
  WHERE kind = 'SYSTEM' AND message LIKE 'Set up % as a %'
  ORDER BY business_id, at DESC, id DESC
) latest
WHERE message LIKE '% with sample data' AND business_id NOT IN (SELECT id FROM old_demo_businesses);
--> statement-breakpoint
CREATE TEMP TABLE cleared_businesses ON COMMIT DROP AS
SELECT id FROM sample_businesses UNION SELECT id FROM old_demo_businesses;
--> statement-breakpoint
DELETE FROM item_components WHERE parent_id IN (SELECT id FROM items WHERE business_id IN (SELECT id FROM cleared_businesses));
--> statement-breakpoint
DELETE FROM order_lines WHERE order_id IN (SELECT id FROM orders WHERE business_id IN (SELECT id FROM cleared_businesses));
--> statement-breakpoint
DELETE FROM delivery_lines WHERE delivery_id IN (SELECT id FROM deliveries WHERE business_id IN (SELECT id FROM cleared_businesses));
--> statement-breakpoint
DELETE FROM activity WHERE business_id IN (SELECT id FROM cleared_businesses);
--> statement-breakpoint
DELETE FROM movements WHERE business_id IN (SELECT id FROM cleared_businesses);
--> statement-breakpoint
DELETE FROM deliveries WHERE business_id IN (SELECT id FROM cleared_businesses);
--> statement-breakpoint
DELETE FROM orders WHERE business_id IN (SELECT id FROM cleared_businesses);
--> statement-breakpoint
DELETE FROM items WHERE business_id IN (SELECT id FROM cleared_businesses);
--> statement-breakpoint
DELETE FROM customers WHERE business_id IN (SELECT id FROM cleared_businesses);
--> statement-breakpoint
DELETE FROM suppliers WHERE business_id IN (SELECT id FROM cleared_businesses);
--> statement-breakpoint
DELETE FROM businesses WHERE id IN (SELECT id FROM old_demo_businesses);
--> statement-breakpoint
DELETE FROM accounts WHERE email = 'demo@stockmotion.local';
--> statement-breakpoint
INSERT INTO activity (business_id, kind, account_id, message)
SELECT id, 'SYSTEM', NULL, 'Removed the sample data — explore it any time in the demo account (sampledata@gmail.com)'
FROM sample_businesses;
--> statement-breakpoint
DROP TABLE IF EXISTS typeorm_migrations;
