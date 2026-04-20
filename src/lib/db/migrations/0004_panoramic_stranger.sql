CREATE TABLE "audit_events" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"action" text NOT NULL,
	"target_type" text NOT NULL,
	"target_id" text NOT NULL,
	"occurred_at" text NOT NULL,
	"position" integer NOT NULL,
	"payload" jsonb NOT NULL
);
