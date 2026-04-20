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
        transcript: null,
        transcriptSegments: null,
        failureReason: null,
        rawPayloadRef: "payloads/evt_1.json",
      },
    });
  });

  it("parses transcript text and transcript segments from a webhook payload", () => {
    const parsed = parseHappyRobotWebhookEvent({
      eventId: "evt_10",
      interviewRunId: "run_1",
      providerCallId: "hr_call_run_1",
      status: "completed",
      happenedAt: "2026-03-24T08:20:00.000Z",
      transcript: "Candidate answered clearly.",
      transcriptSegments: [
        {
          text: "Candidate answered clearly.",
          startMs: 1200,
          endMs: 2500,
        },
      ],
    });

    expect(parsed).toEqual({
      success: true,
      event: {
        eventId: "evt_10",
        interviewRunId: "run_1",
        providerCallId: "hr_call_run_1",
        status: "completed",
        happenedAt: "2026-03-24T08:20:00.000Z",
        recordingUrl: null,
        transcriptUrl: null,
        transcript: "Candidate answered clearly.",
        transcriptSegments: [
          {
            text: "Candidate answered clearly.",
            startMs: 1200,
            endMs: 2500,
          },
        ],
        failureReason: null,
        rawPayloadRef: null,
      },
    });
  });

  it("normalizes real HappyRobot callback payload quirks", () => {
    const parsed = parseHappyRobotWebhookEvent({
      data: {
        interview_run_id: "\nrun_bre41_prod_001\n",
        provider_call_id: "\n8e8a80b0-72fe6214c2b78\n",
        status: "\nin-progress\n",
        happened_at: "1774975802051",
        transcript: "\nTengo tres anos de experiencia en almacen.\n",
        failure_reason: "   ",
      },
    });

    expect(parsed).toEqual({
      success: true,
      event: {
        eventId:
          "8e8a80b0-72fe6214c2b78:connected:2026-03-31T16:50:02.051Z",
        interviewRunId: "run_bre41_prod_001",
        providerCallId: "8e8a80b0-72fe6214c2b78",
        status: "connected",
        happenedAt: "2026-03-31T16:50:02.051Z",
        recordingUrl: null,
        transcriptUrl: null,
        transcript: "Tengo tres anos de experiencia en almacen.",
        transcriptSegments: null,
        failureReason: null,
        rawPayloadRef: null,
      },
    });
  });

  it("accepts transcript as an empty array from the HappyRobot builder", () => {
    const parsed = parseHappyRobotWebhookEvent({
      interviewRunId: "run_1",
      providerCallId: "8e8a80b0-72f6-4fc7-8dda-1fe6214c2b78",
      status: "in-progress",
      happenedAt: 1774980082735,
      transcript: [],
    });

    expect(parsed).toEqual({
      success: true,
      event: {
        eventId:
          "8e8a80b0-72f6-4fc7-8dda-1fe6214c2b78:connected:2026-03-31T18:01:22.735Z",
        interviewRunId: "run_1",
        providerCallId: "8e8a80b0-72f6-4fc7-8dda-1fe6214c2b78",
        status: "connected",
        happenedAt: "2026-03-31T18:01:22.735Z",
        recordingUrl: null,
        transcriptUrl: null,
        transcript: null,
        transcriptSegments: null,
        failureReason: null,
        rawPayloadRef: null,
      },
    });
  });

  it("accepts no-answer aliases and normalizes them to no_response", () => {
    const parsed = parseHappyRobotWebhookEvent({
      interviewRunId: "run_1",
      providerCallId: "hr_call_run_1",
      status: "no_answer",
      happenedAt: "2026-03-24T08:20:00.000Z",
    });

    expect(parsed).toEqual({
      success: true,
      event: {
        eventId: "hr_call_run_1:no_response:2026-03-24T08:20:00.000Z",
        interviewRunId: "run_1",
        providerCallId: "hr_call_run_1",
        status: "no_response",
        happenedAt: "2026-03-24T08:20:00.000Z",
        recordingUrl: null,
        transcriptUrl: null,
        transcript: null,
        transcriptSegments: null,
        failureReason: null,
        rawPayloadRef: null,
      },
    });
  });

  it("falls back to a generated timestamp when HappyRobot omits happenedAt", () => {
    const before = Date.now();
    const parsed = parseHappyRobotWebhookEvent({
      interviewRunId: "run_2",
      providerCallId: "35605ef9-a15c-41ce-b9e5-64a9a6e82f3d",
      status: "completed",
      happenedAt: "",
      transcript: [
        {
          role: "user",
          content: "Hello?",
          start: 6450,
          end: 7550,
        },
      ],
    });
    const after = Date.now();

    expect(parsed.success).toBe(true);
    if (!parsed.success) {
      return;
    }

    expect(parsed.event.providerCallId).toBe(
      "35605ef9-a15c-41ce-b9e5-64a9a6e82f3d",
    );
    expect(parsed.event.status).toBe("completed");
    expect(parsed.event.transcript).toBe("Hello?");
    expect(parsed.event.transcriptSegments).toEqual([
      {
        text: "Hello?",
        startMs: 6450,
        endMs: 7550,
      },
    ]);
    expect(parsed.event.happenedAt).not.toBe("");
    expect(new Date(parsed.event.happenedAt).getTime()).toBeGreaterThanOrEqual(before);
    expect(new Date(parsed.event.happenedAt).getTime()).toBeLessThanOrEqual(after);
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
          "HappyRobot webhook payload must include providerCallId, status, and happenedAt, either flat or wrapped inside data/body/payload.",
      },
    });
  });

  it("preserves provider outcome detail when parsing failed payloads", () => {
    const parsed = parseHappyRobotWebhookEvent({
      eventId: "evt_2",
      interviewRunId: "run_1",
      providerCallId: "hr_call_run_1",
      status: "failed",
      happenedAt: "2026-03-24T08:20:00.000Z",
      outcomeLabel: "Retries exhausted after repeated no response",
    });

    expect(parsed).toEqual({
      success: true,
      event: {
        eventId: "evt_2",
        interviewRunId: "run_1",
        providerCallId: "hr_call_run_1",
        status: "failed",
        happenedAt: "2026-03-24T08:20:00.000Z",
        recordingUrl: null,
        transcriptUrl: null,
        transcript: null,
        transcriptSegments: null,
        failureReason: "Retries exhausted after repeated no response",
        rawPayloadRef: null,
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
    expect(interviewRun.pipelineStage).toBe("interviewed");
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
    expect(result.interviewRun.pipelineStage).toBe("applicant");
  });

  it("keeps human requested candidates in Applicants", () => {
    const result = applyHappyRobotWebhookEvent({
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
        eventId: "evt_2",
        interviewRunId: "run_1",
        providerCallId: "hr_call_run_1",
        status: "needs_human",
        happenedAt: "2026-03-24T08:15:00.000Z",
        rawPayloadRef: "payloads/evt_2.json",
      },
    });

    expect(result.status).toBe("human_requested");
    expect(result.pipelineStage).toBe("applicant");
    expect(result.metadata.callbackRequestedAt).toBe("2026-03-24T08:15:00.000Z");
  });

  it("preserves a human requested candidate when a later rejection-style event arrives", () => {
    const result = applyHappyRobotWebhookEvent({
      interviewRun: {
        id: "run_1",
        candidateId: "cand_1",
        applicationId: "app_1",
        jobId: "job_1",
        interviewPreparationId: "prep_1",
        provider: "happyrobot",
        status: "human_requested",
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
          callbackRequestedAt: "2026-03-24T08:15:00.000Z",
          failureReason: null,
          providerOutcomeLabel: "needs_human",
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
        eventId: "evt_5",
        interviewRunId: "run_1",
        providerCallId: "hr_call_run_1",
        status: "no_response",
        happenedAt: "2026-03-24T08:30:00.000Z",
        rawPayloadRef: "payloads/evt_5.json",
      },
    });

    expect(result.status).toBe("human_requested");
    expect(result.pipelineStage).toBe("applicant");
    expect(result.metadata.callbackRequestedAt).toBe("2026-03-24T08:15:00.000Z");
    expect(result.metadata.providerOutcomeLabel).toBe("needs_human");
    expect(result.trace.lastEventAt).toBe("2026-03-24T08:30:00.000Z");
  });

  it("moves no response outcomes into Rejected", () => {
    const result = applyHappyRobotWebhookEvent({
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
        eventId: "evt_3",
        interviewRunId: "run_1",
        providerCallId: "hr_call_run_1",
        status: "no_response",
        happenedAt: "2026-03-24T08:30:00.000Z",
        rawPayloadRef: "payloads/evt_3.json",
      },
    });

    expect(result.status).toBe("no_response");
    expect(result.pipelineStage).toBe("rejected");
  });

  it("maps failed job-condition outcomes into a rejected internal status", () => {
    const result = applyHappyRobotWebhookEvent({
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
        eventId: "evt_4",
        interviewRunId: "run_1",
        providerCallId: "hr_call_run_1",
        status: "failed",
        happenedAt: "2026-03-24T08:30:00.000Z",
        failureReason: "Candidate failed job condition: no valid work permit",
        rawPayloadRef: "payloads/evt_4.json",
      },
    });

    expect(result.status).toBe("failed_job_condition");
    expect(result.pipelineStage).toBe("rejected");
    expect(result.metadata.providerOutcomeLabel).toBe(
      "Candidate failed job condition: no valid work permit",
    );
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
