-- Every fixed set of values becomes a PostgreSQL enum type (db/schema/enums.ts, built from backend/types):
-- plans, subscription and delivery statuses, order stages, item kinds, movement and activity kinds, business types.
-- Their CHECK lists go, since the type now enforces the values. The stock view reads some of these columns, so it is
-- dropped while they change and created again, unchanged.
CREATE TYPE "public"."activity_kind" AS ENUM('DELIVERY', 'ADJUSTMENT', 'ALLOCATION', 'CONSUME', 'STATUS', 'RELOCATION', 'CATALOG', 'TEAM', 'SYSTEM');
--> statement-breakpoint
CREATE TYPE "public"."activity_ref_type" AS ENUM('ORDER', 'DELIVERY', 'ITEM', 'CUSTOMER', 'SUPPLIER');
--> statement-breakpoint
CREATE TYPE "public"."billing_provider" AS ENUM('TRIAL', 'MANUAL', 'RAZORPAY');
--> statement-breakpoint
CREATE TYPE "public"."business_type" AS ENUM('RETAIL', 'CAFE', 'TRADES');
--> statement-breakpoint
CREATE TYPE "public"."delivery_status" AS ENUM('SCHEDULED', 'IN_TRANSIT', 'ARRIVED', 'RECEIVED');
--> statement-breakpoint
CREATE TYPE "public"."item_kind" AS ENUM('STOCK', 'MADE', 'SERVICE');
--> statement-breakpoint
CREATE TYPE "public"."movement_type" AS ENUM('RECEIPT', 'CONSUME', 'ADJUSTMENT', 'RELOCATION');
--> statement-breakpoint
CREATE TYPE "public"."order_status" AS ENUM('NEW', 'PICKING', 'PACKED', 'SHIPPED', 'PREPARING', 'SERVED', 'QUOTED', 'SCHEDULED', 'IN_PROGRESS', 'DONE', 'CANCELLED');
--> statement-breakpoint
CREATE TYPE "public"."subscription_plan" AS ENUM('TRIAL', 'STARTER', 'PRO', 'SCALE');
--> statement-breakpoint
CREATE TYPE "public"."subscription_status" AS ENUM('TRIALING', 'ACTIVE', 'PAST_DUE', 'CANCELLED', 'EXPIRED');
--> statement-breakpoint
ALTER TABLE "businesses" DROP CONSTRAINT "businesses_type_check";
--> statement-breakpoint
ALTER TABLE "items" DROP CONSTRAINT "items_kind_check";
--> statement-breakpoint
ALTER TABLE "deliveries" DROP CONSTRAINT "deliveries_status_check";
--> statement-breakpoint
ALTER TABLE "activity" DROP CONSTRAINT "activity_kind_check";
--> statement-breakpoint
ALTER TABLE "activity" DROP CONSTRAINT "activity_ref_type_check";
--> statement-breakpoint
ALTER TABLE "movements" DROP CONSTRAINT "movements_type_check";
--> statement-breakpoint
ALTER TABLE "subscriptions" DROP CONSTRAINT "subscriptions_plan_check";
--> statement-breakpoint
ALTER TABLE "subscriptions" DROP CONSTRAINT "subscriptions_status_check";
--> statement-breakpoint
ALTER TABLE "subscriptions" DROP CONSTRAINT "subscriptions_provider_check";
--> statement-breakpoint
DROP VIEW IF EXISTS item_views;
--> statement-breakpoint
ALTER TABLE "items" ALTER COLUMN "kind" DROP DEFAULT;
--> statement-breakpoint
ALTER TABLE "businesses" ALTER COLUMN "type" SET DATA TYPE "public"."business_type" USING "type"::"public"."business_type";
--> statement-breakpoint
ALTER TABLE "items" ALTER COLUMN "kind" SET DATA TYPE "public"."item_kind" USING "kind"::"public"."item_kind";
--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "status" SET DATA TYPE "public"."order_status" USING "status"::"public"."order_status";
--> statement-breakpoint
ALTER TABLE "deliveries" ALTER COLUMN "status" SET DATA TYPE "public"."delivery_status" USING "status"::"public"."delivery_status";
--> statement-breakpoint
ALTER TABLE "activity" ALTER COLUMN "kind" SET DATA TYPE "public"."activity_kind" USING "kind"::"public"."activity_kind";
--> statement-breakpoint
ALTER TABLE "activity" ALTER COLUMN "ref_type" SET DATA TYPE "public"."activity_ref_type" USING "ref_type"::"public"."activity_ref_type";
--> statement-breakpoint
ALTER TABLE "movements" ALTER COLUMN "type" SET DATA TYPE "public"."movement_type" USING "type"::"public"."movement_type";
--> statement-breakpoint
ALTER TABLE "razorpay_plans" ALTER COLUMN "plan" SET DATA TYPE "public"."subscription_plan" USING "plan"::"public"."subscription_plan";
--> statement-breakpoint
ALTER TABLE "subscriptions" ALTER COLUMN "plan" SET DATA TYPE "public"."subscription_plan" USING "plan"::"public"."subscription_plan";
--> statement-breakpoint
ALTER TABLE "subscriptions" ALTER COLUMN "status" SET DATA TYPE "public"."subscription_status" USING "status"::"public"."subscription_status";
--> statement-breakpoint
ALTER TABLE "subscriptions" ALTER COLUMN "provider" SET DATA TYPE "public"."billing_provider" USING "provider"::"public"."billing_provider";
--> statement-breakpoint
ALTER TABLE "subscriptions" ALTER COLUMN "pending_plan" SET DATA TYPE "public"."subscription_plan" USING "pending_plan"::"public"."subscription_plan";
--> statement-breakpoint
ALTER TABLE "items" ALTER COLUMN "kind" SET DEFAULT 'STOCK'::"public"."item_kind";
--> statement-breakpoint
-- reserved: open quantity on orders in a reserving stage. A MADE line reserves its components.
-- incoming: expected quantity on deliveries not yet received.
-- available: on hand − reserved for stock items; for MADE items, how many can be made right now.
-- SERVICE items are always IN_STOCK.
CREATE OR REPLACE VIEW item_views AS
WITH reserved AS (
  SELECT COALESCE(c.component_id, ol.item_id) AS item_id,
         SUM((ol.qty - ol.done) * COALESCE(c.qty, 1)) AS reserved
  FROM order_lines ol
  JOIN orders o ON o.id = ol.order_id
  JOIN items li ON li.id = ol.item_id
  LEFT JOIN item_components c ON c.parent_id = ol.item_id
  WHERE o.reserves AND (c.component_id IS NOT NULL OR li.kind = 'STOCK')
  GROUP BY 1
),
incoming AS (
  SELECT dl.item_id, SUM(dl.expected) AS incoming
  FROM delivery_lines dl JOIN deliveries d ON d.id = dl.delivery_id
  WHERE d.status <> 'RECEIVED'
  GROUP BY dl.item_id
),
stock AS (
  SELECT i.*,
         COALESCE(r.reserved, 0)::int AS reserved,
         COALESCE(inc.incoming, 0)::int AS incoming,
         GREATEST(i.on_hand - COALESCE(r.reserved, 0), 0)::int AS stock_available
  FROM items i
  LEFT JOIN reserved r ON r.item_id = i.id
  LEFT JOIN incoming inc ON inc.item_id = i.id
),
made AS (
  SELECT c.parent_id, MIN(s.stock_available / c.qty)::int AS can_make
  FROM item_components c JOIN stock s ON s.id = c.component_id
  GROUP BY c.parent_id
)
SELECT
  s.id, s.business_id, s.sku, s.name, s.category, s.unit, s.kind, s.on_hand, s.reorder_level,
  s.cost, s.price, s.location, s.supplier_id, s.reserved, s.incoming,
  CASE WHEN s.kind = 'MADE' THEN COALESCE(m.can_make, 0) ELSE s.stock_available END AS available,
  CASE
    WHEN s.kind = 'SERVICE' THEN 'IN_STOCK'
    WHEN s.kind = 'MADE' THEN
      CASE WHEN COALESCE(m.can_make, 0) = 0 THEN 'OUT' WHEN m.can_make <= s.reorder_level THEN 'LOW' ELSE 'IN_STOCK' END
    WHEN s.on_hand <= 0 THEN 'OUT'
    WHEN s.stock_available <= s.reorder_level THEN 'LOW'
    ELSE 'IN_STOCK'
  END AS status
FROM stock s
LEFT JOIN made m ON m.parent_id = s.id
WHERE s.archived_at IS NULL;
