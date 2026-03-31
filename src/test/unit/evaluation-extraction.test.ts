import { describe, expect, it } from "vitest";

import { extractEvaluationFromInterview } from "@/lib/evaluation-extraction";

function buildJob() {
  return {
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
    requirements: [
      {
        id: "cond_1",
        code: "schedule",
        label: "Night shift availability",
        description: "Candidate can work nights",
        category: "condition",
        weight: 1,
        isKnockout: true,
      },
      {
        id: "req_1",
        code: null,
        label: "Warehouse experience",
        description: "Previous warehouse work",
        category: "essential",
        weight: 3,
        isKnockout: false,
      },
      {
        id: "req_2",
        code: null,
        label: "Scanner systems",
        description: "Daily handheld scanning tools",
        category: "technical",
        weight: 2,
        isKnockout: false,
      },
      {
        id: "req_3",
        code: null,
        label: "Team communication",
        description: "Coordinate with shift leads and peers",
        category: "interpersonal",
        weight: 2,
        isKnockout: false,
      },
    ],
    interviewLimits: {
      maxInterviews: null,
      outstandingCap: null,
      greatCap: null,
    },
  };
}

function buildInterviewRun(status: "completed" | "queued" = "completed") {
  return {
    id: "run_1",
    candidateId: "cand_1",
    applicationId: "app_1",
    jobId: "job_1",
    interviewPreparationId: "prep_1",
    provider: "happyrobot" as const,
    status,
    pipelineStage: "applicant" as const,
    dispatch: {
      dispatchedAt: "2026-03-24T08:10:00.000Z",
      providerCallId: "hr_call_run_1",
      providerAgentId: "gala-v1",
      providerSessionId: "hr_session_run_1",
      outboundNumber: "+34910000000",
    },
    metadata: {
      selectedLanguage: "es" as const,
      candidateTimezone: {
        timezone: "Europe/Madrid",
        localDateTime: "2026-03-24T09:00:00.000Z",
        utcDateTime: "2026-03-24T08:00:00.000Z",
      },
      disclosedWithAi: true,
      disclosureText: "This interview is conducted using an AI-powered system.",
      callbackRequestedAt: null,
      failureReason: null,
      providerOutcomeLabel: "completed",
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
  };
}

describe("evaluation extraction", () => {
  it("extracts block-structured scores from a completed valid interview", () => {
    const evaluation = extractEvaluationFromInterview({
      interviewRun: buildInterviewRun("completed"),
      job: buildJob(),
      transcript: [
        {
          startMs: 10000,
          endMs: 18000,
          text: "I worked in a warehouse for four years and used handheld scanners daily.",
        },
        {
          startMs: 18000,
          endMs: 26000,
          text: "I communicate clearly with shift leads and keep the team updated during rush periods.",
        },
        {
          startMs: 26000,
          endMs: 32000,
          text: "I can work fast and reliably in a busy environment.",
        },
      ],
      classification: "success",
      generateOutput: true,
      eligible: true,
      generatedAt: new Date("2026-03-24T08:30:00.000Z"),
    });

    expect(evaluation.finalNumericScore).not.toBeNull();
    expect(evaluation.finalScoreState).not.toBe("Pending");
    expect(evaluation.blocks).toHaveLength(3);
    expect(evaluation.blocks.map((block) => block.category)).toEqual([
      "essential",
      "technical",
      "interpersonal",
    ]);
    expect(evaluation.blocks[0]?.requirements).toHaveLength(1);
    expect(evaluation.blocks[1]?.requirements).toHaveLength(1);
    expect(evaluation.blocks[2]?.requirements).toHaveLength(1);
    expect(evaluation.blocks[0]?.requirements[0]?.importance).toBe("MANDATORY");
    expect(evaluation.blocks[0]?.requirements[0]?.evidence?.transcriptStartMs).toBe(
      10000,
    );
    expect(evaluation.blocks[1]?.requirements[0]?.evidence?.transcriptEndMs).toBe(
      18000,
    );
    expect(evaluation.weightConfigSnapshot.essentialBlockWeight).toBe(0.45);
    expect(evaluation.fitClassification).not.toBeNull();
  });

  it("returns blank blocks when the call is not eligible for rich extraction", () => {
    const evaluation = extractEvaluationFromInterview({
      interviewRun: buildInterviewRun("completed"),
      job: buildJob(),
      transcript: "I have relevant experience, but extraction is disabled here.",
      classification: "failure",
      generateOutput: true,
      eligible: false,
    });

    expect(evaluation.finalNumericScore).toBeNull();
    expect(evaluation.finalScoreState).toBe("Pending");
    expect(evaluation.blocks).toHaveLength(3);
    for (const block of evaluation.blocks) {
      expect(block.numericScore).toBeNull();
      expect(block.scoreState).toBe("Pending");
      expect(block.requirements).toHaveLength(0);
    }
    expect(evaluation.fitClassification).toBeNull();
  });

  it("returns blank blocks when the interview is not completed", () => {
    const evaluation = extractEvaluationFromInterview({
      interviewRun: buildInterviewRun("queued"),
      job: buildJob(),
      transcript: "I have relevant experience.",
      classification: "success",
      generateOutput: true,
      eligible: true,
    });

    expect(evaluation.finalNumericScore).toBeNull();
    expect(evaluation.finalScoreState).toBe("Pending");
    expect(evaluation.blocks.every((block) => block.requirements.length === 0)).toBe(
      true,
    );
  });
});
