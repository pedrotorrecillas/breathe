import type {
  CandidateApplication,
  CandidateProfile,
  CandidateSource,
} from "@/domain/candidates/types";
import type { CandidateEvaluation } from "@/domain/evaluations/types";
import type { InterviewPreparationPackage } from "@/domain/interview-preparation/types";
import type { InterviewRun } from "@/domain/interviews/types";
import type { SupportedLanguage } from "@/domain/shared/types";
import type {
  HappyRobotCallRequest,
  HappyRobotDispatchResponse,
  HappyRobotNormalizedDispatchPayload,
  HappyRobotWebhookIngestionResponse,
  HappyRobotWebhookRecord,
} from "@/domain/runtime/happyrobot/types";
import {
  loadRuntimeStoreState,
  resetRuntimeStoreState,
  saveRuntimeStoreState,
  type RuntimeStoreState,
} from "@/lib/db/runtime-store";
import { buildEvaluationSummary } from "@/lib/evaluation-summary";
import { extractRequirementEvidenceFromTranscript } from "@/lib/evaluation-requirement-extraction";
import { scoreEvaluationFromRequirementEvidence } from "@/lib/evaluation-scoring";
import { executeHappyRobotDispatch } from "@/lib/happyrobot-orchestration";
import { ingestHappyRobotWebhookEvent } from "@/lib/happyrobot-webhooks";
import { transitionCandidateApplicationForInterviewRun } from "@/lib/interview-pipeline-transitions";
import {
  findPublicJobById,
  isPublicJobAvailable,
  type PublicJobRecord,
} from "@/lib/public-jobs";
import type {
  NormalizedCandidateProfileSource,
  PublicApplyLegalAcceptance,
} from "@/lib/public-apply";
import type { RuntimeTraceEvent, RuntimeTraceSink } from "@/lib/runtime-tracing";

type PublicApplySubmissionInput = {
  jobId: string;
  fullName: string;
  phone: string;
  email: string;
  language: SupportedLanguage;
  profileSource: NormalizedCandidateProfileSource;
  legalAcceptance: PublicApplyLegalAcceptance;
};

type PublicApplyFailureMode = "candidate" | "application" | "interview";
type PublicApplyTraceSink = RuntimeTraceSink;

type TranscriptSegment = {
  text: string;
  startMs?: number | null;
  endMs?: number | null;
};

type TranscriptResolver = (input: {
  interviewRun: InterviewRun;
  interviewPreparationPackage: InterviewPreparationPackage;
  candidate: CandidateProfile;
  application: CandidateApplication;
  job: PublicJobRecord;
  transcriptUrl: string | null;
  webhookRecord: HappyRobotWebhookRecord;
}) => string | TranscriptSegment[] | null;

function buildPublicJobAvailabilityError(job: PublicJobRecord) {
  const availability = isPublicJobAvailable(job);

  if (availability.isAvailable) {
    return null;
  }

  return availability.reason === "inactive"
    ? "Application intake is closed for this job."
    : "This job has already reached its interview limit.";
}

export type InterviewRunRuntimeSnapshot = {
  interviewRun: InterviewRun;
  candidate: CandidateProfile | null;
  application: CandidateApplication | null;
  interviewPreparationPackage: InterviewPreparationPackage | null;
  dispatchRequest: HappyRobotCallRequest | null;
  dispatchPayload: HappyRobotNormalizedDispatchPayload | null;
  dispatchResponse: HappyRobotDispatchResponse | null;
  webhookRecords: HappyRobotWebhookRecord[];
  runtimeTraceEvents: RuntimeTraceEvent[];
  evaluation: CandidateEvaluation | null;
};

function normalizePhone(phone: string) {
  const trimmed = phone.trim();
  const hasPlusPrefix = trimmed.startsWith("+");
  const digits = trimmed.replace(/[^\d]/g, "");
  return `${hasPlusPrefix ? "+" : ""}${digits}`;
}

function normalizeEmail(email: string) {
  const trimmed = email.trim().toLowerCase();
  return trimmed || null;
}

function nextId(prefix: string, count: number) {
  return `${prefix}_${count + 1}`;
}

function candidateBelongsToCompany(
  state: RuntimeStoreState,
  candidate: CandidateProfile,
  companyId: string,
) {
  if (candidate.companyId === companyId) {
    return true;
  }

  return state.applications.some(
    (application) =>
      application.candidateId === candidate.id && application.companyId === companyId,
  );
}

function appendRuntimeTraceEvent(
  state: RuntimeStoreState,
  event: RuntimeTraceEvent,
  sink?: RuntimeTraceSink,
) {
  state.runtimeTraceEvents.push(event);
  sink?.(event);
}

function syncApplicationFromInterviewRun(
  state: RuntimeStoreState,
  interviewRun: InterviewRun,
) {
  const applicationIndex = state.applications.findIndex(
    (application) => application.id === interviewRun.applicationId,
  );

  if (applicationIndex < 0) {
    return;
  }

  state.applications[applicationIndex] =
    transitionCandidateApplicationForInterviewRun(
      state.applications[applicationIndex],
      interviewRun.status,
      interviewRun.pipelineStage,
      interviewRun.metadata.callbackRequestedAt,
    );
}

function normalizeTranscriptResolution(
  transcript: string | TranscriptSegment[],
): string | TranscriptSegment[] | null {
  if (typeof transcript === "string") {
    return transcript.trim() ? transcript : null;
  }

  const segments = transcript
    .map((segment) => ({
      text: segment.text.trim(),
      startMs: segment.startMs ?? null,
      endMs: segment.endMs ?? null,
    }))
    .filter((segment) => segment.text.length > 0);

  return segments.length > 0 ? segments : null;
}

function resolveTranscriptFromWebhookRecord(
  webhookRecord: HappyRobotWebhookRecord,
): string | TranscriptSegment[] | null {
  if (typeof webhookRecord.event.transcript === "string") {
    const transcript = webhookRecord.event.transcript.trim();
    if (transcript.length > 0) {
      return transcript;
    }
  }

  if (
    Array.isArray(webhookRecord.event.transcriptSegments) &&
    webhookRecord.event.transcriptSegments.length > 0
  ) {
    return webhookRecord.event.transcriptSegments.map((segment) => ({
      text: segment.text,
      startMs: segment.startMs ?? null,
      endMs: segment.endMs ?? null,
    }));
  }

  return null;
}

function buildRuntimeSnapshot(
  state: RuntimeStoreState,
  interviewRunId: string,
): InterviewRunRuntimeSnapshot | null {
  const interviewRun = state.interviewRuns.find((run) => run.id === interviewRunId);

  if (!interviewRun) {
    return null;
  }

  const candidate =
    state.candidates.find((item) => item.id === interviewRun.candidateId) ?? null;
  const application =
    state.applications.find((item) => item.id === interviewRun.applicationId) ?? null;
  const interviewPreparationPackage =
    state.interviewPreparationPackages.find(
      (item) => item.id === interviewRun.interviewPreparationId,
    ) ?? null;
  const dispatchRequest =
    state.dispatchRequests.find((item) => item.interviewRunId === interviewRunId) ??
    null;
  const dispatchPayload =
    state.dispatchPayloads.find((item) => item.interviewRunId === interviewRunId) ??
    null;
  const dispatchResponse =
    state.dispatchResponses.find((item) => item.interviewRunId === interviewRunId) ??
    null;
  const evaluation =
    state.evaluations.find((item) => item.interviewRunId === interviewRunId) ?? null;

  return {
    interviewRun,
    candidate,
    application,
    interviewPreparationPackage,
    dispatchRequest,
    dispatchPayload,
    dispatchResponse,
    webhookRecords: state.webhookRecords.filter(
      (record) => record.matchedInterviewRunId === interviewRunId,
    ),
    runtimeTraceEvents: state.runtimeTraceEvents.filter(
      (event) => event.interviewRunId === interviewRunId,
    ),
    evaluation,
  };
}

async function maybeGenerateInterviewEvaluation(input: {
  state: RuntimeStoreState;
  interviewRun: InterviewRun;
  transcriptResolver?: TranscriptResolver;
}): Promise<CandidateEvaluation | null> {
  if (input.interviewRun.status !== "completed") {
    return null;
  }

  const snapshot = buildRuntimeSnapshot(input.state, input.interviewRun.id);
  if (!snapshot) {
    return null;
  }

  const job = await findPublicJobById(snapshot.interviewRun.jobId);
  if (
    !job ||
    !snapshot.interviewPreparationPackage ||
    !snapshot.application ||
    !snapshot.candidate
  ) {
    return null;
  }

  const transcriptUrl = snapshot.interviewRun.artifacts.transcriptUrl;
  if (!input.transcriptResolver) {
    return null;
  }

  const resolvedTranscript = input.transcriptResolver({
      interviewRun: snapshot.interviewRun,
      interviewPreparationPackage: snapshot.interviewPreparationPackage,
      candidate: snapshot.candidate,
      application: snapshot.application,
      job,
      transcriptUrl,
      webhookRecord:
        snapshot.webhookRecords[snapshot.webhookRecords.length - 1] ?? {
          event: {
            eventId: `evt_${snapshot.interviewRun.id}`,
            interviewRunId: snapshot.interviewRun.id,
            providerCallId: snapshot.interviewRun.dispatch.providerCallId ?? "",
            status: "completed",
            happenedAt:
              snapshot.interviewRun.trace.completedAt ??
              snapshot.interviewRun.trace.lastEventAt ??
              snapshot.interviewRun.trace.createdAt,
            recordingUrl: snapshot.interviewRun.artifacts.recordingUrl,
            transcriptUrl,
            failureReason: snapshot.interviewRun.metadata.failureReason,
            rawPayloadRef: snapshot.interviewRun.artifacts.providerPayloadSnapshotRef,
          },
          matchedInterviewRunId: snapshot.interviewRun.id,
          receivedAt:
            snapshot.interviewRun.trace.completedAt ??
            snapshot.interviewRun.trace.lastEventAt ??
            snapshot.interviewRun.trace.createdAt,
          rawPayload: {},
        },
    });

  if (!resolvedTranscript) {
    return null;
  }

  const transcript = normalizeTranscriptResolution(resolvedTranscript);

  if (!transcript) {
    return null;
  }

  const generatedAt = new Date(
    snapshot.interviewRun.trace.completedAt ??
      snapshot.interviewRun.trace.lastEventAt ??
      snapshot.interviewRun.trace.createdAt,
  );

  const requirementEvidence = extractRequirementEvidenceFromTranscript({
    interviewRunId: snapshot.interviewRun.id,
    jobId: job.id,
    requirements: snapshot.interviewPreparationPackage.requirements,
    transcript,
    generatedAt,
  });

  const evaluation = scoreEvaluationFromRequirementEvidence({
    interviewRun: snapshot.interviewRun,
    requirements: snapshot.interviewPreparationPackage.requirements,
    requirementEvidence,
    classification: "success",
    generateOutput: true,
    eligible: true,
    generatedAt,
  });

  const existingIndex = input.state.evaluations.findIndex(
    (item) => item.interviewRunId === evaluation.interviewRunId,
  );

  if (existingIndex >= 0) {
    input.state.evaluations[existingIndex] = evaluation;
  } else {
    input.state.evaluations.push(evaluation);
  }

  return evaluation;
}

export async function resetPublicApplySubmissionStore() {
  await resetRuntimeStoreState();
}

export async function getPublicApplySubmissionSnapshot() {
  const state = await loadRuntimeStoreState();

  return {
    candidates: [...state.candidates],
    applications: [...state.applications],
    interviewRuns: [...state.interviewRuns],
    interviewPreparationPackages: [...state.interviewPreparationPackages],
    dispatchRequests: [...state.dispatchRequests],
    dispatchPayloads: [...state.dispatchPayloads],
    dispatchResponses: [...state.dispatchResponses],
    webhookRecords: [...state.webhookRecords],
    runtimeTraceEvents: [...state.runtimeTraceEvents],
  };
}

export async function getInterviewEvaluation(interviewRunId: string) {
  const state = await loadRuntimeStoreState();
  return (
    state.evaluations.find(
      (evaluation) => evaluation.interviewRunId === interviewRunId,
    ) ?? null
  );
}

export async function getInterviewRunRuntimeSnapshot(interviewRunId: string) {
  const state = await loadRuntimeStoreState();
  return buildRuntimeSnapshot(state, interviewRunId);
}

export async function getInterviewRunRuntimeSnapshotByCandidateId(
  candidateId: string,
) {
  const state = await loadRuntimeStoreState();
  const interviewRun = [...state.interviewRuns]
    .reverse()
    .find((run) => run.candidateId === candidateId);

  if (!interviewRun) {
    return null;
  }

  return buildRuntimeSnapshot(state, interviewRun.id);
}

export async function listInterviewRunRuntimeSnapshotsByCandidateId(
  candidateIds: string[],
) {
  const state = await loadRuntimeStoreState();
  const entries = candidateIds.map((candidateId) => {
    const interviewRun = [...state.interviewRuns]
      .reverse()
      .find((run) => run.candidateId === candidateId);

    return [candidateId, interviewRun ? buildRuntimeSnapshot(state, interviewRun.id) : null];
  });

  return Object.fromEntries(entries) as Record<
    string,
    InterviewRunRuntimeSnapshot | null
  >;
}

export async function getRecruiterCandidateSummary(interviewRunId: string) {
  const evaluation = await getInterviewEvaluation(interviewRunId);
  if (!evaluation) {
    return null;
  }

  return buildEvaluationSummary(evaluation);
}

export async function saveInterviewEvaluation(
  evaluation: CandidateEvaluation,
): Promise<
  | { success: true; data: CandidateEvaluation }
  | { success: false; error: string }
> {
  const state = await loadRuntimeStoreState();
  const interviewRun = state.interviewRuns.find(
    (run) => run.id === evaluation.interviewRunId,
  );

  if (!interviewRun) {
    return {
      success: false,
      error: "Evaluation could not be stored because the interview run was not found.",
    };
  }

  const existingIndex = state.evaluations.findIndex(
    (item) => item.interviewRunId === evaluation.interviewRunId,
  );

  if (existingIndex >= 0) {
    state.evaluations[existingIndex] = evaluation;
  } else {
    state.evaluations.push(evaluation);
  }

  await saveRuntimeStoreState(state);

  return {
    success: true,
    data: evaluation,
  };
}

export async function receiveHappyRobotWebhook(
  rawPayload: unknown,
  options?: {
    receivedAt?: Date;
    transcriptResolver?: TranscriptResolver;
  },
): Promise<HappyRobotWebhookIngestionResponse> {
  const state = await loadRuntimeStoreState();
  const result = ingestHappyRobotWebhookEvent({
    rawPayload,
    interviewRuns: state.interviewRuns,
    receivedAt: options?.receivedAt,
  });

  if (!result.success) {
    return result;
  }

  const interviewRunIndex = state.interviewRuns.findIndex(
    (interviewRun) => interviewRun.id === result.record.matchedInterviewRunId,
  );

  state.interviewRuns[interviewRunIndex] = result.interviewRun;
  syncApplicationFromInterviewRun(state, result.interviewRun);
  state.webhookRecords.push(result.record);
  const directTranscript = resolveTranscriptFromWebhookRecord(result.record);
  await maybeGenerateInterviewEvaluation({
    state,
    interviewRun: result.interviewRun,
    transcriptResolver:
      directTranscript !== null
        ? () => directTranscript
        : options?.transcriptResolver,
  });
  await saveRuntimeStoreState(state);

  return result;
}

export async function submitPublicApplication(
  input: PublicApplySubmissionInput,
  options?: {
    failureMode?: PublicApplyFailureMode;
    traceSink?: PublicApplyTraceSink;
  },
): Promise<
  | {
      success: true;
      data: {
        candidate: CandidateProfile;
        application: CandidateApplication;
        interviewRun: InterviewRun;
        interviewPackage: InterviewPreparationPackage;
        callRequest: HappyRobotCallRequest;
        dispatchPayload: HappyRobotNormalizedDispatchPayload;
        dispatchResponse: HappyRobotDispatchResponse;
      };
    }
  | {
      success: false;
      error: string;
    }
> {
  const state = await loadRuntimeStoreState();

  if (options?.failureMode === "candidate") {
    return {
      success: false,
      error: "Candidate creation failed before persistence.",
    };
  }

  const job = await findPublicJobById(input.jobId);

  if (!job) {
    return {
      success: false,
      error: "Interview dispatch preparation failed because the job was not found.",
    };
  }

  const availabilityError = buildPublicJobAvailabilityError(job);

  if (availabilityError) {
    return {
      success: false,
      error: availabilityError,
    };
  }

  const normalizedPhone = normalizePhone(input.phone);
  const normalizedEmail = normalizeEmail(input.email);
  const source: CandidateSource = "public_apply_link";

  const existingCandidate =
    state.candidates.find(
      (candidate) =>
        candidate.normalizedPhone === normalizedPhone &&
        candidateBelongsToCompany(state, candidate, job.companyId),
    ) ??
    (normalizedEmail
      ? state.candidates.find(
          (candidate) =>
            candidate.normalizedEmail === normalizedEmail &&
            candidateBelongsToCompany(state, candidate, job.companyId),
        ) ?? null
      : null);

  const stagedCandidate: CandidateProfile = existingCandidate
    ? {
        ...existingCandidate,
        companyId: job.companyId,
        fullName: input.fullName.trim(),
        phone: input.phone.trim(),
        normalizedPhone,
        email: input.email.trim() || null,
        normalizedEmail,
        linkedinUrl: input.profileSource.linkedinUrl,
        cvAssetRef: input.profileSource.cvAssetRef,
        locale: input.language,
        source,
        consentAcceptedAt: input.legalAcceptance.acceptedAt,
      }
    : {
        id: nextId("cand", state.candidates.length),
        companyId: job.companyId,
        fullName: input.fullName.trim(),
        phone: input.phone.trim(),
        normalizedPhone,
        email: input.email.trim() || null,
        normalizedEmail,
        linkedinUrl: input.profileSource.linkedinUrl,
        cvAssetRef: input.profileSource.cvAssetRef,
        locale: input.language,
        source,
        consentAcceptedAt: input.legalAcceptance.acceptedAt,
      };

  if (options?.failureMode === "application") {
    return {
      success: false,
      error: "Application creation failed before persistence.",
    };
  }

  const stagedApplication: CandidateApplication = {
    id: nextId("app", state.applications.length),
    companyId: job.companyId,
    candidateId: stagedCandidate.id,
    jobId: input.jobId,
    source,
    stage: "applicant",
    submittedAt: input.legalAcceptance.acceptedAt,
    needsHumanReviewAt: null,
    legalAcceptance: input.legalAcceptance,
    recruiterOutcomeNote: null,
  };

  if (options?.failureMode === "interview") {
    return {
      success: false,
      error: "Interview run creation failed before persistence.",
    };
  }

  const stagedInterviewRun: InterviewRun = {
    id: nextId("run", state.interviewRuns.length),
    companyId: job.companyId,
    candidateId: stagedCandidate.id,
    applicationId: stagedApplication.id,
    jobId: input.jobId,
    interviewPreparationId: null,
    provider: "happyrobot",
    status: "created",
    pipelineStage: "applicant",
    dispatch: {
      dispatchedAt: null,
      providerCallId: null,
      providerAgentId: null,
      providerSessionId: null,
      outboundNumber: null,
    },
    metadata: {
      selectedLanguage: "auto_detected",
      candidateTimezone: {
        timezone: null,
        localDateTime: null,
        utcDateTime: null,
      },
      disclosedWithAi: true,
      disclosureText: "This interview is conducted using an AI-powered system.",
      callbackRequestedAt: null,
      failureReason: null,
      providerOutcomeLabel: null,
    },
    trace: {
      createdAt: input.legalAcceptance.acceptedAt,
      normalizedAt: null,
      initiatedAt: null,
      completedAt: null,
      lastEventAt: null,
    },
    artifacts: {
      recordingUrl: null,
      transcriptUrl: null,
      transcriptAssetRef: null,
      providerPayloadSnapshotRef: null,
      recordingDurationSeconds: null,
    },
  };

  const dispatchExecution = await executeHappyRobotDispatch({
    interviewRun: stagedInterviewRun,
    candidate: stagedCandidate,
    job,
    now: new Date(input.legalAcceptance.acceptedAt),
    traceSink: (event: RuntimeTraceEvent) => {
      appendRuntimeTraceEvent(state, event, options?.traceSink);
    },
  });

  const stagedApplicationAfterDispatch =
    transitionCandidateApplicationForInterviewRun(
      stagedApplication,
      dispatchExecution.interviewRun.status,
      dispatchExecution.interviewRun.pipelineStage,
      dispatchExecution.interviewRun.metadata.callbackRequestedAt,
    );

  if (existingCandidate) {
    const candidateIndex = state.candidates.findIndex(
      (candidate) => candidate.id === existingCandidate.id,
    );
    state.candidates[candidateIndex] = stagedCandidate;
  } else {
    state.candidates.push(stagedCandidate);
  }

  state.applications.push(stagedApplicationAfterDispatch);
  state.interviewRuns.push(dispatchExecution.interviewRun);
  state.interviewPreparationPackages.push(dispatchExecution.interviewPackage);
  state.dispatchRequests.push(dispatchExecution.callRequest);
  state.dispatchPayloads.push(dispatchExecution.dispatchPayload);
  state.dispatchResponses.push(dispatchExecution.dispatchResponse);

  await saveRuntimeStoreState(state);

  return {
    success: true,
    data: {
      candidate: stagedCandidate,
      application: stagedApplicationAfterDispatch,
      interviewRun: dispatchExecution.interviewRun,
      interviewPackage: dispatchExecution.interviewPackage,
      callRequest: dispatchExecution.callRequest,
      dispatchPayload: dispatchExecution.dispatchPayload,
      dispatchResponse: dispatchExecution.dispatchResponse,
    },
  };
}
