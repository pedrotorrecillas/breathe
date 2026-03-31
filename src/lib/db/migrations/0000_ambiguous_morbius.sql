CREATE TABLE "applications" (
	"id" text PRIMARY KEY NOT NULL,
	"candidate_id" text NOT NULL,
	"job_id" text NOT NULL,
	"stage" text NOT NULL,
	"position" integer NOT NULL,
	"payload" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "candidates" (
	"id" text PRIMARY KEY NOT NULL,
	"normalized_phone" text NOT NULL,
	"normalized_email" text,
	"position" integer NOT NULL,
	"payload" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dispatch_payloads" (
	"interview_run_id" text PRIMARY KEY NOT NULL,
	"position" integer NOT NULL,
	"payload" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dispatch_requests" (
	"interview_run_id" text PRIMARY KEY NOT NULL,
	"position" integer NOT NULL,
	"payload" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dispatch_responses" (
	"interview_run_id" text PRIMARY KEY NOT NULL,
	"position" integer NOT NULL,
	"payload" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "evaluations" (
	"id" text PRIMARY KEY NOT NULL,
	"interview_run_id" text NOT NULL,
	"position" integer NOT NULL,
	"payload" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "interview_preparation_packages" (
	"id" text PRIMARY KEY NOT NULL,
	"candidate_id" text,
	"job_id" text NOT NULL,
	"position" integer NOT NULL,
	"payload" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "interview_runs" (
	"id" text PRIMARY KEY NOT NULL,
	"candidate_id" text NOT NULL,
	"application_id" text NOT NULL,
	"job_id" text NOT NULL,
	"provider_call_id" text,
	"position" integer NOT NULL,
	"payload" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "jobs" (
	"id" text PRIMARY KEY NOT NULL,
	"recruiter_slug" text NOT NULL,
	"public_apply_slug" text,
	"position" integer NOT NULL,
	"payload" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "runtime_trace_events" (
	"id" text PRIMARY KEY NOT NULL,
	"interview_run_id" text NOT NULL,
	"phase" text NOT NULL,
	"occurred_at" text NOT NULL,
	"position" integer NOT NULL,
	"payload" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "webhook_records" (
	"event_id" text PRIMARY KEY NOT NULL,
	"matched_interview_run_id" text,
	"position" integer NOT NULL,
	"payload" jsonb NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "jobs_recruiter_slug_idx" ON "jobs" USING btree ("recruiter_slug");--> statement-breakpoint
CREATE UNIQUE INDEX "jobs_public_apply_slug_idx" ON "jobs" USING btree ("public_apply_slug");