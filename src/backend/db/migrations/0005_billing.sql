CREATE SEQUENCE "public"."subscriptions_id_seq" INCREMENT BY 1 MINVALUE 100000 MAXVALUE 9223372036854775807 START WITH 100000 CACHE 1;--> statement-breakpoint
CREATE TABLE "billing_events" (
	"event_id" text PRIMARY KEY NOT NULL,
	"received_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "razorpay_plans" (
	"plan" text NOT NULL,
	"amount" integer NOT NULL,
	"currency" text NOT NULL,
	"razorpay_plan_id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "razorpay_plans_plan_amount_currency_key" UNIQUE("plan","amount","currency")
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" text PRIMARY KEY DEFAULT 'SBID' || nextval('subscriptions_id_seq') NOT NULL,
	"account_id" text NOT NULL,
	"plan" text NOT NULL,
	"status" text NOT NULL,
	"provider" text NOT NULL,
	"provider_subscription_id" text,
	"current_period_end" timestamp with time zone,
	"cancel_at_period_end" boolean DEFAULT false NOT NULL,
	"pending_plan" text,
	"pending_provider_subscription_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "subscriptions_account_id_key" UNIQUE("account_id"),
	CONSTRAINT "subscriptions_provider_subscription_id_key" UNIQUE("provider_subscription_id"),
	CONSTRAINT "subscriptions_plan_check" CHECK ("subscriptions"."plan" IN ('TRIAL','STARTER','PRO','SCALE')),
	CONSTRAINT "subscriptions_status_check" CHECK ("subscriptions"."status" IN ('TRIALING','ACTIVE','PAST_DUE','CANCELLED','EXPIRED')),
	CONSTRAINT "subscriptions_provider_check" CHECK ("subscriptions"."provider" IN ('TRIAL','MANUAL','RAZORPAY'))
);
--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE cascade ON UPDATE no action;