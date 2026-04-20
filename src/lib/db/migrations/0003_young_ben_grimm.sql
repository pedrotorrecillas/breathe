CREATE TABLE "job_access_grants" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"team_id" text NOT NULL,
	"job_id" text NOT NULL,
	"position" integer NOT NULL,
	"payload" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "team_memberships" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"team_id" text NOT NULL,
	"user_id" text NOT NULL,
	"position" integer NOT NULL,
	"payload" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "teams" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"is_default" text NOT NULL,
	"position" integer NOT NULL,
	"payload" jsonb NOT NULL
);
--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "company_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "candidate_notes" ADD COLUMN "company_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "evaluations" ADD COLUMN "company_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "interview_runs" ADD COLUMN "company_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN "company_id" text NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "job_access_grants_team_job_idx" ON "job_access_grants" USING btree ("team_id","job_id");--> statement-breakpoint
CREATE UNIQUE INDEX "team_memberships_team_user_idx" ON "team_memberships" USING btree ("team_id","user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "teams_company_slug_idx" ON "teams" USING btree ("company_id","slug");