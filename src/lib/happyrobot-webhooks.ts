import type { InterviewRun } from "@/domain/interviews/types";
import type {
  HappyRobotWebhookEvent,
  HappyRobotWebhookIngestionResponse,
  HappyRobotWebhookRecord,
} from "@/domain/runtime/happyrobot/types";
import { mapRuntimeStatusToTransition } from "@/lib/interview-pipeline-transitions";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asTrimmedString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function asNullableTrimmedString(value: unknown) {
  return typeof value === "string" ? value.trim() || null : null;
}

function isHappyRobotStatus(value: string): value is HappyRobotWebhookEvent["status"] {
  return (
    value === "queued" ||
    value === "dialing" ||
    value === "connected" ||
    value === "completed" ||
    value === "failed" ||
    value === "needs_human"
  );
}

export function parseHappyRobotWebhookEvent(
  rawPayload: unknown,
): HappyRobotWebhookIngestionResponse | { success: true; event: HappyRobotWebhookEvent } {
  if (!isRecord(rawPayload)) {
    return {
      success: false,
      error: {
        code: "invalid_payload",
        message: "HappyRobot webhook payload must be an object.",
      },
    };
  }

  const eventId = asTrimmedString(rawPayload.eventId);
  const providerCallId = asTrimmedString(rawPayload.providerCallId);
  const happenedAt = asTrimmedString(rawPayload.happenedAt);
  const status = asTrimmedString(rawPayload.status);
  const interviewRunIdValue = rawPayload.interviewRunId;
  const interviewRunId =
    interviewRunIdValue === null
      ? null
      : typeof interviewRunIdValue === "string" && interviewRunIdValue.trim()
        ? interviewRunIdValue.trim()
        : null;

  if (!eventId || !providerCallId || !happenedAt || !isHappyRobotStatus(status)) {
    return {
      success: false,
      error: {
        code: "invalid_payload",
        message:
          "HappyRobot webhook payload is missing required fields or contains an invalid status.",
      },
    };
  }

  return {
    success: true,
    event: {
      eventId,
      interviewRunId,
      providerCallId,
      status,
      happenedAt,
      recordingUrl: asNullableTrimmedString(rawPayload.recordingUrl),
      transcriptUrl: asNullableTrimmedString(rawPayload.transcriptUrl),
      failureReason: asNullableTrimmedString(rawPayload.failureReason),
      rawPayloadRef: asNullableTrimmedString(rawPayload.rawPayloadRef),
    },
  };
}

export function applyHappyRobotWebhookEvent(input: {
  interviewRun: InterviewRun;
  event: HappyRobotWebhookEvent;
}): InterviewRun {
  const transition = mapRuntimeStatusToTransition(
    input.event.status,
    input.event.happenedAt,
  );

  return {
    ...input.interviewRun,
    status: transition.interviewRunStatus,
    pipelineStage: transition.pipelineStage,
    dispatch: {
      ...input.interviewRun.dispatch,
      providerCallId:
        input.interviewRun.dispatch.providerCallId ?? input.event.providerCallId,
    },
    metadata: {
      ...input.interviewRun.metadata,
      callbackRequestedAt:
        transition.needsHumanReviewAt ??
        input.interviewRun.metadata.callbackRequestedAt,
      failureReason:
        input.event.failureReason ??
        (input.event.status === "failed"
          ? "HappyRobot reported a failed runtime outcome."
          : null),
      providerOutcomeLabel: input.event.status,
    },
    trace: {
      ...input.interviewRun.trace,
      completedAt:
        input.event.status === "completed"
          ? input.event.happenedAt
          : input.interviewRun.trace.completedAt,
      lastEventAt: input.event.happenedAt,
    },
    artifacts: {
      ...input.interviewRun.artifacts,
      recordingUrl:
        input.event.recordingUrl ?? input.interviewRun.artifacts.recordingUrl,
      transcriptUrl:
        input.event.transcriptUrl ?? input.interviewRun.artifacts.transcriptUrl,
      providerPayloadSnapshotRef:
        input.event.rawPayloadRef ??
        input.interviewRun.artifacts.providerPayloadSnapshotRef,
    },
  };
}

export function ingestHappyRobotWebhookEvent(input: {
  rawPayload: unknown;
  interviewRuns: InterviewRun[];
  receivedAt?: Date;
}): HappyRobotWebhookIngestionResponse {
  const parsed = parseHappyRobotWebhookEvent(input.rawPayload);

  if (!parsed.success) {
    return parsed;
  }

  const matchedInterviewRun =
    input.interviewRuns.find((run) => run.id === parsed.event.interviewRunId) ??
    input.interviewRuns.find(
      (run) => run.dispatch.providerCallId === parsed.event.providerCallId,
    ) ??
    null;

  if (!matchedInterviewRun) {
    return {
      success: false,
      error: {
        code: "unmatched_run",
        message:
          "HappyRobot webhook event could not be matched to an existing InterviewRun.",
      },
    };
  }

  const record: HappyRobotWebhookRecord = {
    event: parsed.event,
    matchedInterviewRunId: matchedInterviewRun.id,
    receivedAt: (input.receivedAt ?? new Date()).toISOString(),
    rawPayload: input.rawPayload,
  };

  return {
    success: true,
    record,
    interviewRun: applyHappyRobotWebhookEvent({
      interviewRun: matchedInterviewRun,
      event: parsed.event,
    }),
  };
}
