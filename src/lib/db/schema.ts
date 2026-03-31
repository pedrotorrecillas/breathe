import { integer, jsonb, pgTable, text, uniqueIndex } from "drizzle-orm/pg-core";

export const jobsTable = pgTable(
  "jobs",
  {
    id: text("id").primaryKey(),
    recruiterSlug: text("recruiter_slug").notNull(),
    publicApplySlug: text("public_apply_slug"),
    position: integer("position").notNull(),
    payload: jsonb("payload").notNull(),
  },
  (table) => ({
    recruiterSlugIdx: uniqueIndex("jobs_recruiter_slug_idx").on(table.recruiterSlug),
    publicApplySlugIdx: uniqueIndex("jobs_public_apply_slug_idx").on(
      table.publicApplySlug,
    ),
  }),
);

export const candidatesTable = pgTable("candidates", {
  id: text("id").primaryKey(),
  normalizedPhone: text("normalized_phone").notNull(),
  normalizedEmail: text("normalized_email"),
  position: integer("position").notNull(),
  payload: jsonb("payload").notNull(),
});

export const applicationsTable = pgTable("applications", {
  id: text("id").primaryKey(),
  candidateId: text("candidate_id").notNull(),
  jobId: text("job_id").notNull(),
  stage: text("stage").notNull(),
  position: integer("position").notNull(),
  payload: jsonb("payload").notNull(),
});

export const interviewRunsTable = pgTable("interview_runs", {
  id: text("id").primaryKey(),
  candidateId: text("candidate_id").notNull(),
  applicationId: text("application_id").notNull(),
  jobId: text("job_id").notNull(),
  providerCallId: text("provider_call_id"),
  position: integer("position").notNull(),
  payload: jsonb("payload").notNull(),
});

export const interviewPreparationPackagesTable = pgTable(
  "interview_preparation_packages",
  {
    id: text("id").primaryKey(),
    candidateId: text("candidate_id"),
    jobId: text("job_id").notNull(),
    position: integer("position").notNull(),
    payload: jsonb("payload").notNull(),
  },
);

export const dispatchRequestsTable = pgTable("dispatch_requests", {
  interviewRunId: text("interview_run_id").primaryKey(),
  position: integer("position").notNull(),
  payload: jsonb("payload").notNull(),
});

export const dispatchPayloadsTable = pgTable("dispatch_payloads", {
  interviewRunId: text("interview_run_id").primaryKey(),
  position: integer("position").notNull(),
  payload: jsonb("payload").notNull(),
});

export const dispatchResponsesTable = pgTable("dispatch_responses", {
  interviewRunId: text("interview_run_id").primaryKey(),
  position: integer("position").notNull(),
  payload: jsonb("payload").notNull(),
});

export const webhookRecordsTable = pgTable("webhook_records", {
  eventId: text("event_id").primaryKey(),
  matchedInterviewRunId: text("matched_interview_run_id"),
  position: integer("position").notNull(),
  payload: jsonb("payload").notNull(),
});

export const runtimeTraceEventsTable = pgTable("runtime_trace_events", {
  id: text("id").primaryKey(),
  interviewRunId: text("interview_run_id").notNull(),
  phase: text("phase").notNull(),
  occurredAt: text("occurred_at").notNull(),
  position: integer("position").notNull(),
  payload: jsonb("payload").notNull(),
});

export const evaluationsTable = pgTable("evaluations", {
  id: text("id").primaryKey(),
  interviewRunId: text("interview_run_id").notNull(),
  position: integer("position").notNull(),
  payload: jsonb("payload").notNull(),
});
