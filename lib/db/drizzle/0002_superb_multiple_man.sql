CREATE TABLE "payment_orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"story_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"daily_piece_id" uuid NOT NULL,
	"razorpay_order_id" text NOT NULL,
	"razorpay_payment_id" text,
	"amount_cents" integer NOT NULL,
	"currency" text DEFAULT 'USD' NOT NULL,
	"key_id" text NOT NULL,
	"status" "payment_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"captured_at" timestamp with time zone,
	CONSTRAINT "payment_orders_amount_positive" CHECK ("payment_orders"."amount_cents" > 0),
	CONSTRAINT "payment_orders_currency_usd" CHECK ("payment_orders"."currency" = 'USD')
);
--> statement-breakpoint
CREATE TABLE "payment_webhook_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" text NOT NULL,
	"event_type" text NOT NULL,
	"received_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "bids" ADD COLUMN "payment_order_id" uuid;--> statement-breakpoint
ALTER TABLE "payment_orders" ADD CONSTRAINT "payment_orders_story_id_stories_id_fk" FOREIGN KEY ("story_id") REFERENCES "public"."stories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_orders" ADD CONSTRAINT "payment_orders_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_orders" ADD CONSTRAINT "payment_orders_daily_piece_id_daily_pieces_id_fk" FOREIGN KEY ("daily_piece_id") REFERENCES "public"."daily_pieces"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "payment_orders_razorpay_order_idx" ON "payment_orders" USING btree ("razorpay_order_id");--> statement-breakpoint
CREATE UNIQUE INDEX "payment_orders_razorpay_payment_idx" ON "payment_orders" USING btree ("razorpay_payment_id");--> statement-breakpoint
CREATE UNIQUE INDEX "payment_webhook_events_event_id_idx" ON "payment_webhook_events" USING btree ("event_id");--> statement-breakpoint
ALTER TABLE "bids" ADD CONSTRAINT "bids_payment_order_id_payment_orders_id_fk" FOREIGN KEY ("payment_order_id") REFERENCES "public"."payment_orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "bids_payment_order_idx" ON "bids" USING btree ("payment_order_id");