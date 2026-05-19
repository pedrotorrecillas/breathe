import type {
  ATSCanonicalApplication,
  ATSCanonicalCandidate,
  ATSCanonicalJob,
  ATSCanonicalStage,
  ATSSyncEvent,
} from "@/domain/ats-integrations/types";
import { getATSAdapter } from "@/lib/ats-integrations/registry";
import type {
  ATSProviderApplication,
  ATSProviderCandidate,
  ATSProviderJob,
  ATSProviderStage,
} from "@/lib/ats-integrations/adapters/types";
import {
  loadRuntimeStoreState,
  saveRuntimeStoreState,
  type RuntimeStoreState,
} from "@/lib/db/runtime-store";
import { evaluateATSTriggerRules } from "@/lib/ats-integrations/triggers";
import { buildATSWorkflowRequestsForEvent } from "@/lib/ats-integrations/workflow-requests";

export type RunATSSyncResult = {
  importedJobs: number;
  importedCandidates: number;
  importedApplications: number;
  importedStages: number;
  createdEvents: number;
  createdWorkflowRequests: number;
};

type RunATSSyncInput = {
  companyId: string;
  connectionId: string;
  now: string;
};

type ProviderRecord = {
  externalId: string;
  externalUpdatedAt?: string | null;
};

function sanitizeIdPart(value: string) {
  return value.replace(/[^a-zA-Z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}

function canonicalRecordId(
  prefix: string,
  connectionId: string,
  externalId: string,
) {
  return `${prefix}_${sanitizeIdPart(connectionId)}_${sanitizeIdPart(externalId)}`;
}

function upsertById<TRecord extends { id: string }>(
  records: TRecord[],
  record: TRecord,
) {
  const existingIndex = records.findIndex((item) => item.id === record.id);

  if (existingIndex >= 0) {
    records[existingIndex] = record;
    return false;
  }

  records.push(record);
  return true;
}

function eventIdempotencyKey(input: {
  connectionId: string;
  eventType: ATSSyncEvent["eventType"];
  externalObjectType: ATSSyncEvent["externalObjectType"];
  externalObjectId: string;
  externalUpdatedAt: string | null;
}) {
  return [
    input.connectionId,
    input.eventType,
    input.externalObjectType,
    input.externalObjectId,
    input.externalUpdatedAt ?? "none",
  ].join(":");
}

function appendSyncEventOnce(state: RuntimeStoreState, event: ATSSyncEvent) {
  const exists = state.atsSyncEvents.some(
    (item) => item.idempotencyKey === event.idempotencyKey,
  );

  if (exists) {
    return false;
  }

  state.atsSyncEvents.push(event);
  return true;
}

function appendWorkflowRequestsForEvent(input: {
  state: RuntimeStoreState;
  event: ATSSyncEvent;
  now: string;
}) {
  if (input.event.externalObjectType !== "application") {
    return 0;
  }

  const matches = evaluateATSTriggerRules({
    rules: input.state.atsTriggerRules,
    event: input.event,
  });

  if (matches.length === 0) {
    return 0;
  }

  const requests = buildATSWorkflowRequestsForEvent({
    event: input.event,
    matches,
    now: input.now,
  });
  let createdCount = 0;

  for (const request of requests) {
    if (
      input.state.atsWorkflowRequests.some((item) => item.id === request.id)
    ) {
      continue;
    }

    input.state.atsWorkflowRequests.push(request);
    createdCount += 1;
  }

  input.state.atsSyncEvents = input.state.atsSyncEvents.map((item) =>
    item.id === input.event.id
      ? {
          ...item,
          processedAt: input.now,
        }
      : item,
  );

  return createdCount;
}

function canonicalJob(input: {
  companyId: string;
  connectionId: string;
  provider: ATSCanonicalJob["provider"];
  now: string;
  record: ATSProviderJob;
}): ATSCanonicalJob {
  return {
    id: canonicalRecordId(
      "ats_job",
      input.connectionId,
      input.record.externalId,
    ),
    companyId: input.companyId,
    connectionId: input.connectionId,
    provider: input.provider,
    externalId: input.record.externalId,
    externalUrl: input.record.externalUrl,
    title: input.record.title,
    status: input.record.status,
    externalUpdatedAt: input.record.externalUpdatedAt,
    lastSeenAt: input.now,
    rawSnapshot: input.record.raw,
  };
}

function canonicalCandidate(input: {
  companyId: string;
  connectionId: string;
  provider: ATSCanonicalCandidate["provider"];
  now: string;
  record: ATSProviderCandidate;
}): ATSCanonicalCandidate {
  return {
    id: canonicalRecordId(
      "ats_candidate",
      input.connectionId,
      input.record.externalId,
    ),
    companyId: input.companyId,
    connectionId: input.connectionId,
    provider: input.provider,
    externalId: input.record.externalId,
    externalUrl: input.record.externalUrl,
    fullName: input.record.fullName,
    email: input.record.email,
    phone: input.record.phone,
    status: input.record.status,
    externalUpdatedAt: input.record.externalUpdatedAt,
    lastSeenAt: input.now,
    rawSnapshot: input.record.raw,
  };
}

function canonicalStage(input: {
  companyId: string;
  connectionId: string;
  provider: ATSCanonicalStage["provider"];
  now: string;
  record: ATSProviderStage;
}): ATSCanonicalStage {
  return {
    id: canonicalRecordId(
      "ats_stage",
      input.connectionId,
      input.record.externalId,
    ),
    companyId: input.companyId,
    connectionId: input.connectionId,
    provider: input.provider,
    externalJobId: input.record.externalJobId,
    externalId: input.record.externalId,
    name: input.record.name,
    category: input.record.category,
    position: input.record.position,
    status: "active",
    lastSeenAt: input.now,
    rawSnapshot: input.record.raw,
  };
}

function canonicalApplication(input: {
  companyId: string;
  connectionId: string;
  provider: ATSCanonicalApplication["provider"];
  now: string;
  record: ATSProviderApplication;
}): ATSCanonicalApplication {
  return {
    id: canonicalRecordId(
      "ats_application",
      input.connectionId,
      input.record.externalId,
    ),
    companyId: input.companyId,
    connectionId: input.connectionId,
    provider: input.provider,
    externalId: input.record.externalId,
    externalCandidateId: input.record.externalCandidateId,
    externalJobId: input.record.externalJobId,
    externalStageId: input.record.externalStageId,
    externalUrl: input.record.externalUrl,
    internalCandidateId: null,
    internalApplicationId: null,
    internalJobId: null,
    candidateName: input.record.candidateName,
    candidateEmail: input.record.candidateEmail,
    candidatePhone: input.record.candidatePhone,
    jobTitle: input.record.jobTitle,
    stageName: input.record.stageName,
    stageCategory: input.record.stageCategory,
    status: input.record.status,
    externalUpdatedAt: input.record.externalUpdatedAt,
    lastSeenAt: input.now,
    rawSnapshot: input.record.raw,
  };
}

function buildEvent(input: {
  companyId: string;
  connectionId: string;
  provider: ATSSyncEvent["provider"];
  eventType: ATSSyncEvent["eventType"];
  externalObjectType: ATSSyncEvent["externalObjectType"];
  externalObjectId: string;
  externalJobId: string | null;
  externalCandidateId: string | null;
  externalStageId: string | null;
  occurredAt: string;
  externalUpdatedAt: string | null;
  payload: Record<string, unknown>;
}): ATSSyncEvent {
  const idempotencyKey = eventIdempotencyKey({
    connectionId: input.connectionId,
    eventType: input.eventType,
    externalObjectType: input.externalObjectType,
    externalObjectId: input.externalObjectId,
    externalUpdatedAt: input.externalUpdatedAt,
  });

  return {
    id: `ats_evt_${sanitizeIdPart(idempotencyKey)}`,
    companyId: input.companyId,
    connectionId: input.connectionId,
    provider: input.provider,
    eventType: input.eventType,
    externalObjectType: input.externalObjectType,
    externalObjectId: input.externalObjectId,
    externalJobId: input.externalJobId,
    externalCandidateId: input.externalCandidateId,
    externalStageId: input.externalStageId,
    occurredAt: input.occurredAt,
    processedAt: null,
    idempotencyKey,
    payload: input.payload,
  };
}

function eventUpdatedAt(record: ProviderRecord) {
  return record.externalUpdatedAt ?? null;
}

export async function runATSSync(
  input: RunATSSyncInput,
): Promise<RunATSSyncResult> {
  const state = await loadRuntimeStoreState();
  const connection = state.atsConnections.find(
    (item) =>
      item.id === input.connectionId && item.companyId === input.companyId,
  );

  if (!connection) {
    throw new Error("ATS connection not found.");
  }

  if (connection.status !== "active") {
    throw new Error("ATS connection is not active.");
  }

  const adapter = getATSAdapter(connection.provider);
  const result: RunATSSyncResult = {
    importedJobs: 0,
    importedCandidates: 0,
    importedApplications: 0,
    importedStages: 0,
    createdEvents: 0,
    createdWorkflowRequests: 0,
  };

  const jobsPage = await adapter.listJobs({
    connection,
    cursor: null,
    limit: 200,
  });
  for (const job of jobsPage.records) {
    const record = canonicalJob({
      companyId: input.companyId,
      connectionId: connection.id,
      provider: connection.provider,
      now: input.now,
      record: job,
    });
    if (upsertById(state.atsExternalJobs, record)) {
      result.importedJobs += 1;
    }

    const jobEvent = buildEvent({
      companyId: input.companyId,
      connectionId: connection.id,
      provider: connection.provider,
      eventType: "job_seen",
      externalObjectType: "job",
      externalObjectId: job.externalId,
      externalJobId: job.externalId,
      externalCandidateId: null,
      externalStageId: null,
      occurredAt: input.now,
      externalUpdatedAt: eventUpdatedAt(job),
      payload: job.raw,
    });

    if (appendSyncEventOnce(state, jobEvent)) {
      result.createdEvents += 1;
      result.createdWorkflowRequests += appendWorkflowRequestsForEvent({
        state,
        event: jobEvent,
        now: input.now,
      });
    }

    const stages = await adapter.listStages({
      connection,
      externalJobId: job.externalId,
    });

    for (const stage of stages) {
      const stageRecord = canonicalStage({
        companyId: input.companyId,
        connectionId: connection.id,
        provider: connection.provider,
        now: input.now,
        record: stage,
      });
      if (upsertById(state.atsExternalStages, stageRecord)) {
        result.importedStages += 1;
      }
    }
  }

  const applicationsPage = await adapter.listApplications({
    connection,
    cursor: null,
    limit: 200,
  });

  for (const application of applicationsPage.records) {
    const candidate = await adapter.getCandidate({
      connection,
      externalCandidateId: application.externalCandidateId,
    });

    if (candidate) {
      const candidateRecord = canonicalCandidate({
        companyId: input.companyId,
        connectionId: connection.id,
        provider: connection.provider,
        now: input.now,
        record: candidate,
      });
      if (upsertById(state.atsExternalCandidates, candidateRecord)) {
        result.importedCandidates += 1;
      }

      const candidateEvent = buildEvent({
        companyId: input.companyId,
        connectionId: connection.id,
        provider: connection.provider,
        eventType: "candidate_seen",
        externalObjectType: "candidate",
        externalObjectId: candidate.externalId,
        externalJobId: application.externalJobId,
        externalCandidateId: candidate.externalId,
        externalStageId: application.externalStageId,
        occurredAt: input.now,
        externalUpdatedAt: eventUpdatedAt(candidate),
        payload: candidate.raw,
      });

      if (appendSyncEventOnce(state, candidateEvent)) {
        result.createdEvents += 1;
        result.createdWorkflowRequests += appendWorkflowRequestsForEvent({
          state,
          event: candidateEvent,
          now: input.now,
        });
      }
    }

    const applicationRecord = canonicalApplication({
      companyId: input.companyId,
      connectionId: connection.id,
      provider: connection.provider,
      now: input.now,
      record: application,
    });
    if (upsertById(state.atsExternalApplications, applicationRecord)) {
      result.importedApplications += 1;
    }

    const applicationEvent = buildEvent({
      companyId: input.companyId,
      connectionId: connection.id,
      provider: connection.provider,
      eventType: "application_seen",
      externalObjectType: "application",
      externalObjectId: application.externalId,
      externalJobId: application.externalJobId,
      externalCandidateId: application.externalCandidateId,
      externalStageId: application.externalStageId,
      occurredAt: input.now,
      externalUpdatedAt: eventUpdatedAt(application),
      payload: application.raw,
    });

    if (appendSyncEventOnce(state, applicationEvent)) {
      result.createdEvents += 1;
      result.createdWorkflowRequests += appendWorkflowRequestsForEvent({
        state,
        event: applicationEvent,
        now: input.now,
      });
    }
  }

  state.atsConnections = state.atsConnections.map((item) =>
    item.id === connection.id
      ? {
          ...item,
          lastSyncAt: input.now,
          lastError: null,
          updatedAt: input.now,
        }
      : item,
  );

  await saveRuntimeStoreState(state);

  return result;
}
