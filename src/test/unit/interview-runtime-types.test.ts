import { describe, expect, it } from "vitest";

import type { InterviewRun } from "@/domain/interviews/types";
import type { HappyRobotNormalizedDispatchPayload } from "@/domain/runtime/happyrobot/types";

describe("interview runtime model", () => {
  it("supports a normalized runtime entity with dispatch and artifact metadata", () => {
    const interviewRun: InterviewRun = {
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
    };

    const payload: HappyRobotNormalizedDispatchPayload = {
      interviewRunId: interviewRun.id,
      jobId: interviewRun.jobId,
      jobTitle: "Warehouse Associate",
      candidateId: interviewRun.candidateId,
      candidateName: "Ana Torres",
      applicationId: interviewRun.applicationId,
      interviewPackageId: "prep_1",
      language: "es",
      candidateTimezone: interviewRun.metadata.candidateTimezone,
      outboundNumber: interviewRun.dispatch.outboundNumber,
      disclosureText: interviewRun.metadata.disclosureText,
      nowUtc: "2026-03-24T08:01:00.000Z",
      nowLocal: "2026-03-24T09:01:00.000Z",
      jobConditions: [],
      scoredRequirements: [],
      questions: [],
      traceContext: {
        source: "public_apply_link",
        generatedAt: "2026-03-24T08:01:00.000Z",
      },
    };

    expect(payload.interviewRunId).toBe(interviewRun.id);
    expect(interviewRun.pipelineStage).toBe("applicant");
    expect(interviewRun.dispatch.providerCallId).toBeNull();
  });
});
