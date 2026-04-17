import type {
  CandidateApplication,
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
import type { RuntimeTraceEvent } from "@/lib/runtime-tracing";
import { getDatabaseClient, hasDatabaseUrl } from "@/lib/db/client";
import {
  applicationsTable,
  candidatesTable,
  dispatchPayloadsTable,
  dispatchRequestsTable,
  dispatchResponsesTable,
  evaluationsTable,
  interviewPreparationPackagesTable,
  interviewRunsTable,
  jobsTable,
  runtimeTraceEventsTable,
  webhookRecordsTable,
} from "@/lib/db/schema";
import { seededPublicJobs, type SeededPublicJobRecord } from "@/lib/job-seeds";

export type RuntimeStoreState = {
  jobs: SeededPublicJobRecord[];
  candidates: CandidateProfile[];
  applications: CandidateApplication[];
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
  jobs: seededPublicJobs.map((job) => ({ ...job })),
  candidates: [],
  applications: [],
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
    jobs: [...state.jobs],
    candidates: [...state.candidates],
    applications: [...state.applications],
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
  const rows = await db.select().from(jobsTable).limit(1);

  if (rows.length > 0) {
    return;
  }

  await db.insert(jobsTable).values(
    seededPublicJobs.map((job, index) => ({
      id: job.id,
      recruiterSlug: job.recruiterSlug,
      publicApplySlug: publicApplySlug(job.publicApplyPath),
      position: index,
      payload: job,
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
      jobs,
      candidates,
      applications,
      interviewRuns,
      interviewPreparationPackages,
      dispatchRequests,
      dispatchPayloads,
      dispatchResponses,
      webhookRecords,
      runtimeTraceEvents,
      evaluations,
    ] = await Promise.all([
      db.select().from(jobsTable),
      db.select().from(candidatesTable),
      db.select().from(applicationsTable),
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
      jobs: jobs
        .sort((left, right) => left.position - right.position)
        .map((row) => row.payload as SeededPublicJobRecord),
      candidates: candidates
        .sort((left, right) => left.position - right.position)
        .map((row) => row.payload as CandidateProfile),
      applications: applications
        .sort((left, right) => left.position - right.position)
        .map((row) => row.payload as CandidateApplication),
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
    await tx.delete(candidatesTable);
    await tx.delete(applicationsTable);
    await tx.delete(interviewRunsTable);
    await tx.delete(interviewPreparationPackagesTable);
    await tx.delete(dispatchRequestsTable);
    await tx.delete(dispatchPayloadsTable);
    await tx.delete(dispatchResponsesTable);
    await tx.delete(webhookRecordsTable);
    await tx.delete(runtimeTraceEventsTable);
    await tx.delete(evaluationsTable);
    await tx.delete(jobsTable);

    await tx.insert(jobsTable).values(
      state.jobs.map((job, index) => ({
        id: job.id,
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
          candidateId: item.candidateId,
          jobId: item.jobId,
          stage: item.stage,
          position: index,
          payload: item,
        })),
      );
    }

    if (state.interviewRuns.length > 0) {
      await tx.insert(interviewRunsTable).values(
        state.interviewRuns.map((item, index) => ({
          id: item.id,
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
      jobs: seededPublicJobs.map((job) => ({ ...job })),
      candidates: [],
      applications: [],
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
  await db.delete(candidatesTable);
  await db.delete(applicationsTable);
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
