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

const webhookWrapperKeys = [
  "data",
  "body",
  "payload",
  "event",
  "result",
  "callback",
  "response",
] as const;

const webhookFieldKeys = [
  "providerCallId",
  "provider_call_id",
  "interviewRunId",
  "interview_run_id",
  "status",
  "happenedAt",
  "happened_at",
  "transcript",
  "transcriptSegments",
  "transcript_segments",
  "recordingUrl",
  "recording_url",
  "transcriptUrl",
  "transcript_url",
] as const;

function asTrimmedString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function asNullableTrimmedString(value: unknown) {
  return typeof value === "string" ? value.trim() || null : null;
}

function parseMaybeJson(value: unknown): unknown {
  if (typeof value !== "string") {
    return value;
  }

  const trimmed = value.trim();

  if (!trimmed) {
    return value;
  }

  if (
    (trimmed.startsWith("{") && trimmed.endsWith("}")) ||
    (trimmed.startsWith("[") && trimmed.endsWith("]"))
  ) {
    try {
      return JSON.parse(trimmed);
    } catch {
      return value;
    }
  }

  return value;
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

function getAliasedValue(
  rawPayload: Record<string, unknown>,
  aliases: readonly string[],
) {
  for (const alias of aliases) {
    if (Object.prototype.hasOwnProperty.call(rawPayload, alias)) {
      return rawPayload[alias];
    }
  }

  return undefined;
}

function hasWebhookShape(rawPayload: Record<string, unknown>) {
  return webhookFieldKeys.some((key) =>
    Object.prototype.hasOwnProperty.call(rawPayload, key),
  );
}

function unwrapHappyRobotWebhookPayload(
  rawPayload: unknown,
  depth = 0,
): unknown {
  if (!isRecord(rawPayload) || depth > 4) {
    return rawPayload;
  }

  if (hasWebhookShape(rawPayload)) {
    return rawPayload;
  }

  for (const key of webhookWrapperKeys) {
    const nested = parseMaybeJson(rawPayload[key]);
    if (!isRecord(nested) && !Array.isArray(nested)) {
      continue;
    }

    const candidate = unwrapHappyRobotWebhookPayload(nested, depth + 1);
    if (isRecord(candidate) && hasWebhookShape(candidate)) {
      return candidate;
    }
  }

  return rawPayload;
}

function isTranscriptSegment(value: unknown): value is HappyRobotTranscriptSegment {
  return (
    isRecord(value) &&
    (typeof value.text === "string" || typeof value.content === "string") &&
    ((value.startMs === undefined ||
      value.startMs === null ||
      typeof value.startMs === "number") ||
      (value.start === undefined ||
        value.start === null ||
        typeof value.start === "number")) &&
    ((value.endMs === undefined ||
      value.endMs === null ||
      typeof value.endMs === "number") ||
      (value.end === undefined ||
        value.end === null ||
        typeof value.end === "number"))
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
      text:
        (typeof (segment as { text?: unknown }).text === "string"
          ? (segment as { text: string }).text
          : typeof (segment as { content?: unknown }).content === "string"
            ? (segment as { content: string }).content
            : ""
        ).trim(),
      startMs:
        (segment as { startMs?: number | null }).startMs ??
        (segment as { start?: number | null }).start ??
        null,
      endMs:
        (segment as { endMs?: number | null }).endMs ??
        (segment as { end?: number | null }).end ??
        null,
    }))
    .filter((segment) => segment.text.length > 0);

  return transcriptSegments.length > 0 ? transcriptSegments : null;
}

function normalizeTranscriptValue(value: unknown) {
  if (typeof value === "string") {
    const transcript = value.trim();

    return {
      transcript: transcript || null,
      transcriptSegments: null as HappyRobotTranscriptSegment[] | null,
    };
  }

  if (!Array.isArray(value)) {
    return {
      transcript: null,
      transcriptSegments: null as HappyRobotTranscriptSegment[] | null,
    };
  }

  const transcriptSegments = normalizeTranscriptSegments(value);
  if (transcriptSegments) {
    return {
      transcript:
        transcriptSegments.map((segment) => segment.text).join(" ").trim() ||
        null,
      transcriptSegments,
    };
  }

  const transcript = value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean)
    .join(" ")
    .trim();

  return {
    transcript: transcript || null,
    transcriptSegments: null as HappyRobotTranscriptSegment[] | null,
  };
}

function coalesceOutcomeDetail(rawPayload: Record<string, unknown>) {
  return (
    asNullableTrimmedString(
      getAliasedValue(rawPayload, ["failureReason", "failure_reason"]),
    ) ??
    asNullableTrimmedString(
      getAliasedValue(rawPayload, [
        "providerOutcomeLabel",
        "provider_outcome_label",
      ]),
    ) ??
    asNullableTrimmedString(
      getAliasedValue(rawPayload, ["outcomeLabel", "outcome_label"]),
    ) ??
    asNullableTrimmedString(
      getAliasedValue(rawPayload, ["outcomeCode", "outcome_code"]),
    ) ??
    asNullableTrimmedString(getAliasedValue(rawPayload, ["outcome"])) ??
    asNullableTrimmedString(
      getAliasedValue(rawPayload, ["disconnectReason", "disconnect_reason"]),
    )
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
  const candidatePayload = unwrapHappyRobotWebhookPayload(rawPayload);

  if (!isRecord(candidatePayload)) {
    return {
      success: false,
      error: {
        code: "invalid_payload",
        message: "HappyRobot webhook payload must be an object.",
      },
    };
  }

  const providerCallId = asTrimmedString(
    getAliasedValue(candidatePayload, ["providerCallId", "provider_call_id"]),
  );
  const parsedHappenedAt = asIsoDateTimeString(
    getAliasedValue(candidatePayload, ["happenedAt", "happened_at"]),
  );
  const happenedAt = parsedHappenedAt || new Date().toISOString();
  const status = normalizeHappyRobotStatus(
    getAliasedValue(candidatePayload, ["status"]),
  );
  const eventId =
    asTrimmedString(getAliasedValue(candidatePayload, ["eventId", "event_id"])) ||
    [providerCallId, status, happenedAt].filter(Boolean).join(":");
  const interviewRunIdValue = getAliasedValue(candidatePayload, [
    "interviewRunId",
    "interview_run_id",
  ]);
  const interviewRunId =
    interviewRunIdValue === null
      ? null
      : typeof interviewRunIdValue === "string" && interviewRunIdValue.trim()
        ? interviewRunIdValue.trim()
        : null;

  if (!eventId || !providerCallId || !isHappyRobotStatus(status)) {
    return {
      success: false,
      error: {
        code: "invalid_payload",
        message:
          "HappyRobot webhook payload must include providerCallId, status, and happenedAt, either flat or wrapped inside data/body/payload.",
      },
    };
  }

  const normalizedTranscript = normalizeTranscriptValue(
    getAliasedValue(candidatePayload, ["transcript", "transcript_text"]),
  );
  const transcriptSegments =
    normalizeTranscriptSegments(
      getAliasedValue(candidatePayload, [
        "transcriptSegments",
        "transcript_segments",
      ]),
    ) ?? normalizedTranscript.transcriptSegments;
  const transcript =
    normalizedTranscript.transcript ??
    (transcriptSegments
      ? transcriptSegments.map((segment) => segment.text).join(" ").trim() ||
        null
      : null);

  return {
    success: true,
    event: {
      eventId,
      interviewRunId,
      providerCallId,
      status,
      happenedAt,
      recordingUrl: asNullableTrimmedString(
        getAliasedValue(candidatePayload, ["recordingUrl", "recording_url"]),
      ),
      transcriptUrl: asNullableTrimmedString(
        getAliasedValue(candidatePayload, ["transcriptUrl", "transcript_url"]),
      ),
      transcript,
      transcriptSegments,
      failureReason: coalesceOutcomeDetail(candidatePayload),
      rawPayloadRef: asNullableTrimmedString(
        getAliasedValue(candidatePayload, ["rawPayloadRef", "raw_payload_ref"]),
      ),
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
