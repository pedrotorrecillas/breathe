import { describe, expect, it } from "vitest";

import { executeHappyRobotDispatch, prepareHappyRobotDispatch } from "@/lib/happyrobot-orchestration";

describe("happyrobot orchestration", () => {
  it("creates the preparation package, normalizes the run, and builds dispatch artifacts", () => {
    const preparation = prepareHappyRobotDispatch({
      interviewRun: {
        id: "run_1",
        candidateId: "cand_1",
        applicationId: "app_1",
        jobId: "job_1",
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
          createdAt: "2026-03-24T08:00:00.000Z",
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
        consentAcceptedAt: "2026-03-24T08:00:00.000Z",
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
      now: new Date("2026-03-24T08:10:00.000Z"),
    });

    expect(preparation.interviewPackage.id).toBe("prep_job_1_cand_1");
    expect(preparation.interviewPackage.questions).toHaveLength(1);
    expect(preparation.interviewRun.status).toBe("normalized");
    expect(preparation.interviewRun.interviewPreparationId).toBe(
      preparation.interviewPackage.id,
    );
    expect(preparation.interviewRun.dispatch.outboundNumber).toBe("+34910000000");
    expect(preparation.callRequest.interviewPackageId).toBe(
      preparation.interviewPackage.id,
    );
    expect(preparation.dispatchPayload.questions).toHaveLength(1);
  });

  it("executes dispatch and persists the provider-facing dispatch result on the run", async () => {
    const execution = await executeHappyRobotDispatch({
      interviewRun: {
        id: "run_1",
        candidateId: "cand_1",
        applicationId: "app_1",
        jobId: "job_1",
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
          createdAt: "2026-03-24T08:00:00.000Z",
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
        consentAcceptedAt: "2026-03-24T08:00:00.000Z",
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
        requirements: [],
      },
      now: new Date("2026-03-24T08:10:00.000Z"),
    });

    expect(execution.dispatchResponse.success).toBe(true);
    expect(execution.interviewRun.status).toBe("queued");
    expect(execution.interviewRun.dispatch.providerCallId).toBe("hr_call_run_1");
    expect(execution.interviewRun.dispatch.providerSessionId).toBe(
      "hr_session_run_1",
    );
  });
});
