import { describe, expect, it } from "vitest";

import {
  mapDispatchFailureToRuntimeTransition,
  mapRuntimeStatusToTransition,
  transitionCandidateApplicationForInterviewRun,
} from "@/lib/interview-pipeline-transitions";

describe("interview pipeline transitions", () => {
  it("moves hard dispatch failures to rejected", () => {
    expect(
      mapDispatchFailureToRuntimeTransition({
        code: "missing_outbound_number",
        message: "missing outbound number",
        retryable: false,
        providerStatus: null,
        happenedAt: "2026-03-24T08:10:00.000Z",
      }),
    ).toEqual({
      interviewRunStatus: "failed_job_condition",
      pipelineStage: "rejected",
      applicationStage: "rejected",
      needsHumanReviewAt: null,
    });
  });

  it("keeps human requested interviews in applicants", () => {
    expect(
      mapRuntimeStatusToTransition("needs_human", "2026-03-24T08:15:00.000Z"),
    ).toEqual({
      interviewRunStatus: "human_requested",
      pipelineStage: "applicant",
      applicationStage: "applicant",
      needsHumanReviewAt: "2026-03-24T08:15:00.000Z",
    });
  });

  it("transitions completed interviews to interviewed", () => {
    expect(
      mapRuntimeStatusToTransition("completed", "2026-03-24T08:20:00.000Z"),
    ).toEqual({
      interviewRunStatus: "completed",
      pipelineStage: "interviewed",
      applicationStage: "interviewed",
      needsHumanReviewAt: null,
    });
  });

  it("treats failed runtime callbacks as rejected", () => {
    expect(
      mapRuntimeStatusToTransition("failed", "2026-03-24T08:25:00.000Z"),
    ).toEqual({
      interviewRunStatus: "error",
      pipelineStage: "rejected",
      applicationStage: "rejected",
      needsHumanReviewAt: null,
    });
  });

  it("applies the mapped transition to the application record", () => {
    expect(
      transitionCandidateApplicationForInterviewRun(
        {
          id: "app_1",
          candidateId: "cand_1",
          jobId: "job_1",
          source: "public_apply_link",
          stage: "applicant",
          submittedAt: "2026-03-24T08:00:00.000Z",
          needsHumanReviewAt: null,
          legalAcceptance: null,
        },
        "completed",
        "interviewed",
        null,
      ),
    ).toMatchObject({
      stage: "interviewed",
      needsHumanReviewAt: null,
    });
  });
});
