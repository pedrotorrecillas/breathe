import { describe, expect, it } from "vitest";

import {
  applyHappyRobotDispatchResponse,
  buildHappyRobotDispatchPayload,
  dispatchHappyRobotCall,
} from "@/lib/happyrobot-dispatch";

describe("happyrobot dispatch payload", () => {
  it("builds a normalized payload from runtime, job, candidate, and preparation data", () => {
    const payload = buildHappyRobotDispatchPayload({
      interviewRun: {
        id: "run_1",
        candidateId: "cand_1",
        applicationId: "app_1",
        jobId: "job_1",
        interviewPreparationId: "prep_1",
        provider: "happyrobot",
        status: "normalized",
        pipelineStage: "applicant",
        dispatch: {
          dispatchedAt: null,
          providerCallId: null,
          providerAgentId: null,
          providerSessionId: null,
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
          providerOutcomeLabel: null,
        },
        trace: {
          createdAt: "2026-03-24T08:00:00.000Z",
          normalizedAt: "2026-03-24T08:01:00.000Z",
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
      },
      candidate: {
        id: "cand_1",
        fullName: "Ana Torres",
        phone: "+34910000000",
        normalizedPhone: "+34910000000",
        email: "ana@example.com",
        normalizedEmail: "ana@example.com",
        linkedinUrl: null,
        cvAssetRef: null,
        locale: "es",
        source: "public_apply_link",
        consentAcceptedAt: null,
      },
      job: {
        id: "job_1",
        title: "Warehouse Associate",
        summary: "Night shift role",
        location: "Madrid",
        status: "active",
        interviewLanguage: "es",
        createdAt: "2026-03-24T08:00:00.000Z",
        publishedAt: "2026-03-24T08:00:00.000Z",
        expiresAt: null,
        publicApplyPath: "/apply/job_1",
        pipeline: {
          applicants: 1,
          interviewed: 0,
          shortlisted: 0,
          hired: 0,
          rejected: 0,
        },
        interviewLimits: {
          maxInterviews: null,
          outstandingCap: null,
          greatCap: null,
        },
        requirements: [
          {
            id: "req_condition",
            code: "schedule",
            label: "Can work night shift",
            description: "Night shift required",
            category: "condition",
            weight: 1,
            isKnockout: true,
          },
          {
            id: "req_essential",
            code: null,
            label: "Warehouse experience",
            description: "Previous warehouse work",
            category: "essential",
            weight: 3,
            isKnockout: false,
          },
        ],
      },
      interviewPackage: {
        id: "prep_1",
        jobId: "job_1",
        candidateId: "cand_1",
        language: "es",
        createdAt: "2026-03-24T08:01:00.000Z",
        questions: [],
      },
    });

    expect(payload.interviewRunId).toBe("run_1");
    expect(payload.language).toBe("es");
    expect(payload.jobConditions).toHaveLength(1);
    expect(payload.scoredRequirements).toHaveLength(1);
    expect(payload.traceContext.generatedAt).toBe("2026-03-24T08:01:00.000Z");
  });

  it("returns a structured dispatch success with provider identifiers", () => {
    const response = dispatchHappyRobotCall({
      callRequest: {
        jobId: "job_1",
        candidateId: "cand_1",
        applicationId: "app_1",
        interviewRunId: "run_1",
        interviewPackageId: "prep_1",
        language: "es",
        disclosureText: "AI disclosure text",
      },
      payload: {
        interviewRunId: "run_1",
        jobId: "job_1",
        candidateId: "cand_1",
        applicationId: "app_1",
        interviewPackageId: "prep_1",
        language: "es",
        candidateTimezone: {
          timezone: "Europe/Madrid",
          localDateTime: "2026-03-24T09:00:00.000Z",
          utcDateTime: "2026-03-24T08:00:00.000Z",
        },
        outboundNumber: "+34910000000",
        disclosureText: "AI disclosure text",
        nowUtc: "2026-03-24T08:00:00.000Z",
        nowLocal: "2026-03-24T09:00:00.000Z",
        jobConditions: [],
        scoredRequirements: [],
        questions: [],
        traceContext: {
          source: "public_apply_link",
          generatedAt: "2026-03-24T08:01:00.000Z",
        },
      },
      now: new Date("2026-03-24T08:10:00.000Z"),
    });

    expect(response).toMatchObject({
      success: true,
      result: {
        providerCallId: "hr_call_run_1",
        providerAgentId: "gala-v1",
        providerSessionId: "hr_session_run_1",
        status: "queued",
        dispatchedAt: "2026-03-24T08:10:00.000Z",
      },
    });
  });

  it("returns a structured dispatch failure when outbound routing data is missing", () => {
    const response = dispatchHappyRobotCall({
      callRequest: {
        jobId: "job_1",
        candidateId: "cand_1",
        applicationId: "app_1",
        interviewRunId: "run_1",
        interviewPackageId: "prep_1",
        language: "es",
        disclosureText: "AI disclosure text",
      },
      payload: {
        interviewRunId: "run_1",
        jobId: "job_1",
        candidateId: "cand_1",
        applicationId: "app_1",
        interviewPackageId: "prep_1",
        language: "es",
        candidateTimezone: {
          timezone: "Europe/Madrid",
          localDateTime: "2026-03-24T09:00:00.000Z",
          utcDateTime: "2026-03-24T08:00:00.000Z",
        },
        outboundNumber: null,
        disclosureText: "AI disclosure text",
        nowUtc: "2026-03-24T08:00:00.000Z",
        nowLocal: "2026-03-24T09:00:00.000Z",
        jobConditions: [],
        scoredRequirements: [],
        questions: [],
        traceContext: {
          source: "public_apply_link",
          generatedAt: "2026-03-24T08:01:00.000Z",
        },
      },
      now: new Date("2026-03-24T08:10:00.000Z"),
    });

    expect(response).toEqual({
      success: false,
      error: {
        code: "missing_outbound_number",
        message:
          "HappyRobot dispatch could not start because no outbound number was selected.",
        retryable: false,
        providerStatus: null,
        happenedAt: "2026-03-24T08:10:00.000Z",
      },
    });
  });

  it("applies a successful dispatch response back onto the interview run", () => {
    const interviewRun = applyHappyRobotDispatchResponse({
      interviewRun: {
        id: "run_1",
        candidateId: "cand_1",
        applicationId: "app_1",
        jobId: "job_1",
        interviewPreparationId: "prep_1",
        provider: "happyrobot",
        status: "normalized",
        pipelineStage: "applicant",
        dispatch: {
          dispatchedAt: null,
          providerCallId: null,
          providerAgentId: null,
          providerSessionId: null,
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
          providerOutcomeLabel: null,
        },
        trace: {
          createdAt: "2026-03-24T08:00:00.000Z",
          normalizedAt: "2026-03-24T08:01:00.000Z",
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
      },
      response: {
        success: true,
        result: {
          providerCallId: "hr_call_run_1",
          providerAgentId: "gala-v1",
          providerSessionId: "hr_session_run_1",
          status: "queued",
          dispatchedAt: "2026-03-24T08:10:00.000Z",
          recordingUrl: null,
          transcriptUrl: null,
          startedAt: null,
          endedAt: null,
          failureReason: null,
        },
      },
    });

    expect(interviewRun.status).toBe("queued");
    expect(interviewRun.dispatch.providerCallId).toBe("hr_call_run_1");
    expect(interviewRun.dispatch.providerAgentId).toBe("gala-v1");
    expect(interviewRun.trace.initiatedAt).toBe("2026-03-24T08:10:00.000Z");
  });
});
