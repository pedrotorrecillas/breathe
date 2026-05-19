import type {
  ATSCanonicalApplication,
  ATSConnection,
  ATSSyncEvent,
  ATSWritebackActionType,
  ATSWorkflowRequest,
  ATSWritebackAction,
  ATSWritebackPolicy,
} from "@/domain/ats-integrations/types";
import type {
  CandidateApplication,
  CandidatePipelineStage,
  CandidateProfile,
} from "@/domain/candidates/types";
import type { CandidateEvaluation } from "@/domain/evaluations/types";
import type { InterviewRun } from "@/domain/interviews/types";
import type { ATSTriggerMatch } from "@/lib/ats-integrations/triggers";
import {
  loadRuntimeStoreState,
  saveRuntimeStoreState,
} from "@/lib/db/runtime-store";

function sanitizeIdPart(value: string) {
  return value.replace(/[^a-zA-Z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}

function normalizeEmail(value: string | null) {
  return value?.trim().toLowerCase() || null;
}

function normalizePhone(value: string | null) {
  return value?.replace(/[^\d+]/g, "") || "";
}

const defaultWritebackPolicy: ATSWritebackPolicy = {
  reportMode: "candidate_note",
  moveToExternalStageId: null,
  requiresRecruiterReview: true,
};

function buildEvaluationPayload(input: { evaluation: CandidateEvaluation }) {
  return {
    summary: `${input.evaluation.finalScoreState}: ${
      input.evaluation.finalNumericScore ?? "Pending"
    }`,
    fitClassification: input.evaluation.fitClassification ?? null,
  };
}

function buildWritebackAction(input: {
  application: ATSCanonicalApplication;
  evaluation: CandidateEvaluation;
  actionType: ATSWritebackActionType;
  targetExternalStageId: string | null;
  now: string;
}): ATSWritebackAction {
  const idempotencyKey = [
    input.application.connectionId,
    input.application.externalId,
    "evaluation",
    input.evaluation.id,
    input.actionType,
  ].join(":");

  return {
    id: `ats_writeback_${sanitizeIdPart(idempotencyKey)}`,
    companyId: input.evaluation.companyId,
    connectionId: input.application.connectionId,
    provider: input.application.provider,
    actionType: input.actionType,
    targetExternalCandidateId: input.application.externalCandidateId,
    targetExternalApplicationId: input.application.externalId,
    targetExternalJobId: input.application.externalJobId,
    targetExternalStageId: input.targetExternalStageId,
    sourceObjectType: "evaluation",
    sourceObjectId: input.evaluation.id,
    status: "queued",
    idempotencyKey,
    payload: buildEvaluationPayload({ evaluation: input.evaluation }),
    createdAt: input.now,
    updatedAt: input.now,
  };
}

function applicationStageFromATSApplication(
  application: ATSCanonicalApplication,
): CandidatePipelineStage {
  if (application.stageCategory === "interview") {
    return "interviewed";
  }

  if (application.stageCategory === "evaluation") {
    return "shortlisted";
  }

  if (application.stageCategory === "hired") {
    return "hired";
  }

  if (application.stageCategory === "rejected") {
    return "rejected";
  }

  return "applicant";
}

function buildImportedCandidate(input: {
  application: ATSCanonicalApplication;
  now: string;
}): CandidateProfile {
  return {
    id: `ats_cand_${sanitizeIdPart(input.application.connectionId)}_${sanitizeIdPart(
      input.application.externalCandidateId,
    )}`,
    companyId: input.application.companyId,
    fullName: input.application.candidateName,
    phone: input.application.candidatePhone ?? "",
    normalizedPhone: normalizePhone(input.application.candidatePhone),
    email: input.application.candidateEmail,
    normalizedEmail: normalizeEmail(input.application.candidateEmail),
    linkedinUrl: null,
    cvAssetRef: null,
    locale: "es",
    source: "ats",
    consentAcceptedAt: null,
  };
}

function buildImportedApplication(input: {
  atsApplication: ATSCanonicalApplication;
  candidateId: string;
  jobId: string;
  now: string;
}): CandidateApplication {
  return {
    id: `ats_app_${sanitizeIdPart(input.atsApplication.connectionId)}_${sanitizeIdPart(
      input.atsApplication.externalId,
    )}`,
    companyId: input.atsApplication.companyId,
    candidateId: input.candidateId,
    jobId: input.jobId,
    source: "ats",
    stage: applicationStageFromATSApplication(input.atsApplication),
    submittedAt:
      input.atsApplication.externalUpdatedAt ??
      input.atsApplication.lastSeenAt ??
      input.now,
    needsHumanReviewAt: null,
    legalAcceptance: null,
    recruiterOutcomeNote: null,
  };
}

export function buildATSWorkflowRequestsForEvent(input: {
  event: ATSSyncEvent;
  matches: ATSTriggerMatch[];
  now: string;
}): ATSWorkflowRequest[] {
  return input.matches.map((match) => ({
    id: `ats_workflow_${input.event.id}_${match.ruleId}`,
    companyId: input.event.companyId,
    atsSyncEventId: input.event.id,
    atsTriggerRuleId: match.ruleId,
    externalApplicationId: input.event.externalObjectId,
    internalCandidateId: null,
    internalApplicationId: null,
    requestedActions: match.actions,
    requiresRecruiterApproval: match.requiresRecruiterApproval,
    status: "queued",
    createdAt: input.now,
    updatedAt: input.now,
  }));
}

export function enqueueATSWritebacksForEvaluation(input: {
  evaluation: CandidateEvaluation;
  interviewRun: InterviewRun;
  atsConnections: ATSConnection[];
  atsApplications: ATSCanonicalApplication[];
  existingActions: ATSWritebackAction[];
  now: string;
}): ATSWritebackAction[] {
  const linkedApplication = input.atsApplications.find(
    (application) =>
      application.internalApplicationId === input.interviewRun.applicationId ||
      application.internalCandidateId === input.interviewRun.candidateId,
  );

  if (!linkedApplication) {
    return [];
  }

  const connection = input.atsConnections.find(
    (item) =>
      item.id === linkedApplication.connectionId &&
      item.companyId === linkedApplication.companyId,
  );
  const policy = connection?.writebackPolicy ?? defaultWritebackPolicy;
  const actionTypes: ATSWritebackActionType[] = [];

  if (policy.reportMode !== "disabled") {
    actionTypes.push(policy.reportMode);
  }

  if (policy.moveToExternalStageId) {
    actionTypes.push("application_stage_move");
  }

  return actionTypes
    .map((actionType) =>
      buildWritebackAction({
        application: linkedApplication,
        evaluation: input.evaluation,
        actionType,
        targetExternalStageId:
          actionType === "application_stage_move"
            ? policy.moveToExternalStageId
            : null,
        now: input.now,
      }),
    )
    .filter(
      (action) =>
        !input.existingActions.some(
          (existing) => existing.idempotencyKey === action.idempotencyKey,
        ),
    );
}

export async function processATSWorkflowRequest(input: {
  workflowRequestId: string;
  now: string;
  approved?: boolean;
}): Promise<{
  status: "waiting_for_approval" | "completed" | "skipped" | "error";
  request: ATSWorkflowRequest;
  candidateId: string | null;
  applicationId: string | null;
}> {
  const state = await loadRuntimeStoreState();
  const request = state.atsWorkflowRequests.find(
    (item) => item.id === input.workflowRequestId,
  );

  if (!request) {
    throw new Error("ATS workflow request not found.");
  }

  if (request.requiresRecruiterApproval && !input.approved) {
    return {
      status: "waiting_for_approval",
      request,
      candidateId: request.internalCandidateId,
      applicationId: request.internalApplicationId,
    };
  }

  if (!request.requestedActions.includes("import_candidate")) {
    const skippedRequest = {
      ...request,
      status: "skipped" as const,
      updatedAt: input.now,
    };
    state.atsWorkflowRequests = state.atsWorkflowRequests.map((item) =>
      item.id === request.id ? skippedRequest : item,
    );
    await saveRuntimeStoreState(state);

    return {
      status: "skipped",
      request: skippedRequest,
      candidateId: request.internalCandidateId,
      applicationId: request.internalApplicationId,
    };
  }

  const atsApplication = state.atsExternalApplications.find(
    (item) =>
      item.companyId === request.companyId &&
      item.externalId === request.externalApplicationId,
  );

  if (!atsApplication) {
    const errorRequest = {
      ...request,
      status: "error" as const,
      updatedAt: input.now,
    };
    state.atsWorkflowRequests = state.atsWorkflowRequests.map((item) =>
      item.id === request.id ? errorRequest : item,
    );
    await saveRuntimeStoreState(state);

    return {
      status: "error",
      request: errorRequest,
      candidateId: null,
      applicationId: null,
    };
  }

  const linkedJob =
    state.jobs.find(
      (job) =>
        job.companyId === atsApplication.companyId &&
        job.id === atsApplication.internalJobId,
    ) ??
    state.jobs.find(
      (job) =>
        job.companyId === atsApplication.companyId &&
        job.title === atsApplication.jobTitle,
    ) ??
    null;

  if (!linkedJob) {
    const errorRequest = {
      ...request,
      status: "error" as const,
      updatedAt: input.now,
    };
    state.atsWorkflowRequests = state.atsWorkflowRequests.map((item) =>
      item.id === request.id ? errorRequest : item,
    );
    await saveRuntimeStoreState(state);

    return {
      status: "error",
      request: errorRequest,
      candidateId: null,
      applicationId: null,
    };
  }

  const normalizedEmail = normalizeEmail(atsApplication.candidateEmail);
  const normalizedPhone = normalizePhone(atsApplication.candidatePhone);
  let candidate =
    state.candidates.find(
      (item) =>
        item.companyId === atsApplication.companyId &&
        ((normalizedEmail && item.normalizedEmail === normalizedEmail) ||
          (normalizedPhone && item.normalizedPhone === normalizedPhone)),
    ) ?? null;

  if (!candidate) {
    candidate = buildImportedCandidate({
      application: atsApplication,
      now: input.now,
    });
    state.candidates.push(candidate);
  }

  let application =
    state.applications.find(
      (item) =>
        item.companyId === atsApplication.companyId &&
        item.candidateId === candidate.id &&
        item.jobId === linkedJob.id,
    ) ?? null;

  if (!application) {
    application = buildImportedApplication({
      atsApplication,
      candidateId: candidate.id,
      jobId: linkedJob.id,
      now: input.now,
    });
    state.applications.push(application);
  }

  const completedRequest: ATSWorkflowRequest = {
    ...request,
    internalCandidateId: candidate.id,
    internalApplicationId: application.id,
    status: "completed",
    updatedAt: input.now,
  };

  state.atsExternalApplications = state.atsExternalApplications.map((item) =>
    item.id === atsApplication.id
      ? {
          ...item,
          internalCandidateId: candidate.id,
          internalApplicationId: application.id,
          internalJobId: linkedJob.id,
        }
      : item,
  );
  state.atsWorkflowRequests = state.atsWorkflowRequests.map((item) =>
    item.id === request.id ? completedRequest : item,
  );
  await saveRuntimeStoreState(state);

  return {
    status: "completed",
    request: completedRequest,
    candidateId: candidate.id,
    applicationId: application.id,
  };
}
