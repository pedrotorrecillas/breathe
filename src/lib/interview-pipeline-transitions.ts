import type { CandidateApplication, CandidatePipelineStage } from "@/domain/candidates/types";
import type { InterviewPipelineStage, InterviewRunStatus } from "@/domain/interviews/types";
import type { ISODateTimeString } from "@/domain/shared/types";
import type {
  HappyRobotCallStatus,
  HappyRobotDispatchFailure,
} from "@/domain/runtime/happyrobot/types";

type RuntimePipelineTransition = {
  interviewRunStatus: InterviewRunStatus;
  pipelineStage: InterviewPipelineStage;
  applicationStage: CandidatePipelineStage;
  needsHumanReviewAt: ISODateTimeString | null;
};

function normalizeOutcomeDetail(value: string | null | undefined) {
  return value?.trim().toLowerCase() ?? "";
}

function includesAny(value: string, patterns: string[]) {
  return patterns.some((pattern) => value.includes(pattern));
}

function isHardDispatchFailureCode(
  code: HappyRobotDispatchFailure["code"],
): boolean {
  return code === "missing_outbound_number" || code === "unsupported_language";
}

function runtimeStatusToPipelineStage(
  status: HappyRobotCallStatus,
): InterviewPipelineStage {
  switch (status) {
    case "completed":
      return "interviewed";
    case "failed":
      return "rejected";
    case "no_response":
      return "rejected";
    case "needs_human":
      return "applicant";
    case "queued":
    case "dialing":
    case "connected":
    default:
      return "applicant";
  }
}

function runtimeStatusToApplicationStage(
  status: HappyRobotCallStatus,
): CandidatePipelineStage {
  switch (status) {
    case "completed":
      return "interviewed";
    case "failed":
      return "rejected";
    case "no_response":
      return "rejected";
    case "needs_human":
    case "queued":
    case "dialing":
    case "connected":
    default:
      return "applicant";
  }
}

export function mapDispatchFailureToRuntimeTransition(
  error: HappyRobotDispatchFailure,
): RuntimePipelineTransition {
  if (isHardDispatchFailureCode(error.code)) {
    return {
      interviewRunStatus: "failed_job_condition",
      pipelineStage: "rejected",
      applicationStage: "rejected",
      needsHumanReviewAt: null,
    };
  }

  return {
    interviewRunStatus: "error",
    pipelineStage: "applicant",
    applicationStage: "applicant",
    needsHumanReviewAt: null,
  };
}

export function mapRuntimeStatusToTransition(
  status: HappyRobotCallStatus,
  happenedAt: string,
  outcomeDetail?: string | null,
): RuntimePipelineTransition {
  if (status === "needs_human") {
    return {
      interviewRunStatus: "human_requested",
      pipelineStage: "applicant",
      applicationStage: "applicant",
      needsHumanReviewAt: happenedAt,
    };
  }

  if (status === "failed") {
    const normalizedOutcomeDetail = normalizeOutcomeDetail(outcomeDetail);

    if (
      includesAny(normalizedOutcomeDetail, [
        "job condition",
        "knockout",
        "requirement failed",
        "screen-out",
        "screen out",
      ])
    ) {
      return {
        interviewRunStatus: "failed_job_condition",
        pipelineStage: "rejected",
        applicationStage: "rejected",
        needsHumanReviewAt: null,
      };
    }

    if (
      includesAny(normalizedOutcomeDetail, [
        "retry exhausted",
        "retries exhausted",
        "no response",
        "unreachable",
        "voicemail",
        "no answer",
        "no_answer",
      ])
    ) {
      return {
        interviewRunStatus: "no_response",
        pipelineStage: "rejected",
        applicationStage: "rejected",
        needsHumanReviewAt: null,
      };
    }

    if (
      includesAny(normalizedOutcomeDetail, [
        "disconnect",
        "disconnected",
        "hung up",
        "hangup",
        "call dropped",
      ])
    ) {
      return {
        interviewRunStatus: "disconnected",
        pipelineStage: "applicant",
        applicationStage: "applicant",
        needsHumanReviewAt: null,
      };
    }
  }

  return {
    interviewRunStatus:
      status === "completed"
        ? "completed"
        : status === "failed"
          ? "error"
          : status === "no_response"
            ? "no_response"
            : status === "queued"
              ? "queued"
              : status === "dialing"
                ? "dialing"
                : "in_progress",
    pipelineStage: runtimeStatusToPipelineStage(status),
    applicationStage: runtimeStatusToApplicationStage(status),
    needsHumanReviewAt: null,
  };
}

export function transitionCandidateApplicationForInterviewRun(
  application: CandidateApplication,
  interviewRunStatus: InterviewRunStatus,
  pipelineStage: InterviewPipelineStage,
  needsHumanReviewAt: string | null,
): CandidateApplication {
  if (interviewRunStatus === "human_requested") {
    return {
      ...application,
      stage: "applicant",
      needsHumanReviewAt,
    };
  }

  if (pipelineStage === "rejected") {
    return {
      ...application,
      stage: "rejected",
      needsHumanReviewAt: null,
    };
  }

  if (pipelineStage === "interviewed") {
    return {
      ...application,
      stage: "interviewed",
      needsHumanReviewAt: null,
    };
  }

  return application;
}
