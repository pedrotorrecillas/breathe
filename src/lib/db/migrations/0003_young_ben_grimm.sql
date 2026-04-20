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
ALTER TABLE "applications" ADD COLUMN "company_id" text;
--> statement-breakpoint
ALTER TABLE "candidate_notes" ADD COLUMN "company_id" text;
--> statement-breakpoint
ALTER TABLE "evaluations" ADD COLUMN "company_id" text;
--> statement-breakpoint
ALTER TABLE "interview_runs" ADD COLUMN "company_id" text;
--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN "company_id" text;
--> statement-breakpoint
UPDATE "jobs"
SET "company_id" = (
	SELECT "id"
	FROM "companies"
	ORDER BY "position" ASC
	LIMIT 1
)
WHERE "company_id" IS NULL;
--> statement-breakpoint
UPDATE "applications"
SET "company_id" = "jobs"."company_id"
FROM "jobs"
WHERE "applications"."job_id" = "jobs"."id"
  AND "applications"."company_id" IS NULL;
--> statement-breakpoint
UPDATE "candidate_notes"
SET "company_id" = "applications"."company_id"
FROM "applications"
WHERE "candidate_notes"."application_id" = "applications"."id"
  AND "candidate_notes"."company_id" IS NULL;
--> statement-breakpoint
UPDATE "interview_runs"
SET "company_id" = "applications"."company_id"
FROM "applications"
WHERE "interview_runs"."application_id" = "applications"."id"
  AND "interview_runs"."company_id" IS NULL;
--> statement-breakpoint
UPDATE "evaluations"
SET "company_id" = "interview_runs"."company_id"
FROM "interview_runs"
WHERE "evaluations"."interview_run_id" = "interview_runs"."id"
  AND "evaluations"."company_id" IS NULL;
--> statement-breakpoint
ALTER TABLE "applications" ALTER COLUMN "company_id" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "candidate_notes" ALTER COLUMN "company_id" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "evaluations" ALTER COLUMN "company_id" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "interview_runs" ALTER COLUMN "company_id" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "jobs" ALTER COLUMN "company_id" SET NOT NULL;
--> statement-breakpoint
CREATE UNIQUE INDEX "job_access_grants_team_job_idx" ON "job_access_grants" USING btree ("team_id","job_id");
--> statement-breakpoint
CREATE UNIQUE INDEX "team_memberships_team_user_idx" ON "team_memberships" USING btree ("team_id","user_id");
--> statement-breakpoint
CREATE UNIQUE INDEX "teams_company_slug_idx" ON "teams" USING btree ("company_id","slug");
