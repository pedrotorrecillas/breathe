import type { InterviewRun } from "@/domain/interviews/types";
import type {
  HappyRobotWebhookEvent,
  HappyRobotWebhookIngestionResponse,
  HappyRobotWebhookRecord,
  HappyRobotTranscriptSegment,
} from "@/domain/runtime/happyrobot/types";
import {
  mapRuntimeStatusToTransition,
  protectHumanRequestedTransition,
} from "@/lib/interview-pipeline-transitions";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asTrimmedString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function asNullableTrimmedString(value: unknown) {
  return typeof value === "string" ? value.trim() || null : null;
}

function asIsoDateTimeString(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return new Date(value).toISOString();
  }

  if (typeof value !== "string") {
    return "";
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }

  if (/^\d+$/.test(trimmed)) {
    const asNumber = Number(trimmed);
    if (Number.isFinite(asNumber)) {
      return new Date(asNumber).toISOString();
    }
  }

  const parsed = new Date(trimmed);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString();
  }

  return "";
}

function isTranscriptSegment(value: unknown): value is HappyRobotTranscriptSegment {
  return (
    isRecord(value) &&
    typeof value.text === "string" &&
    (value.startMs === undefined ||
      value.startMs === null ||
      typeof value.startMs === "number") &&
    (value.endMs === undefined ||
      value.endMs === null ||
      typeof value.endMs === "number")
  );
}

function normalizeTranscriptSegments(
  value: unknown,
): HappyRobotTranscriptSegment[] | null {
  if (!Array.isArray(value)) {
    return null;
  }

  const transcriptSegments = value
    .filter(isTranscriptSegment)
    .map((segment) => ({
      text: segment.text.trim(),
      startMs: segment.startMs ?? null,
      endMs: segment.endMs ?? null,
    }))
    .filter((segment) => segment.text.length > 0);

  return transcriptSegments.length > 0 ? transcriptSegments : null;
}

function coalesceOutcomeDetail(rawPayload: Record<string, unknown>) {
  return (
    asNullableTrimmedString(rawPayload.failureReason) ??
    asNullableTrimmedString(rawPayload.providerOutcomeLabel) ??
    asNullableTrimmedString(rawPayload.outcomeLabel) ??
    asNullableTrimmedString(rawPayload.outcomeCode) ??
    asNullableTrimmedString(rawPayload.outcome) ??
    asNullableTrimmedString(rawPayload.disconnectReason)
  );
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

function normalizeHappyRobotStatus(value: unknown) {
  const normalized = asTrimmedString(value).toLowerCase().replace(/[\s-]+/g, "_");

  if (normalized === "in_progress") {
    return "connected";
  }

  if (normalized === "noresponse" || normalized === "no_answer") {
    return "no_response";
  }

  return normalized;
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

  const providerCallId = asTrimmedString(rawPayload.providerCallId);
  const happenedAt = asIsoDateTimeString(rawPayload.happenedAt);
  const status = normalizeHappyRobotStatus(rawPayload.status);
  const eventId =
    asTrimmedString(rawPayload.eventId) ||
    [providerCallId, status, happenedAt].filter(Boolean).join(":");
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
      transcript: asNullableTrimmedString(rawPayload.transcript),
      transcriptSegments: normalizeTranscriptSegments(
        rawPayload.transcriptSegments,
      ),
      failureReason: coalesceOutcomeDetail(rawPayload),
      rawPayloadRef: asNullableTrimmedString(rawPayload.rawPayloadRef),
    },
  };
}

export function applyHappyRobotWebhookEvent(input: {
  interviewRun: InterviewRun;
  event: HappyRobotWebhookEvent;
}): InterviewRun {
  const transition = protectHumanRequestedTransition(
    input.interviewRun.status,
    mapRuntimeStatusToTransition(
      input.event.status,
      input.event.happenedAt,
      input.event.failureReason,
    ),
  );
  const preserveExistingHumanRequest = input.interviewRun.status === "human_requested";

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
      failureReason: preserveExistingHumanRequest
        ? input.interviewRun.metadata.failureReason
        : input.event.failureReason ??
          (input.event.status === "failed"
            ? "HappyRobot reported a failed runtime outcome."
            : null),
      providerOutcomeLabel: preserveExistingHumanRequest
        ? input.interviewRun.metadata.providerOutcomeLabel ??
          input.event.failureReason ??
          input.event.status
        : input.event.failureReason ?? input.event.status,
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
