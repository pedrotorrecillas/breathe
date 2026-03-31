import type { CandidateProfile } from "@/domain/candidates/types";
import type { InterviewPreparationPackage } from "@/domain/interview-preparation/types";
import type { InterviewRun } from "@/domain/interviews/types";
import type { Job } from "@/domain/jobs/types";
import type {
  HappyRobotCallRequest,
  HappyRobotDispatchResponse,
  HappyRobotNormalizedDispatchPayload,
  HappyRobotRuntimeRequirement,
} from "@/domain/runtime/happyrobot/types";
import {
  mapDispatchFailureToRuntimeTransition,
} from "@/lib/interview-pipeline-transitions";

function toRuntimeRequirement(
  requirement: Job["requirements"][number],
): HappyRobotRuntimeRequirement {
  return {
    id: requirement.id,
    label: requirement.label,
    category: requirement.category,
    weight: requirement.weight,
    isKnockout: requirement.isKnockout,
  };
}

export function buildHappyRobotDispatchPayload(input: {
  interviewRun: InterviewRun;
  candidate: CandidateProfile;
  job: Job;
  interviewPackage: InterviewPreparationPackage;
}): HappyRobotNormalizedDispatchPayload {
  const { interviewRun, candidate, job, interviewPackage } = input;

  return {
    interviewRunId: interviewRun.id,
    jobId: job.id,
    candidateId: candidate.id,
    applicationId: interviewRun.applicationId,
    interviewPackageId: interviewPackage.id,
    language: interviewRun.metadata.selectedLanguage,
    candidateTimezone: interviewRun.metadata.candidateTimezone,
    outboundNumber: interviewRun.dispatch.outboundNumber,
    disclosureText: interviewRun.metadata.disclosureText,
    nowUtc: interviewRun.metadata.candidateTimezone.utcDateTime,
    nowLocal: interviewRun.metadata.candidateTimezone.localDateTime,
    jobConditions: job.requirements
      .filter((requirement) => requirement.category === "condition")
      .map(toRuntimeRequirement),
    scoredRequirements: job.requirements
      .filter((requirement) => requirement.category !== "condition")
      .map(toRuntimeRequirement),
    questions: interviewPackage.questions,
    traceContext: {
      source: "public_apply_link",
      generatedAt: interviewPackage.createdAt,
    },
  };
}

export function dispatchHappyRobotCall(input: {
  callRequest: HappyRobotCallRequest;
  payload: HappyRobotNormalizedDispatchPayload;
  now?: Date;
  simulateFailureReason?: string;
}): HappyRobotDispatchResponse {
  const happenedAt = (input.now ?? new Date()).toISOString();

  if (!input.payload.outboundNumber) {
    return {
      success: false,
      error: {
        code: "missing_outbound_number",
        message:
          "HappyRobot dispatch could not start because no outbound number was selected.",
        retryable: false,
        providerStatus: null,
        happenedAt,
      },
    };
  }

  if (input.payload.language === "unsupported") {
    return {
      success: false,
      error: {
        code: "unsupported_language",
        message:
          "HappyRobot dispatch could not start because the runtime language is unsupported.",
        retryable: false,
        providerStatus: null,
        happenedAt,
      },
    };
  }

  if (input.simulateFailureReason) {
    return {
      success: false,
      error: {
        code: "provider_error",
        message: input.simulateFailureReason,
        retryable: true,
        providerStatus: "failed",
        happenedAt,
      },
    };
  }

  return {
    success: true,
    result: {
      providerCallId: `hr_call_${input.callRequest.interviewRunId}`,
      providerAgentId: "gala-v1",
      providerSessionId: `hr_session_${input.callRequest.interviewRunId}`,
      status: "queued",
      dispatchedAt: happenedAt,
      recordingUrl: null,
      transcriptUrl: null,
      startedAt: null,
      endedAt: null,
      failureReason: null,
    },
  };
}

export function applyHappyRobotDispatchResponse(input: {
  interviewRun: InterviewRun;
  response: HappyRobotDispatchResponse;
}): InterviewRun {
  if (!input.response.success) {
    const transition = mapDispatchFailureToRuntimeTransition(input.response.error);

    return {
      ...input.interviewRun,
      status: transition.interviewRunStatus,
      pipelineStage: transition.pipelineStage,
      metadata: {
        ...input.interviewRun.metadata,
        failureReason: input.response.error.message,
        providerOutcomeLabel:
          transition.interviewRunStatus === "failed_job_condition"
            ? "failed_job_condition"
            : input.response.error.providerStatus,
      },
      trace: {
        ...input.interviewRun.trace,
        lastEventAt: input.response.error.happenedAt,
      },
    };
  }

  return {
    ...input.interviewRun,
    status: "queued",
    pipelineStage: "applicant",
    dispatch: {
      ...input.interviewRun.dispatch,
      dispatchedAt: input.response.result.dispatchedAt,
      providerCallId: input.response.result.providerCallId,
      providerAgentId: input.response.result.providerAgentId,
      providerSessionId: input.response.result.providerSessionId,
    },
    metadata: {
      ...input.interviewRun.metadata,
      failureReason: null,
      providerOutcomeLabel: input.response.result.status,
    },
    trace: {
      ...input.interviewRun.trace,
      initiatedAt: input.response.result.dispatchedAt,
      lastEventAt: input.response.result.dispatchedAt,
    },
  };
}
