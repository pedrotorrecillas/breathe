import { describe, expect, it } from "vitest";

import { normalizeInterviewRunForDispatch } from "@/lib/interview-runtime-normalization";

describe("interview runtime normalization", () => {
  it("normalizes language, timezone, timestamps, and outbound number before dispatch", () => {
    const normalizedRun = normalizeInterviewRunForDispatch({
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
          disclosureText: "AI disclosure text",
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
        requirements: [],
      },
      interviewPackage: {
        id: "prep_1",
        jobId: "job_1",
        candidateId: "cand_1",
        language: "es",
        createdAt: "2026-03-24T08:01:00.000Z",
        requirements: [],
        questions: [],
      },
      candidateTimezone: null,
      now: new Date("2026-03-24T08:10:00.000Z"),
    });

    expect(normalizedRun.status).toBe("normalized");
    expect(normalizedRun.interviewPreparationId).toBe("prep_1");
    expect(normalizedRun.metadata.selectedLanguage).toBe("es");
    expect(normalizedRun.metadata.candidateTimezone.timezone).toBe(
      "Europe/Madrid",
    );
    expect(normalizedRun.dispatch.outboundNumber).toBe("+34910000000");
    expect(normalizedRun.trace.normalizedAt).toBe("2026-03-24T08:10:00.000Z");
  });
});
