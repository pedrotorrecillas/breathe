CREATE TABLE "companies" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"default_workspace_key" text,
	"position" integer NOT NULL,
	"payload" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "company_memberships" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"user_id" text NOT NULL,
	"role" text NOT NULL,
	"workspace_key" text,
	"position" integer NOT NULL,
	"payload" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"company_id" text NOT NULL,
	"membership_id" text NOT NULL,
	"token_hash" text NOT NULL,
	"active_workspace_key" text,
	"expires_at" text NOT NULL,
	"last_seen_at" text NOT NULL,
	"position" integer NOT NULL,
	"payload" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"normalized_email" text NOT NULL,
	"password_hash" text NOT NULL,
	"auth_provider" text NOT NULL,
	"position" integer NOT NULL,
	"payload" jsonb NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "companies_slug_idx" ON "companies" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "company_memberships_company_user_idx" ON "company_memberships" USING btree ("company_id","user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "sessions_token_hash_idx" ON "sessions" USING btree ("token_hash");--> statement-breakpoint
CREATE UNIQUE INDEX "users_normalized_email_idx" ON "users" USING btree ("normalized_email");