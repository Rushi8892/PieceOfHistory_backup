CREATE TYPE "public"."daily_piece_status" AS ENUM('active', 'closed');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('pending', 'captured', 'failed');--> statement-breakpoint
CREATE TYPE "public"."story_status" AS ENUM('visible', 'hidden');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('user', 'admin');--> statement-breakpoint
CREATE TABLE "audit_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_type" text NOT NULL,
	"daily_piece_id" uuid,
	"actor_user_id" uuid,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bids" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"daily_piece_id" uuid NOT NULL,
	"amount_cents" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"payment_reference" text NOT NULL,
	"payment_status" "payment_status" DEFAULT 'pending' NOT NULL,
	"captured_at" timestamp with time zone,
	CONSTRAINT "bids_amount_positive" CHECK ("bids"."amount_cents" > 0)
);
--> statement-breakpoint
CREATE TABLE "daily_pieces" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"date" date NOT NULL,
	"closing_timestamp" timestamp with time zone NOT NULL,
	"status" "daily_piece_status" DEFAULT 'active' NOT NULL,
	"winner_user_id" uuid,
	"winning_standing_cents" integer,
	"minimum_payment_cents" integer DEFAULT 100 NOT NULL,
	"closed_at" timestamp with time zone,
	CONSTRAINT "daily_pieces_minimum_payment_positive" CHECK ("daily_pieces"."minimum_payment_cents" > 0),
	CONSTRAINT "daily_pieces_winning_standing_non_negative" CHECK ("daily_pieces"."winning_standing_cents" IS NULL OR "daily_pieces"."winning_standing_cents" >= 0)
);
--> statement-breakpoint
CREATE TABLE "participant_standings" (
	"user_id" uuid NOT NULL,
	"daily_piece_id" uuid NOT NULL,
	"running_total_cents" integer DEFAULT 0 NOT NULL,
	"last_payment_at" timestamp with time zone,
	"standing_reached_at" timestamp with time zone,
	CONSTRAINT "participant_standings_pk" PRIMARY KEY("user_id","daily_piece_id"),
	CONSTRAINT "participant_standings_total_non_negative" CHECK ("participant_standings"."running_total_cents" >= 0)
);
--> statement-breakpoint
CREATE TABLE "stories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"daily_piece_id" uuid NOT NULL,
	"display_name" text NOT NULL,
	"story_text" text NOT NULL,
	"website_url" text,
	"status" "story_status" DEFAULT 'visible' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "stories_story_text_not_blank" CHECK (length(trim("stories"."story_text")) > 0)
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"display_name" text NOT NULL,
	"email" text,
	"auth_provider" text DEFAULT 'pending' NOT NULL,
	"role" "user_role" DEFAULT 'user' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_daily_piece_id_daily_pieces_id_fk" FOREIGN KEY ("daily_piece_id") REFERENCES "public"."daily_pieces"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_actor_user_id_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bids" ADD CONSTRAINT "bids_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bids" ADD CONSTRAINT "bids_daily_piece_id_daily_pieces_id_fk" FOREIGN KEY ("daily_piece_id") REFERENCES "public"."daily_pieces"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_pieces" ADD CONSTRAINT "daily_pieces_winner_user_id_users_id_fk" FOREIGN KEY ("winner_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "participant_standings" ADD CONSTRAINT "participant_standings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "participant_standings" ADD CONSTRAINT "participant_standings_daily_piece_id_daily_pieces_id_fk" FOREIGN KEY ("daily_piece_id") REFERENCES "public"."daily_pieces"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stories" ADD CONSTRAINT "stories_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stories" ADD CONSTRAINT "stories_daily_piece_id_daily_pieces_id_fk" FOREIGN KEY ("daily_piece_id") REFERENCES "public"."daily_pieces"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "bids_payment_reference_idx" ON "bids" USING btree ("payment_reference");--> statement-breakpoint
CREATE INDEX "bids_user_daily_piece_idx" ON "bids" USING btree ("user_id","daily_piece_id");--> statement-breakpoint
CREATE INDEX "bids_daily_piece_created_at_idx" ON "bids" USING btree ("daily_piece_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "daily_pieces_date_idx" ON "daily_pieces" USING btree ("date");--> statement-breakpoint
CREATE UNIQUE INDEX "daily_pieces_one_active_idx" ON "daily_pieces" USING btree ("status") WHERE "daily_pieces"."status" = 'active';--> statement-breakpoint
CREATE INDEX "participant_standings_daily_piece_rank_idx" ON "participant_standings" USING btree ("daily_piece_id","running_total_cents","last_payment_at");--> statement-breakpoint
CREATE UNIQUE INDEX "stories_user_daily_piece_idx" ON "stories" USING btree ("user_id","daily_piece_id");--> statement-breakpoint
CREATE OR REPLACE FUNCTION prevent_captured_bid_mutation()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF OLD.payment_status = 'captured' THEN
    RAISE EXCEPTION 'captured bid rows are immutable';
  END IF;
  RETURN NEW;
END;
$$;--> statement-breakpoint
CREATE TRIGGER bids_captured_immutable
BEFORE UPDATE OR DELETE ON "bids"
FOR EACH ROW
EXECUTE FUNCTION prevent_captured_bid_mutation();