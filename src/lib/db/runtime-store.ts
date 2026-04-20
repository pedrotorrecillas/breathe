import type {
  CandidateApplication,
  CandidateNote,
  CandidateProfile,
} from "@/domain/candidates/types";
import type { CandidateEvaluation } from "@/domain/evaluations/types";
import type { InterviewPreparationPackage } from "@/domain/interview-preparation/types";
import type { InterviewRun } from "@/domain/interviews/types";
import type {
  HappyRobotCallRequest,
  HappyRobotDispatchResponse,
  HappyRobotNormalizedDispatchPayload,
  HappyRobotWebhookRecord,
} from "@/domain/runtime/happyrobot/types";
import type {
  AuthSessionRecord,
  JobAccessGrantRecord,
  AuthUserRecord,
  CompanyMembershipRecord,
  CompanyRecord,
  TeamMembershipRecord,
  TeamRecord,
} from "@/lib/auth/types";
import type { RuntimeTraceEvent } from "@/lib/runtime-tracing";
import { getDatabaseClient, hasDatabaseUrl } from "@/lib/db/client";
import {
  applicationsTable,
  candidateNotesTable,
  candidatesTable,
  companiesTable,
  companyMembershipsTable,
  dispatchPayloadsTable,
  dispatchRequestsTable,
  dispatchResponsesTable,
  evaluationsTable,
  interviewPreparationPackagesTable,
  interviewRunsTable,
  jobAccessGrantsTable,
  jobsTable,
  runtimeTraceEventsTable,
  sessionsTable,
  teamMembershipsTable,
  teamsTable,
  usersTable,
  webhookRecordsTable,
} from "@/lib/db/schema";
import { seededPublicJobs, type SeededPublicJobRecord } from "@/lib/job-seeds";

export type RuntimeStoreState = {
  companies: CompanyRecord[];
  memberships: CompanyMembershipRecord[];
  sessions: AuthSessionRecord[];
  users: AuthUserRecord[];
  teams: TeamRecord[];
  teamMemberships: TeamMembershipRecord[];
  jobAccessGrants: JobAccessGrantRecord[];
  jobs: SeededPublicJobRecord[];
  candidates: CandidateProfile[];
  applications: CandidateApplication[];
  candidateNotes: CandidateNote[];
  interviewRuns: InterviewRun[];
  interviewPreparationPackages: InterviewPreparationPackage[];
  dispatchRequests: HappyRobotCallRequest[];
  dispatchPayloads: HappyRobotNormalizedDispatchPayload[];
  dispatchResponses: HappyRobotDispatchResponse[];
  webhookRecords: HappyRobotWebhookRecord[];
  runtimeTraceEvents: RuntimeTraceEvent[];
  evaluations: CandidateEvaluation[];
};

const memoryState: RuntimeStoreState = {
  companies: [],
  memberships: [],
  sessions: [],
  users: [],
  teams: [],
  teamMemberships: [],
  jobAccessGrants: [],
  jobs: seededPublicJobs.map((job) => ({ ...job })),
  candidates: [],
  applications: [],
  candidateNotes: [],
  interviewRuns: [],
  interviewPreparationPackages: [],
  dispatchRequests: [],
  dispatchPayloads: [],
  dispatchResponses: [],
  webhookRecords: [],
  runtimeTraceEvents: [],
  evaluations: [],
};

function fallbackToMemoryState() {
  return cloneState(memoryState);
}

function formatDatabaseError(error: unknown) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "Unknown database error.";
}

function cloneState(state: RuntimeStoreState): RuntimeStoreState {
  return {
    companies: [...state.companies],
    memberships: [...state.memberships],
    sessions: [...state.sessions],
    users: [...state.users],
    teams: [...state.teams],
    teamMemberships: [...state.teamMemberships],
    jobAccessGrants: [...state.jobAccessGrants],
    jobs: [...state.jobs],
    candidates: [...state.candidates],
    applications: [...state.applications],
    candidateNotes: [...state.candidateNotes],
    interviewRuns: [...state.interviewRuns],
    interviewPreparationPackages: [...state.interviewPreparationPackages],
    dispatchRequests: [...state.dispatchRequests],
    dispatchPayloads: [...state.dispatchPayloads],
    dispatchResponses: [...state.dispatchResponses],
    webhookRecords: [...state.webhookRecords],
    runtimeTraceEvents: [...state.runtimeTraceEvents],
    evaluations: [...state.evaluations],
  };
}

function traceEventId(event: RuntimeTraceEvent, index: number) {
  return `${event.interviewRunId}:${event.phase}:${event.occurredAt}:${index}`;
}

function publicApplySlug(path: string | null) {
  return path?.replace("/apply/", "") ?? null;
}

async function ensureSeedJobs() {
  if (!hasDatabaseUrl()) {
    return;
  }

  const db = getDatabaseClient();
  const companies = await db.select().from(companiesTable).limit(1);
  const companyId = companies[0]?.id ?? null;
  const rows = await db.select().from(jobsTable).limit(1);

  if (rows.length > 0 || !companyId) {
    return;
  }

  await db.insert(jobsTable).values(
    seededPublicJobs.map((job, index) => ({
      id: job.id,
      companyId,
      recruiterSlug: job.recruiterSlug,
      publicApplySlug: publicApplySlug(job.publicApplyPath),
      position: index,
      payload: {
        ...job,
        companyId,
      },
    })),
  );
}

export async function loadRuntimeStoreState(): Promise<RuntimeStoreState> {
  if (!hasDatabaseUrl()) {
    return fallbackToMemoryState();
  }

  try {
    await ensureSeedJobs();
    const db = getDatabaseClient();

    const [
      companies,
      memberships,
      sessions,
      users,
      teams,
      teamMemberships,
      jobAccessGrants,
      jobs,
      candidates,
      applications,
      candidateNotes,
      interviewRuns,
      interviewPreparationPackages,
      dispatchRequests,
      dispatchPayloads,
      dispatchResponses,
      webhookRecords,
      runtimeTraceEvents,
      evaluations,
    ] = await Promise.all([
      db.select().from(companiesTable),
      db.select().from(companyMembershipsTable),
      db.select().from(sessionsTable),
      db.select().from(usersTable),
      db.select().from(teamsTable),
      db.select().from(teamMembershipsTable),
      db.select().from(jobAccessGrantsTable),
      db.select().from(jobsTable),
      db.select().from(candidatesTable),
      db.select().from(applicationsTable),
      db.select().from(candidateNotesTable),
      db.select().from(interviewRunsTable),
      db.select().from(interviewPreparationPackagesTable),
      db.select().from(dispatchRequestsTable),
      db.select().from(dispatchPayloadsTable),
      db.select().from(dispatchResponsesTable),
      db.select().from(webhookRecordsTable),
      db.select().from(runtimeTraceEventsTable),
      db.select().from(evaluationsTable),
    ]);

    return {
      companies: companies
        .sort((left, right) => left.position - right.position)
        .map((row) => row.payload as CompanyRecord),
      memberships: memberships
        .sort((left, right) => left.position - right.position)
        .map((row) => row.payload as CompanyMembershipRecord),
      sessions: sessions
        .sort((left, right) => left.position - right.position)
        .map((row) => row.payload as AuthSessionRecord),
      users: users
        .sort((left, right) => left.position - right.position)
        .map((row) => row.payload as AuthUserRecord),
      teams: teams
        .sort((left, right) => left.position - right.position)
        .map((row) => row.payload as TeamRecord),
      teamMemberships: teamMemberships
        .sort((left, right) => left.position - right.position)
        .map((row) => row.payload as TeamMembershipRecord),
      jobAccessGrants: jobAccessGrants
        .sort((left, right) => left.position - right.position)
        .map((row) => row.payload as JobAccessGrantRecord),
      jobs: jobs
        .sort((left, right) => left.position - right.position)
        .map((row) => row.payload as SeededPublicJobRecord),
      candidates: candidates
        .sort((left, right) => left.position - right.position)
        .map((row) => row.payload as CandidateProfile),
      applications: applications
        .sort((left, right) => left.position - right.position)
        .map((row) => row.payload as CandidateApplication),
      candidateNotes: candidateNotes
        .sort((left, right) => left.position - right.position)
        .map((row) => row.payload as CandidateNote),
      interviewRuns: interviewRuns
        .sort((left, right) => left.position - right.position)
        .map((row) => row.payload as InterviewRun),
      interviewPreparationPackages: interviewPreparationPackages
        .sort((left, right) => left.position - right.position)
        .map((row) => row.payload as InterviewPreparationPackage),
      dispatchRequests: dispatchRequests
        .sort((left, right) => left.position - right.position)
        .map((row) => row.payload as HappyRobotCallRequest),
      dispatchPayloads: dispatchPayloads
        .sort((left, right) => left.position - right.position)
        .map((row) => row.payload as HappyRobotNormalizedDispatchPayload),
      dispatchResponses: dispatchResponses
        .sort((left, right) => left.position - right.position)
        .map((row) => row.payload as HappyRobotDispatchResponse),
      webhookRecords: webhookRecords
        .sort((left, right) => left.position - right.position)
        .map((row) => row.payload as HappyRobotWebhookRecord),
      runtimeTraceEvents: runtimeTraceEvents
        .sort((left, right) => left.position - right.position)
        .map((row) => row.payload as RuntimeTraceEvent),
      evaluations: evaluations
        .sort((left, right) => left.position - right.position)
        .map((row) => row.payload as CandidateEvaluation),
    };
  } catch (error) {
    throw new Error(
      `Failed to load runtime state from Postgres. ${formatDatabaseError(error)}`,
    );
  }
}

export async function saveRuntimeStoreState(state: RuntimeStoreState) {
  if (!hasDatabaseUrl()) {
    Object.assign(memoryState, cloneState(state));
    return;
  }

  try {
    const db = getDatabaseClient();

    await db.transaction(async (tx) => {
      await tx.delete(companyMembershipsTable);
      await tx.delete(sessionsTable);
      await tx.delete(usersTable);
      await tx.delete(companiesTable);
      await tx.delete(teamMembershipsTable);
      await tx.delete(jobAccessGrantsTable);
      await tx.delete(teamsTable);
      await tx.delete(candidatesTable);
      await tx.delete(applicationsTable);
      await tx.delete(candidateNotesTable);
      await tx.delete(interviewRunsTable);
      await tx.delete(interviewPreparationPackagesTable);
      await tx.delete(dispatchRequestsTable);
      await tx.delete(dispatchPayloadsTable);
      await tx.delete(dispatchResponsesTable);
      await tx.delete(webhookRecordsTable);
      await tx.delete(runtimeTraceEventsTable);
      await tx.delete(evaluationsTable);
      await tx.delete(jobsTable);

      if (state.companies.length > 0) {
        await tx.insert(companiesTable).values(
          state.companies.map((item, index) => ({
            id: item.id,
            slug: item.slug,
            name: item.name,
            defaultWorkspaceKey: item.defaultWorkspaceKey,
            position: index,
            payload: item,
          })),
        );
      }

      if (state.users.length > 0) {
        await tx.insert(usersTable).values(
          state.users.map((item, index) => ({
            id: item.id,
            email: item.email,
            normalizedEmail: item.normalizedEmail,
            passwordHash: item.passwordHash,
            authProvider: item.authProvider,
            position: index,
            payload: item,
          })),
        );
      }

      if (state.memberships.length > 0) {
        await tx.insert(companyMembershipsTable).values(
          state.memberships.map((item, index) => ({
            id: item.id,
            companyId: item.companyId,
            userId: item.userId,
            role: item.role,
            workspaceKey: item.workspaceKey,
            position: index,
            payload: item,
          })),
        );
      }

      if (state.sessions.length > 0) {
        await tx.insert(sessionsTable).values(
          state.sessions.map((item, index) => ({
            id: item.id,
            userId: item.userId,
            companyId: item.companyId,
            membershipId: item.membershipId,
            tokenHash: item.tokenHash,
            activeWorkspaceKey: item.activeWorkspaceKey,
            expiresAt: item.expiresAt,
            lastSeenAt: item.lastSeenAt,
            position: index,
            payload: item,
          })),
        );
      }

      if (state.teams.length > 0) {
        await tx.insert(teamsTable).values(
          state.teams.map((item, index) => ({
            id: item.id,
            companyId: item.companyId,
            slug: item.slug,
            name: item.name,
            isDefault: item.isDefault ? "true" : "false",
            position: index,
            payload: item,
          })),
        );
      }

      if (state.teamMemberships.length > 0) {
        await tx.insert(teamMembershipsTable).values(
          state.teamMemberships.map((item, index) => ({
            id: item.id,
            companyId: item.companyId,
            teamId: item.teamId,
            userId: item.userId,
            position: index,
            payload: item,
          })),
        );
      }

      if (state.jobAccessGrants.length > 0) {
        await tx.insert(jobAccessGrantsTable).values(
          state.jobAccessGrants.map((item, index) => ({
            id: item.id,
            companyId: item.companyId,
            teamId: item.teamId,
            jobId: item.jobId,
            position: index,
            payload: item,
          })),
        );
      }

      await tx.insert(jobsTable).values(
        state.jobs.map((job, index) => ({
          id: job.id,
          companyId: job.companyId,
          recruiterSlug: job.recruiterSlug,
          publicApplySlug: publicApplySlug(job.publicApplyPath),
          position: index,
          payload: job,
        })),
      );

      if (state.candidates.length > 0) {
        await tx.insert(candidatesTable).values(
          state.candidates.map((item, index) => ({
            id: item.id,
            normalizedPhone: item.normalizedPhone,
            normalizedEmail: item.normalizedEmail,
            position: index,
            payload: item,
          })),
        );
      }

      if (state.applications.length > 0) {
        await tx.insert(applicationsTable).values(
          state.applications.map((item, index) => ({
            id: item.id,
            companyId: item.companyId,
            candidateId: item.candidateId,
            jobId: item.jobId,
            stage: item.stage,
            position: index,
            payload: item,
          })),
        );
      }

      if (state.candidateNotes.length > 0) {
        await tx.insert(candidateNotesTable).values(
          state.candidateNotes.map((item, index) => ({
            id: item.id,
            companyId: item.companyId,
            candidateId: item.candidateId,
            applicationId: item.applicationId,
            jobId: item.jobId,
            authorUserId: item.authorUserId,
            createdAt: item.createdAt,
            position: index,
            payload: item,
          })),
        );
      }

      if (state.interviewRuns.length > 0) {
        await tx.insert(interviewRunsTable).values(
          state.interviewRuns.map((item, index) => ({
            id: item.id,
            companyId: item.companyId,
            candidateId: item.candidateId,
            applicationId: item.applicationId,
            jobId: item.jobId,
            providerCallId: item.dispatch.providerCallId,
            position: index,
            payload: item,
          })),
        );
      }

      if (state.interviewPreparationPackages.length > 0) {
        await tx.insert(interviewPreparationPackagesTable).values(
          state.interviewPreparationPackages.map((item, index) => ({
            id: item.id,
            candidateId: item.candidateId,
            jobId: item.jobId,
            position: index,
            payload: item,
          })),
        );
      }

      if (state.dispatchRequests.length > 0) {
        await tx.insert(dispatchRequestsTable).values(
          state.dispatchRequests.map((item, index) => ({
            interviewRunId: item.interviewRunId,
            position: index,
            payload: item,
          })),
        );
      }

      if (state.dispatchPayloads.length > 0) {
        await tx.insert(dispatchPayloadsTable).values(
          state.dispatchPayloads.map((item, index) => ({
            interviewRunId: item.interviewRunId,
            position: index,
            payload: item,
          })),
        );
      }

      if (state.dispatchResponses.length > 0) {
        await tx.insert(dispatchResponsesTable).values(
          state.dispatchResponses.map((item, index) => ({
            interviewRunId: `dispatch_response_${index}`,
            position: index,
            payload: item,
          })),
        );
      }

      if (state.webhookRecords.length > 0) {
        await tx.insert(webhookRecordsTable).values(
          state.webhookRecords.map((item, index) => ({
            eventId: item.event.eventId,
            matchedInterviewRunId: item.matchedInterviewRunId,
            position: index,
            payload: item,
          })),
        );
      }

      if (state.runtimeTraceEvents.length > 0) {
        await tx.insert(runtimeTraceEventsTable).values(
          state.runtimeTraceEvents.map((item, index) => ({
            id: traceEventId(item, index),
            interviewRunId: item.interviewRunId,
            phase: item.phase,
            occurredAt: item.occurredAt,
            position: index,
            payload: item,
          })),
        );
      }

      if (state.evaluations.length > 0) {
        await tx.insert(evaluationsTable).values(
          state.evaluations.map((item, index) => ({
            id: item.id,
            companyId: item.companyId,
            interviewRunId: item.interviewRunId,
            position: index,
            payload: item,
          })),
        );
      }
    });
  } catch (error) {
    throw new Error(
      `Failed to save runtime state to Postgres. ${formatDatabaseError(error)}`,
    );
  }
}

export async function resetRuntimeStoreState() {
  if (!hasDatabaseUrl()) {
    Object.assign(memoryState, {
      companies: [],
      memberships: [],
      sessions: [],
      users: [],
      teams: [],
      teamMemberships: [],
      jobAccessGrants: [],
      jobs: seededPublicJobs.map((job) => ({ ...job })),
      candidates: [],
      applications: [],
      candidateNotes: [],
      interviewRuns: [],
      interviewPreparationPackages: [],
      dispatchRequests: [],
      dispatchPayloads: [],
      dispatchResponses: [],
      webhookRecords: [],
      runtimeTraceEvents: [],
      evaluations: [],
    });
    return;
  }

  const db = getDatabaseClient();
  await db.delete(companyMembershipsTable);
  await db.delete(sessionsTable);
  await db.delete(usersTable);
  await db.delete(companiesTable);
  await db.delete(teamMembershipsTable);
  await db.delete(jobAccessGrantsTable);
  await db.delete(teamsTable);
  await db.delete(candidatesTable);
  await db.delete(applicationsTable);
  await db.delete(candidateNotesTable);
  await db.delete(interviewRunsTable);
  await db.delete(interviewPreparationPackagesTable);
  await db.delete(dispatchRequestsTable);
  await db.delete(dispatchPayloadsTable);
  await db.delete(dispatchResponsesTable);
  await db.delete(webhookRecordsTable);
  await db.delete(runtimeTraceEventsTable);
  await db.delete(evaluationsTable);
  await db.delete(jobsTable);
  await ensureSeedJobs();
}

export async function findStoredJobById(jobId: string) {
  const state = await loadRuntimeStoreState();
  return state.jobs.find((job) => job.id === jobId) ?? null;
}

export async function findStoredJobByPublicSlug(slug: string) {
  const state = await loadRuntimeStoreState();
  return (
    state.jobs.find((job) => publicApplySlug(job.publicApplyPath) === slug) ?? null
  );
}

export async function findStoredJobByRecruiterSlug(slug: string) {
  const state = await loadRuntimeStoreState();
  return state.jobs.find((job) => job.recruiterSlug === slug) ?? null;
}

export async function listStoredJobs() {
  const state = await loadRuntimeStoreState();
  return state.jobs;
}

export async function saveStoredJob(job: SeededPublicJobRecord) {
  const state = await loadRuntimeStoreState();
  const existingIndex = state.jobs.findIndex((item) => item.id === job.id);

  if (existingIndex >= 0) {
    state.jobs[existingIndex] = job;
  } else {
    state.jobs.push(job);
  }

  await saveRuntimeStoreState(state);

  return job;
}
