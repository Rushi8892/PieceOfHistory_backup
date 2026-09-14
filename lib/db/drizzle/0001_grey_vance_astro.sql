ALTER TABLE "users" ADD COLUMN "auth_provider_id" text;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_auth_provider_id_unique" UNIQUE("auth_provider_id");