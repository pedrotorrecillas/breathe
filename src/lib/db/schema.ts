import { integer, jsonb, pgTable, text, uniqueIndex } from "drizzle-orm/pg-core";

export const companiesTable = pgTable(
  "companies",
  {
    id: text("id").primaryKey(),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    defaultWorkspaceKey: text("default_workspace_key"),
    position: integer("position").notNull(),
    payload: jsonb("payload").notNull(),
  },
  (table) => ({
    slugIdx: uniqueIndex("companies_slug_idx").on(table.slug),
  }),
);

export const usersTable = pgTable(
  "users",
  {
    id: text("id").primaryKey(),
    email: text("email").notNull(),
    normalizedEmail: text("normalized_email").notNull(),
    passwordHash: text("password_hash").notNull(),
    authProvider: text("auth_provider").notNull(),
    position: integer("position").notNull(),
    payload: jsonb("payload").notNull(),
  },
  (table) => ({
    normalizedEmailIdx: uniqueIndex("users_normalized_email_idx").on(
      table.normalizedEmail,
    ),
  }),
);

export const companyMembershipsTable = pgTable(
  "company_memberships",
  {
    id: text("id").primaryKey(),
    companyId: text("company_id").notNull(),
    userId: text("user_id").notNull(),
    role: text("role").notNull(),
    workspaceKey: text("workspace_key"),
    position: integer("position").notNull(),
    payload: jsonb("payload").notNull(),
  },
  (table) => ({
    companyUserIdx: uniqueIndex("company_memberships_company_user_idx").on(
      table.companyId,
      table.userId,
    ),
  }),
);

export const sessionsTable = pgTable(
  "sessions",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    companyId: text("company_id").notNull(),
    membershipId: text("membership_id").notNull(),
    tokenHash: text("token_hash").notNull(),
    activeWorkspaceKey: text("active_workspace_key"),
    expiresAt: text("expires_at").notNull(),
    lastSeenAt: text("last_seen_at").notNull(),
    position: integer("position").notNull(),
    payload: jsonb("payload").notNull(),
  },
  (table) => ({
    tokenHashIdx: uniqueIndex("sessions_token_hash_idx").on(table.tokenHash),
  }),
);

export const teamsTable = pgTable(
  "teams",
  {
    id: text("id").primaryKey(),
    companyId: text("company_id").notNull(),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    isDefault: text("is_default").notNull(),
    position: integer("position").notNull(),
    payload: jsonb("payload").notNull(),
  },
  (table) => ({
    companySlugIdx: uniqueIndex("teams_company_slug_idx").on(
      table.companyId,
      table.slug,
    ),
  }),
);

export const teamMembershipsTable = pgTable(
  "team_memberships",
  {
    id: text("id").primaryKey(),
    companyId: text("company_id").notNull(),
    teamId: text("team_id").notNull(),
    userId: text("user_id").notNull(),
    position: integer("position").notNull(),
    payload: jsonb("payload").notNull(),
  },
  (table) => ({
    teamUserIdx: uniqueIndex("team_memberships_team_user_idx").on(
      table.teamId,
      table.userId,
    ),
  }),
);

export const jobAccessGrantsTable = pgTable(
  "job_access_grants",
  {
    id: text("id").primaryKey(),
    companyId: text("company_id").notNull(),
    teamId: text("team_id").notNull(),
    jobId: text("job_id").notNull(),
    position: integer("position").notNull(),
    payload: jsonb("payload").notNull(),
  },
  (table) => ({
    teamJobIdx: uniqueIndex("job_access_grants_team_job_idx").on(
      table.teamId,
      table.jobId,
    ),
  }),
);

export const auditEventsTable = pgTable("audit_events", {
  id: text("id").primaryKey(),
  companyId: text("company_id").notNull(),
  action: text("action").notNull(),
  targetType: text("target_type").notNull(),
  targetId: text("target_id").notNull(),
  occurredAt: text("occurred_at").notNull(),
  position: integer("position").notNull(),
  payload: jsonb("payload").notNull(),
});

export const jobsTable = pgTable(
  "jobs",
  {
    id: text("id").primaryKey(),
    companyId: text("company_id").notNull(),
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
  companyId: text("company_id").notNull(),
  candidateId: text("candidate_id").notNull(),
  jobId: text("job_id").notNull(),
  stage: text("stage").notNull(),
  position: integer("position").notNull(),
  payload: jsonb("payload").notNull(),
});

export const candidateNotesTable = pgTable("candidate_notes", {
  id: text("id").primaryKey(),
  companyId: text("company_id").notNull(),
  candidateId: text("candidate_id").notNull(),
  applicationId: text("application_id").notNull(),
  jobId: text("job_id").notNull(),
  authorUserId: text("author_user_id"),
  createdAt: text("created_at").notNull(),
  position: integer("position").notNull(),
  payload: jsonb("payload").notNull(),
});

export const interviewRunsTable = pgTable("interview_runs", {
  id: text("id").primaryKey(),
  companyId: text("company_id").notNull(),
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
  companyId: text("company_id").notNull(),
  interviewRunId: text("interview_run_id").notNull(),
  position: integer("position").notNull(),
  payload: jsonb("payload").notNull(),
});
