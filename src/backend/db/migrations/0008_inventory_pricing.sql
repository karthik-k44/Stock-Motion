-- Idempotent: a development database may already have some of these columns from an earlier draft of this migration.
DO $$ BEGIN
  CREATE TYPE "public"."billing_interval" AS ENUM('MONTHLY', 'YEARLY');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
ALTER TABLE "razorpay_plans" DROP CONSTRAINT IF EXISTS "razorpay_plans_plan_amount_currency_key";--> statement-breakpoint
ALTER TABLE "razorpay_plans" ADD COLUMN IF NOT EXISTS "interval" "billing_interval" DEFAULT 'MONTHLY' NOT NULL;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD COLUMN IF NOT EXISTS "quantity" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD COLUMN IF NOT EXISTS "billing_interval" "billing_interval" DEFAULT 'MONTHLY' NOT NULL;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD COLUMN IF NOT EXISTS "next_plan" "subscription_plan";--> statement-breakpoint
ALTER TABLE "subscriptions" ADD COLUMN IF NOT EXISTS "pending_quantity" integer;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD COLUMN IF NOT EXISTS "pending_interval" "billing_interval";--> statement-breakpoint
ALTER TABLE "razorpay_plans" DROP CONSTRAINT IF EXISTS "razorpay_plans_plan_interval_amount_currency_key";--> statement-breakpoint
ALTER TABLE "razorpay_plans" ADD CONSTRAINT "razorpay_plans_plan_interval_amount_currency_key" UNIQUE("plan","interval","amount","currency");--> statement-breakpoint
UPDATE "subscriptions" AS s SET "quantity" = GREATEST(1, (SELECT count(*) FROM "businesses" AS b WHERE b."created_by" = s."account_id"));
