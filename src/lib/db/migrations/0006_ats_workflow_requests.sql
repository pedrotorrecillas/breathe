CREATE TABLE "ats_workflow_requests" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"ats_sync_event_id" text NOT NULL,
	"ats_trigger_rule_id" text NOT NULL,
	"status" text NOT NULL,
	"position" integer NOT NULL,
	"payload" jsonb NOT NULL
);
