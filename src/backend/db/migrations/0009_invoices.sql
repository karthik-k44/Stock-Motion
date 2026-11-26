CREATE TYPE "public"."invoice_status" AS ENUM('PAID', 'REFUNDED');--> statement-breakpoint
CREATE SEQUENCE "public"."invoices_id_seq" INCREMENT BY 1 MINVALUE 100000 MAXVALUE 9223372036854775807 START WITH 100000 CACHE 1;--> statement-breakpoint
CREATE TABLE "invoices" (
	"id" text PRIMARY KEY DEFAULT 'IVID' || nextval('invoices_id_seq') NOT NULL,
	"account_id" text NOT NULL,
	"status" "invoice_status" DEFAULT 'PAID' NOT NULL,
	"plan" "subscription_plan" NOT NULL,
	"billing_interval" "billing_interval" NOT NULL,
	"quantity" integer NOT NULL,
	"unit_amount" integer NOT NULL,
	"amount" integer NOT NULL,
	"currency" text NOT NULL,
	"provider" "billing_provider" NOT NULL,
	"provider_payment_id" text,
	"provider_order_id" text,
	"provider_subscription_id" text,
	"payment_method" text,
	"billed_name" text NOT NULL,
	"billed_email" text NOT NULL,
	"billed_contact" text,
	"period_start" timestamp with time zone NOT NULL,
	"period_end" timestamp with time zone NOT NULL,
	"paid_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "invoices_provider_payment_id_key" UNIQUE("provider_payment_id")
);
--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "invoices_account_id_idx" ON "invoices" USING btree ("account_id","paid_at");