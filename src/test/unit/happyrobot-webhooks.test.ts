import { describe, expect, it } from "vitest";

import {
  applyHappyRobotWebhookEvent,
  ingestHappyRobotWebhookEvent,
  parseHappyRobotWebhookEvent,
} from "@/lib/happyrobot-webhooks";

describe("happyrobot webhooks", () => {
  it("parses a valid HappyRobot webhook payload", () => {
    const parsed = parseHappyRobotWebhookEvent({
      eventId: "evt_1",
      interviewRunId: "run_1",
      providerCallId: "hr_call_run_1",
      status: "completed",
      happenedAt: "2026-03-24T08:20:00.000Z",
      recordingUrl: "https://example.com/recording.mp3",
      transcriptUrl: "https://example.com/transcript.txt",
      rawPayloadRef: "payloads/evt_1.json",
    });

    expect(parsed).toEqual({
      success: true,
      event: {
        eventId: "evt_1",
        interviewRunId: "run_1",
        providerCallId: "hr_call_run_1",
        status: "completed",
        happenedAt: "2026-03-24T08:20:00.000Z",
        recordingUrl: "https://example.com/recording.mp3",
        transcriptUrl: "https://example.com/transcript.txt",
        failureReason: null,
        rawPayloadRef: "payloads/evt_1.json",
      },
    });
  });

  it("rejects invalid webhook payloads safely", () => {
    const parsed = parseHappyRobotWebhookEvent({
      eventId: "evt_1",
      providerCallId: "hr_call_run_1",
      status: "unknown",
    });

    expect(parsed).toEqual({
      success: false,
      error: {
        code: "invalid_payload",
        message:
          "HappyRobot webhook payload is missing required fields or contains an invalid status.",
      },
    });
  });

  it("applies a completed webhook event onto the interview run", () => {
    const interviewRun = applyHappyRobotWebhookEvent({
      interviewRun: {
        id: "run_1",
        candidateId: "cand_1",
        applicationId: "app_1",
        jobId: "job_1",
        interviewPreparationId: "prep_1",
        provider: "happyrobot",
        status: "queued",
        pipelineStage: "applicant",
        dispatch: {
          dispatchedAt: "2026-03-24T08:10:00.000Z",
          providerCallId: "hr_call_run_1",
          providerAgentId: "gala-v1",
          providerSessionId: "hr_session_run_1",
          outboundNumber: "+34910000000",
        },
        metadata: {
          selectedLanguage: "es",
          candidateTimezone: {
            timezone: "Europe/Madrid",
            localDateTime: "2026-03-24T09:00:00.000Z",
            utcDateTime: "2026-03-24T08:00:00.000Z",
          },
          disclosedWithAi: true,
          disclosureText: "AI disclosure text",
          callbackRequestedAt: null,
          failureReason: null,
          providerOutcomeLabel: "queued",
        },
        trace: {
          createdAt: "2026-03-24T08:00:00.000Z",
          normalizedAt: "2026-03-24T08:05:00.000Z",
          initiatedAt: "2026-03-24T08:10:00.000Z",
          completedAt: null,
          lastEventAt: "2026-03-24T08:10:00.000Z",
        },
        artifacts: {
          recordingUrl: null,
          transcriptUrl: null,
          transcriptAssetRef: null,
          providerPayloadSnapshotRef: null,
          recordingDurationSeconds: null,
        },
      },
      event: {
        eventId: "evt_1",
        interviewRunId: "run_1",
        providerCallId: "hr_call_run_1",
        status: "completed",
        happenedAt: "2026-03-24T08:20:00.000Z",
        recordingUrl: "https://example.com/recording.mp3",
        transcriptUrl: "https://example.com/transcript.txt",
        rawPayloadRef: "payloads/evt_1.json",
      },
    });

    expect(interviewRun.status).toBe("completed");
    expect(interviewRun.trace.completedAt).toBe("2026-03-24T08:20:00.000Z");
    expect(interviewRun.artifacts.recordingUrl).toBe(
      "https://example.com/recording.mp3",
    );
    expect(interviewRun.artifacts.providerPayloadSnapshotRef).toBe(
      "payloads/evt_1.json",
    );
  });

  it("ingests a valid webhook event by matching providerCallId", () => {
    const result = ingestHappyRobotWebhookEvent({
      rawPayload: {
        eventId: "evt_1",
        interviewRunId: null,
        providerCallId: "hr_call_run_1",
        status: "dialing",
        happenedAt: "2026-03-24T08:12:00.000Z",
      },
      interviewRuns: [
        {
          id: "run_1",
          candidateId: "cand_1",
          applicationId: "app_1",
          jobId: "job_1",
          interviewPreparationId: "prep_1",
          provider: "happyrobot",
          status: "queued",
          pipelineStage: "applicant",
          dispatch: {
            dispatchedAt: "2026-03-24T08:10:00.000Z",
            providerCallId: "hr_call_run_1",
            providerAgentId: "gala-v1",
            providerSessionId: "hr_session_run_1",
            outboundNumber: "+34910000000",
          },
          metadata: {
            selectedLanguage: "es",
            candidateTimezone: {
              timezone: "Europe/Madrid",
              localDateTime: "2026-03-24T09:00:00.000Z",
              utcDateTime: "2026-03-24T08:00:00.000Z",
            },
            disclosedWithAi: true,
            disclosureText: "AI disclosure text",
            callbackRequestedAt: null,
            failureReason: null,
            providerOutcomeLabel: "queued",
          },
          trace: {
            createdAt: "2026-03-24T08:00:00.000Z",
            normalizedAt: "2026-03-24T08:05:00.000Z",
            initiatedAt: "2026-03-24T08:10:00.000Z",
            completedAt: null,
            lastEventAt: "2026-03-24T08:10:00.000Z",
          },
          artifacts: {
            recordingUrl: null,
            transcriptUrl: null,
            transcriptAssetRef: null,
            providerPayloadSnapshotRef: null,
            recordingDurationSeconds: null,
          },
        },
      ],
      receivedAt: new Date("2026-03-24T08:12:05.000Z"),
    });

    expect(result.success).toBe(true);

    if (!result.success) {
      return;
    }

    expect(result.record.matchedInterviewRunId).toBe("run_1");
    expect(result.record.receivedAt).toBe("2026-03-24T08:12:05.000Z");
    expect(result.interviewRun.status).toBe("dialing");
  });

  it("returns a safe unmatched error when no run can be found", () => {
    const result = ingestHappyRobotWebhookEvent({
      rawPayload: {
        eventId: "evt_1",
        interviewRunId: null,
        providerCallId: "hr_call_missing",
        status: "completed",
        happenedAt: "2026-03-24T08:20:00.000Z",
      },
      interviewRuns: [],
    });

    expect(result).toEqual({
      success: false,
      error: {
        code: "unmatched_run",
        message:
          "HappyRobot webhook event could not be matched to an existing InterviewRun.",
      },
    });
  });
});
