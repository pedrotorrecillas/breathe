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
import { buildEvaluationSummary, type EvaluationSummary } from "@/lib/evaluation-summary";
import { executeHappyRobotDispatch } from "@/lib/happyrobot-orchestration";
import { ingestHappyRobotWebhookEvent } from "@/lib/happyrobot-webhooks";
import { transitionCandidateApplicationForInterviewRun } from "@/lib/interview-pipeline-transitions";
import {
  type RuntimeTraceEvent,
  type RuntimeTraceSink,
} from "@/lib/runtime-tracing";
import type {
  NormalizedCandidateProfileSource,
  PublicApplyLegalAcceptance,
} from "@/lib/public-apply";
import { findPublicJobById } from "@/lib/public-jobs";

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

const candidates: CandidateProfile[] = [];
const applications: CandidateApplication[] = [];
const interviewRuns: InterviewRun[] = [];
const interviewPreparationPackages: InterviewPreparationPackage[] = [];
const dispatchRequests: HappyRobotCallRequest[] = [];
const dispatchPayloads: HappyRobotNormalizedDispatchPayload[] = [];
const dispatchResponses: HappyRobotDispatchResponse[] = [];
const webhookRecords: HappyRobotWebhookRecord[] = [];
const runtimeTraceEvents: RuntimeTraceEvent[] = [];
const evaluations: CandidateEvaluation[] = [];

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

function appendRuntimeTraceEvent(
  event: RuntimeTraceEvent,
  sink?: RuntimeTraceSink,
) {
  runtimeTraceEvents.push(event);
  sink?.(event);
}

function syncApplicationFromInterviewRun(interviewRun: InterviewRun) {
  const applicationIndex = applications.findIndex(
    (application) => application.id === interviewRun.applicationId,
  );

  if (applicationIndex < 0) {
    return;
  }

  applications[applicationIndex] = transitionCandidateApplicationForInterviewRun(
    applications[applicationIndex],
    interviewRun.status,
    interviewRun.pipelineStage,
    interviewRun.metadata.callbackRequestedAt,
  );
}

export function resetPublicApplySubmissionStore() {
  candidates.length = 0;
  applications.length = 0;
  interviewRuns.length = 0;
  interviewPreparationPackages.length = 0;
  dispatchRequests.length = 0;
  dispatchPayloads.length = 0;
  dispatchResponses.length = 0;
  webhookRecords.length = 0;
  runtimeTraceEvents.length = 0;
  evaluations.length = 0;
}

export function getPublicApplySubmissionSnapshot() {
  return {
    candidates: [...candidates],
    applications: [...applications],
    interviewRuns: [...interviewRuns],
    interviewPreparationPackages: [...interviewPreparationPackages],
    dispatchRequests: [...dispatchRequests],
    dispatchPayloads: [...dispatchPayloads],
    dispatchResponses: [...dispatchResponses],
    webhookRecords: [...webhookRecords],
    runtimeTraceEvents: [...runtimeTraceEvents],
  };
}

export function getInterviewEvaluation(
  interviewRunId: string,
): CandidateEvaluation | null {
  return (
    evaluations.find(
      (evaluation) => evaluation.interviewRunId === interviewRunId,
    ) ?? null
  );
}

export function getInterviewRunRuntimeSnapshot(
  interviewRunId: string,
): InterviewRunRuntimeSnapshot | null {
  const interviewRun = interviewRuns.find((run) => run.id === interviewRunId);

  if (!interviewRun) {
    return null;
  }

  const candidate = candidates.find((item) => item.id === interviewRun.candidateId) ?? null;
  const application =
    applications.find((item) => item.id === interviewRun.applicationId) ?? null;
  const interviewPreparationPackage =
    interviewPreparationPackages.find(
      (item) => item.id === interviewRun.interviewPreparationId,
    ) ?? null;
  const dispatchRequestIndex = dispatchRequests.findIndex(
    (item) => item.interviewRunId === interviewRunId,
  );
  const dispatchRequest =
    dispatchRequestIndex >= 0 ? dispatchRequests[dispatchRequestIndex] : null;
  const dispatchPayload =
    dispatchPayloads.find((item) => item.interviewRunId === interviewRunId) ?? null;
  const dispatchResponse =
    dispatchRequestIndex >= 0 ? dispatchResponses[dispatchRequestIndex] ?? null : null;
  const webhookRecordsForRun = webhookRecords.filter(
    (record) => record.matchedInterviewRunId === interviewRunId,
  );
  const traceEventsForRun = runtimeTraceEvents.filter(
    (event) => event.interviewRunId === interviewRunId,
  );
  const evaluation = getInterviewEvaluation(interviewRunId);

  return {
    interviewRun,
    candidate,
    application,
    interviewPreparationPackage,
    dispatchRequest,
    dispatchPayload,
    dispatchResponse,
    webhookRecords: webhookRecordsForRun,
    runtimeTraceEvents: traceEventsForRun,
    evaluation,
  };
}

export function getInterviewRunRuntimeSnapshotByCandidateId(
  candidateId: string,
): InterviewRunRuntimeSnapshot | null {
  const interviewRun = [...interviewRuns]
    .reverse()
    .find((run) => run.candidateId === candidateId);

  if (!interviewRun) {
    return null;
  }

  return getInterviewRunRuntimeSnapshot(interviewRun.id);
}

export function getRecruiterCandidateSummary(
  interviewRunId: string,
): EvaluationSummary | null {
  const evaluation = getInterviewEvaluation(interviewRunId);

  if (!evaluation) {
    return null;
  }

  return buildEvaluationSummary(evaluation);
}

export function saveInterviewEvaluation(
  evaluation: CandidateEvaluation,
):
  | { success: true; data: CandidateEvaluation }
  | { success: false; error: string } {
  const interviewRun = interviewRuns.find(
    (run) => run.id === evaluation.interviewRunId,
  );

  if (!interviewRun) {
    return {
      success: false,
      error: "Evaluation could not be stored because the interview run was not found.",
    };
  }

  const existingIndex = evaluations.findIndex(
    (item) => item.interviewRunId === evaluation.interviewRunId,
  );

  if (existingIndex >= 0) {
    evaluations[existingIndex] = evaluation;
  } else {
    evaluations.push(evaluation);
  }

  return {
    success: true,
    data: evaluation,
  };
}

export function receiveHappyRobotWebhook(
  rawPayload: unknown,
  options?: {
    receivedAt?: Date;
  },
): HappyRobotWebhookIngestionResponse {
  const result = ingestHappyRobotWebhookEvent({
    rawPayload,
    interviewRuns,
    receivedAt: options?.receivedAt,
  });

  if (!result.success) {
    return result;
  }

  const interviewRunIndex = interviewRuns.findIndex(
    (interviewRun) => interviewRun.id === result.record.matchedInterviewRunId,
  );

  interviewRuns[interviewRunIndex] = result.interviewRun;
  syncApplicationFromInterviewRun(result.interviewRun);
  webhookRecords.push(result.record);

  return result;
}

export function submitPublicApplication(
  input: PublicApplySubmissionInput,
  options?: {
    failureMode?: PublicApplyFailureMode;
    traceSink?: PublicApplyTraceSink;
  },
):
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
    } {
  if (options?.failureMode === "candidate") {
    return {
      success: false,
      error: "Candidate creation failed before persistence.",
    };
  }

  const normalizedPhone = normalizePhone(input.phone);
  const normalizedEmail = normalizeEmail(input.email);
  const source: CandidateSource = "public_apply_link";

  const existingCandidate =
    candidates.find((candidate) => candidate.normalizedPhone === normalizedPhone) ??
    (normalizedEmail
      ? candidates.find(
          (candidate) => candidate.normalizedEmail === normalizedEmail,
        ) ?? null
      : null);

  const stagedCandidate: CandidateProfile = existingCandidate
    ? {
        ...existingCandidate,
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
        id: nextId("cand", candidates.length),
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
    id: nextId("app", applications.length),
    candidateId: stagedCandidate.id,
    jobId: input.jobId,
    source,
    stage: "applicant",
    submittedAt: input.legalAcceptance.acceptedAt,
    needsHumanReviewAt: null,
    legalAcceptance: input.legalAcceptance,
  };

  if (options?.failureMode === "interview") {
    return {
      success: false,
      error: "Interview run creation failed before persistence.",
    };
  }

  const job = findPublicJobById(input.jobId);

  if (!job) {
    return {
      success: false,
      error: "Interview dispatch preparation failed because the job was not found.",
    };
  }

  const stagedInterviewRun: InterviewRun = {
    id: nextId("run", interviewRuns.length),
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

  const dispatchExecution = executeHappyRobotDispatch({
    interviewRun: stagedInterviewRun,
    candidate: stagedCandidate,
    job,
    now: new Date(input.legalAcceptance.acceptedAt),
    traceSink: (event: RuntimeTraceEvent) => {
      appendRuntimeTraceEvent(event, options?.traceSink);
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
    const candidateIndex = candidates.findIndex(
      (candidate) => candidate.id === existingCandidate.id,
    );
    candidates[candidateIndex] = stagedCandidate;
  } else {
    candidates.push(stagedCandidate);
  }

  applications.push(stagedApplicationAfterDispatch);
  interviewRuns.push(dispatchExecution.interviewRun);
  interviewPreparationPackages.push(dispatchExecution.interviewPackage);
  dispatchRequests.push(dispatchExecution.callRequest);
  dispatchPayloads.push(dispatchExecution.dispatchPayload);
  dispatchResponses.push(dispatchExecution.dispatchResponse);

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
