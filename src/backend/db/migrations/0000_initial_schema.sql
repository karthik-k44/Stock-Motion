-- The schema as the TypeORM migrations left it. Written so it also runs on those databases: anything that
-- already exists is skipped, so they are simply recorded as migrated.
CREATE TABLE IF NOT EXISTS "accounts" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL,
	"email" text NOT NULL,
	"name" text NOT NULL,
	"password_hash" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "accounts_email_key" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "refresh_tokens" (
	"token_hash" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "businesses" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"currency" text DEFAULT 'USD' NOT NULL,
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "businesses_type_check" CHECK ("businesses"."type" IN ('RETAIL','CAFE','TRADES'))
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "invites" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL,
	"token_hash" text NOT NULL,
	"business_id" text NOT NULL,
	"role" text NOT NULL,
	"created_by" text,
	"expires_at" timestamp with time zone NOT NULL,
	"accepted_at" timestamp with time zone,
	"accepted_by" text,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "invites_token_hash_key" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "memberships" (
	"business_id" text NOT NULL,
	"account_id" text NOT NULL,
	"role" text NOT NULL,
	"color" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "memberships_pkey" PRIMARY KEY("business_id","account_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "categories" (
	"business_id" text NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "categories_pkey" PRIMARY KEY("business_id","code")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "customers" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL,
	"business_id" text NOT NULL,
	"name" text NOT NULL,
	"email" text DEFAULT '' NOT NULL,
	"phone" text DEFAULT '' NOT NULL,
	"address" text DEFAULT '' NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "locations" (
	"business_id" text NOT NULL,
	"code" text NOT NULL,
	"zone" text NOT NULL,
	"name" text NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "locations_pkey" PRIMARY KEY("business_id","code")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "suppliers" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL,
	"business_id" text NOT NULL,
	"name" text NOT NULL,
	"contact" text DEFAULT '' NOT NULL,
	"email" text DEFAULT '' NOT NULL,
	"phone" text DEFAULT '' NOT NULL,
	"lead_days" integer DEFAULT 2 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "suppliers_business_id_name_key" UNIQUE("business_id","name"),
	CONSTRAINT "suppliers_lead_days_check" CHECK ("suppliers"."lead_days" >= 0)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "item_components" (
	"parent_id" text NOT NULL,
	"component_id" text NOT NULL,
	"qty" integer NOT NULL,
	CONSTRAINT "item_components_pkey" PRIMARY KEY("parent_id","component_id"),
	CONSTRAINT "item_components_qty_check" CHECK ("item_components"."qty" > 0),
	CONSTRAINT "item_components_check" CHECK ("item_components"."parent_id" <> "item_components"."component_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "items" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL,
	"business_id" text NOT NULL,
	"sku" text NOT NULL,
	"name" text NOT NULL,
	"category" text NOT NULL,
	"unit" text NOT NULL,
	"kind" text DEFAULT 'STOCK' NOT NULL,
	"on_hand" integer DEFAULT 0 NOT NULL,
	"reorder_level" integer DEFAULT 0 NOT NULL,
	"cost" numeric(12, 4) DEFAULT 0 NOT NULL,
	"price" numeric(12, 2) DEFAULT 0 NOT NULL,
	"location" text,
	"supplier_id" text,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "items_business_id_sku_key" UNIQUE("business_id","sku"),
	CONSTRAINT "items_kind_check" CHECK ("items"."kind" IN ('STOCK','MADE','SERVICE')),
	CONSTRAINT "items_on_hand_check" CHECK ("items"."on_hand" >= 0),
	CONSTRAINT "items_reorder_level_check" CHECK ("items"."reorder_level" >= 0),
	CONSTRAINT "items_cost_check" CHECK ("items"."cost" >= 0),
	CONSTRAINT "items_price_check" CHECK ("items"."price" >= 0)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "order_lines" (
	"order_id" text NOT NULL,
	"item_id" text NOT NULL,
	"position" integer NOT NULL,
	"qty" integer NOT NULL,
	"done" integer DEFAULT 0 NOT NULL,
	"unit_price" numeric(12, 2) DEFAULT 0 NOT NULL,
	CONSTRAINT "order_lines_pkey" PRIMARY KEY("order_id","item_id"),
	CONSTRAINT "order_lines_qty_check" CHECK ("order_lines"."qty" > 0),
	CONSTRAINT "order_lines_check" CHECK ("order_lines"."done" >= 0 AND "order_lines"."done" <= "order_lines"."qty"),
	CONSTRAINT "order_lines_unit_price_check" CHECK ("order_lines"."unit_price" >= 0)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "orders" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL,
	"business_id" text NOT NULL,
	"number" text NOT NULL,
	"customer_id" text,
	"customer_name" text NOT NULL,
	"status" text NOT NULL,
	"reserves" boolean DEFAULT false NOT NULL,
	"closed" boolean DEFAULT false NOT NULL,
	"cancelled" boolean DEFAULT false NOT NULL,
	"due_at" timestamp with time zone,
	"assignee_id" text,
	"notes" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"closed_at" timestamp with time zone,
	CONSTRAINT "orders_business_id_number_key" UNIQUE("business_id","number")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "deliveries" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL,
	"business_id" text NOT NULL,
	"number" text NOT NULL,
	"supplier_id" text,
	"supplier_name" text NOT NULL,
	"vehicle" text DEFAULT '' NOT NULL,
	"reference" text DEFAULT '' NOT NULL,
	"expected_at" timestamp with time zone NOT NULL,
	"received_at" timestamp with time zone,
	"status" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "deliveries_business_id_number_key" UNIQUE("business_id","number"),
	CONSTRAINT "deliveries_status_check" CHECK ("deliveries"."status" IN ('SCHEDULED','IN_TRANSIT','ARRIVED','RECEIVED'))
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "delivery_lines" (
	"delivery_id" text NOT NULL,
	"item_id" text NOT NULL,
	"position" integer NOT NULL,
	"expected" integer NOT NULL,
	"received" integer,
	"unit_cost" numeric(12, 4) DEFAULT 0 NOT NULL,
	CONSTRAINT "delivery_lines_pkey" PRIMARY KEY("delivery_id","item_id"),
	CONSTRAINT "delivery_lines_expected_check" CHECK ("delivery_lines"."expected" > 0),
	CONSTRAINT "delivery_lines_received_check" CHECK ("delivery_lines"."received" >= 0),
	CONSTRAINT "delivery_lines_unit_cost_check" CHECK ("delivery_lines"."unit_cost" >= 0)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "activity" (
	"id" serial PRIMARY KEY NOT NULL,
	"business_id" text NOT NULL,
	"at" timestamp with time zone DEFAULT now() NOT NULL,
	"kind" text NOT NULL,
	"account_id" text,
	"message" text NOT NULL,
	"ref_type" text,
	"ref_id" text,
	"meta" jsonb DEFAULT '{}'::jsonb NOT NULL,
	CONSTRAINT "activity_kind_check" CHECK ("activity"."kind" IN ('DELIVERY','ADJUSTMENT','ALLOCATION','CONSUME','STATUS','RELOCATION','CATALOG','TEAM','SYSTEM')),
	CONSTRAINT "activity_ref_type_check" CHECK ("activity"."ref_type" IN ('ORDER','DELIVERY','ITEM','CUSTOMER','SUPPLIER'))
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "movements" (
	"id" serial PRIMARY KEY NOT NULL,
	"business_id" text NOT NULL,
	"at" timestamp with time zone DEFAULT now() NOT NULL,
	"item_id" text NOT NULL,
	"type" text NOT NULL,
	"delta" integer NOT NULL,
	"balance" integer NOT NULL,
	"ref" text,
	"account_id" text,
	"note" text DEFAULT '' NOT NULL,
	CONSTRAINT "movements_type_check" CHECK ("movements"."type" IN ('RECEIPT','CONSUME','ADJUSTMENT','RELOCATION'))
);
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "businesses" ADD CONSTRAINT "businesses_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."accounts"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "invites" ADD CONSTRAINT "invites_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "invites" ADD CONSTRAINT "invites_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."accounts"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "invites" ADD CONSTRAINT "invites_accepted_by_fkey" FOREIGN KEY ("accepted_by") REFERENCES "public"."accounts"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "memberships" ADD CONSTRAINT "memberships_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "memberships" ADD CONSTRAINT "memberships_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "categories" ADD CONSTRAINT "categories_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "customers" ADD CONSTRAINT "customers_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "locations" ADD CONSTRAINT "locations_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "suppliers" ADD CONSTRAINT "suppliers_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "item_components" ADD CONSTRAINT "item_components_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "public"."items"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "item_components" ADD CONSTRAINT "item_components_component_id_fkey" FOREIGN KEY ("component_id") REFERENCES "public"."items"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "items" ADD CONSTRAINT "items_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "items" ADD CONSTRAINT "items_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "items" ADD CONSTRAINT "items_business_id_location_fkey" FOREIGN KEY ("business_id","location") REFERENCES "public"."locations"("business_id","code") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "order_lines" ADD CONSTRAINT "order_lines_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "order_lines" ADD CONSTRAINT "order_lines_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "orders" ADD CONSTRAINT "orders_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "orders" ADD CONSTRAINT "orders_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "orders" ADD CONSTRAINT "orders_assignee_id_fkey" FOREIGN KEY ("assignee_id") REFERENCES "public"."accounts"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "deliveries" ADD CONSTRAINT "deliveries_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "deliveries" ADD CONSTRAINT "deliveries_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "delivery_lines" ADD CONSTRAINT "delivery_lines_delivery_id_fkey" FOREIGN KEY ("delivery_id") REFERENCES "public"."deliveries"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "delivery_lines" ADD CONSTRAINT "delivery_lines_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "activity" ADD CONSTRAINT "activity_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "activity" ADD CONSTRAINT "activity_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "movements" ADD CONSTRAINT "movements_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "movements" ADD CONSTRAINT "movements_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "movements" ADD CONSTRAINT "movements_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "refresh_tokens_account" ON "refresh_tokens" USING btree ("account_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "invites_business" ON "invites" USING btree ("business_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "memberships_account" ON "memberships" USING btree ("account_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "customers_business" ON "customers" USING btree ("business_id","name");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "item_components_component" ON "item_components" USING btree ("component_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "items_business" ON "items" USING btree ("business_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "order_lines_item" ON "order_lines" USING btree ("item_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "orders_business" ON "orders" USING btree ("business_id","closed","created_at" DESC NULLS FIRST);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "deliveries_business" ON "deliveries" USING btree ("business_id","status");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "delivery_lines_item" ON "delivery_lines" USING btree ("item_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "activity_business_at" ON "activity" USING btree ("business_id","at" DESC NULLS FIRST);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "movements_item_at" ON "movements" USING btree ("item_id","at" DESC NULLS FIRST);
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
