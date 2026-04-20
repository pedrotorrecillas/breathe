CREATE TABLE "candidate_notes" (
	"id" text PRIMARY KEY NOT NULL,
	"candidate_id" text NOT NULL,
	"application_id" text NOT NULL,
	"job_id" text NOT NULL,
	"author_user_id" text,
	"created_at" text NOT NULL,
	"position" integer NOT NULL,
	"payload" jsonb NOT NULL
);
