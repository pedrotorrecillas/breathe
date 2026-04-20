import { describe, expect, it } from "vitest";

import { executeHappyRobotDispatch } from "@/lib/happyrobot-orchestration";
import { createRuntimeTraceCollector } from "@/lib/runtime-tracing";

describe("runtime tracing", () => {
  it("emits structured preparation and dispatch events when a sink is provided", () => {
    const collector = createRuntimeTraceCollector();

    const result = executeHappyRobotDispatch({
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
        companyId: "company_seed_demo",
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
            id: "req_1",
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
      traceSink: collector.sink,
    });

    expect(result.dispatchResponse.success).toBe(true);
    expect(collector.events.map((event) => event.phase)).toEqual([
      "interview_preparation.started",
      "interview_preparation.completed",
      "dispatch.started",
      "dispatch.completed",
    ]);

    expect(collector.events[1]).toMatchObject({
      interviewRunId: "run_1",
      candidateId: "cand_1",
      jobId: "job_1",
      interviewPackageId: "prep_job_1_cand_1",
      language: "es",
      questionCount: 1,
    });

    expect(collector.events[3]).toMatchObject({
      providerCallId: "hr_call_run_1",
      providerStatus: "queued",
      outboundNumber: "+34910000000",
    });
  });

  it("emits a failed dispatch trace when the provider call fails", () => {
    const collector = createRuntimeTraceCollector();

    const result = executeHappyRobotDispatch({
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
        companyId: "company_seed_demo",
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
            id: "req_1",
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
      simulateFailureReason: "provider offline",
      traceSink: collector.sink,
    });

    expect(result.dispatchResponse.success).toBe(false);
    expect(collector.events.map((event) => event.phase)).toEqual([
      "interview_preparation.started",
      "interview_preparation.completed",
      "dispatch.started",
      "dispatch.failed",
    ]);
    expect(collector.events[3]).toMatchObject({
      failureCode: "provider_error",
      failureMessage: "provider offline",
      providerStatus: "failed",
    });
  });
});
