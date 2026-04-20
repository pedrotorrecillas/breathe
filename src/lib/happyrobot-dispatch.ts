import type { CandidateProfile } from "@/domain/candidates/types";
import type { InterviewPreparationPackage } from "@/domain/interview-preparation/types";
import type { InterviewRun } from "@/domain/interviews/types";
import type { Job } from "@/domain/jobs/types";
import type {
  HappyRobotCallRequest,
  HappyRobotDispatchResponse,
  HappyRobotNormalizedDispatchPayload,
  HappyRobotRuntimeRequirementContext,
} from "@/domain/runtime/happyrobot/types";
import {
  mapDispatchFailureToRuntimeTransition,
} from "@/lib/interview-pipeline-transitions";

type HappyRobotWorkflowDispatchPayload = {
  provider: "happyrobot";
  interview_run_id: string;
  job_id: string;
  job_title: string;
  candidate_id: string;
  candidate_name: string;
  application_id: string;
  interview_package_id: string;
  target_language: string;
  allowed_languages: string[];
  timezone: string | null;
  local_datetime: string | null;
  utc_datetime: string | null;
  outbound_number: string | null;
  disclosure_text: string;
  job_conditions: HappyRobotRuntimeRequirementContext[];
  scored_requirements: Array<
    Omit<HappyRobotRuntimeRequirementContext, "category"> & {
      category: string;
    }
  >;
  questions: Array<{
    id: string;
    kind: string;
    prompt: string;
    requirement_id: string | null;
  }>;
  candidate_phone: string;
};

function workflowWebhookUrl() {
  return process.env.HAPPYROBOT_WORKFLOW_WEBHOOK_URL?.trim() || null;
}

function readProviderCallIdFromWorkflowResponse(body: unknown) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return null;
  }

  const record = body as Record<string, unknown>;

  if (typeof record.run_id === "string" && record.run_id.trim()) {
    return record.run_id.trim();
  }

  if (typeof record.providerCallId === "string" && record.providerCallId.trim()) {
    return record.providerCallId.trim();
  }

  return null;
}

function toRuntimeRequirement(
  requirement: Job["requirements"][number],
): HappyRobotRuntimeRequirementContext {
  const value = requirement.description.trim();

  return {
    id: requirement.id,
    label: requirement.label,
    description: requirement.description,
    category: requirement.category,
    weight: requirement.weight,
    isKnockout: requirement.isKnockout,
    value: value.length > 0 ? value : requirement.label,
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
    jobTitle: job.title,
    candidateId: candidate.id,
    candidateName: candidate.fullName,
    applicationId: interviewRun.applicationId,
    interviewPackageId: interviewPackage.id,
    candidatePhone: candidate.phone,
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

function toWorkflowDispatchPayload(
  payload: HappyRobotNormalizedDispatchPayload,
): HappyRobotWorkflowDispatchPayload {
  return {
    provider: "happyrobot",
    interview_run_id: payload.interviewRunId,
    job_id: payload.jobId,
    job_title: payload.jobTitle,
    candidate_id: payload.candidateId,
    candidate_name: payload.candidateName,
    application_id: payload.applicationId,
    interview_package_id: payload.interviewPackageId,
    target_language: payload.language,
    allowed_languages: [payload.language],
    timezone: payload.candidateTimezone.timezone,
    local_datetime: payload.nowLocal,
    utc_datetime: payload.nowUtc,
    outbound_number: payload.outboundNumber,
    disclosure_text: payload.disclosureText,
    job_conditions: payload.jobConditions,
    scored_requirements: payload.scoredRequirements.map((requirement) => {
      const { category, ...rest } = requirement;

      return {
        ...rest,
        category: category === "essential" ? "must_have" : category,
      };
    }),
    questions: payload.questions.map((question) => ({
      id: question.id,
      kind: question.kind,
      prompt: question.prompt,
      requirement_id: question.requirementId,
    })),
    candidate_phone: payload.candidatePhone,
  };
}

export async function dispatchHappyRobotCall(input: {
  callRequest: HappyRobotCallRequest;
  payload: HappyRobotNormalizedDispatchPayload;
  now?: Date;
  simulateFailureReason?: string;
}): Promise<HappyRobotDispatchResponse> {
  const happenedAt = (input.now ?? new Date()).toISOString();

  if (!input.payload.outboundNumber) {
    return {
      interviewRunId: input.callRequest.interviewRunId,
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
      interviewRunId: input.callRequest.interviewRunId,
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
      interviewRunId: input.callRequest.interviewRunId,
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

  const webhookUrl = workflowWebhookUrl();

  if (webhookUrl) {
    try {
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(toWorkflowDispatchPayload(input.payload)),
      });
      const responseBody = await response
        .json()
        .catch(() => null);

      if (!response.ok) {
        return {
          interviewRunId: input.callRequest.interviewRunId,
          success: false,
          error: {
            code: "provider_error",
            message: `HappyRobot workflow webhook returned ${response.status}.`,
            retryable: response.status >= 500,
            providerStatus: "failed",
            happenedAt,
          },
        };
      }

      return {
        interviewRunId: input.callRequest.interviewRunId,
        success: true,
        result: {
          providerCallId:
            readProviderCallIdFromWorkflowResponse(responseBody) ??
            input.callRequest.interviewRunId,
          providerAgentId: "gala-v1",
          providerSessionId: null,
          status: "queued",
          dispatchedAt: happenedAt,
          recordingUrl: null,
          transcriptUrl: null,
          startedAt: null,
          endedAt: null,
          failureReason: null,
        },
      };
    } catch (error) {
      return {
        interviewRunId: input.callRequest.interviewRunId,
        success: false,
        error: {
          code: "provider_error",
          message:
            error instanceof Error
              ? error.message
              : "HappyRobot workflow webhook request failed.",
          retryable: true,
          providerStatus: "failed",
          happenedAt,
        },
      };
    }
  }

  return {
    interviewRunId: input.callRequest.interviewRunId,
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
