CREATE TABLE "ats_connections" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"provider" text NOT NULL,
	"status" text NOT NULL,
	"position" integer NOT NULL,
	"payload" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ats_external_applications" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"connection_id" text NOT NULL,
	"provider" text NOT NULL,
	"external_id" text NOT NULL,
	"external_updated_at" text,
	"status" text NOT NULL,
	"position" integer NOT NULL,
	"payload" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ats_external_candidates" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"connection_id" text NOT NULL,
	"provider" text NOT NULL,
	"external_id" text NOT NULL,
	"external_updated_at" text,
	"position" integer NOT NULL,
	"payload" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ats_external_jobs" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"connection_id" text NOT NULL,
	"provider" text NOT NULL,
	"external_id" text NOT NULL,
	"external_updated_at" text,
	"position" integer NOT NULL,
	"payload" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ats_external_stages" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"connection_id" text NOT NULL,
	"provider" text NOT NULL,
	"external_id" text NOT NULL,
	"external_job_id" text,
	"position" integer NOT NULL,
	"payload" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ats_sync_cursors" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"connection_id" text NOT NULL,
	"provider" text NOT NULL,
	"resource" text NOT NULL,
	"updated_at" text NOT NULL,
	"position" integer NOT NULL,
	"payload" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ats_sync_events" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"connection_id" text NOT NULL,
	"provider" text NOT NULL,
	"idempotency_key" text NOT NULL,
	"occurred_at" text NOT NULL,
	"position" integer NOT NULL,
	"payload" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ats_trigger_rules" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"connection_id" text NOT NULL,
	"provider" text NOT NULL,
	"external_stage_id" text NOT NULL,
	"position" integer NOT NULL,
	"payload" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ats_writeback_actions" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"connection_id" text NOT NULL,
	"provider" text NOT NULL,
	"status" text NOT NULL,
	"idempotency_key" text NOT NULL,
	"position" integer NOT NULL,
	"payload" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ats_writeback_attempts" (
	"id" text PRIMARY KEY NOT NULL,
	"writeback_action_id" text NOT NULL,
	"attempted_at" text NOT NULL,
	"status" text NOT NULL,
	"position" integer NOT NULL,
	"payload" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "audit_events" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"action" text NOT NULL,
	"target_type" text NOT NULL,
	"target_id" text NOT NULL,
	"occurred_at" text NOT NULL,
	"position" integer NOT NULL,
	"payload" jsonb NOT NULL
);
