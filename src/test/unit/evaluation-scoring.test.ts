import { describe, expect, it } from "vitest";

import {
  mapNumericScoreToState,
  scoreEvaluationFromRequirementEvidence,
} from "@/lib/evaluation-scoring";
import { extractRequirementEvidenceFromTranscript } from "@/lib/evaluation-requirement-extraction";

function buildRequirements() {
  return [
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
  ] as const;
}

describe("evaluation scoring", () => {
  it("maps numeric scores to the six recruiter-facing states", () => {
    expect(mapNumericScoreToState(null)).toBe("Pending");
    expect(mapNumericScoreToState(100)).toBe("Outstanding");
    expect(mapNumericScoreToState(90)).toBe("Outstanding");
    expect(mapNumericScoreToState(89)).toBe("Great");
    expect(mapNumericScoreToState(75)).toBe("Great");
    expect(mapNumericScoreToState(74)).toBe("Good");
    expect(mapNumericScoreToState(60)).toBe("Good");
    expect(mapNumericScoreToState(59)).toBe("Average");
    expect(mapNumericScoreToState(50)).toBe("Average");
    expect(mapNumericScoreToState(49)).toBe("Low");
    expect(mapNumericScoreToState(30)).toBe("Low");
    expect(mapNumericScoreToState(29)).toBe("Poor");
    expect(mapNumericScoreToState(0)).toBe("Poor");
  });

  it("scores from extracted requirement evidence rather than raw transcript text", () => {
    const interviewRun = {
      id: "run_1",
      candidateId: "cand_1",
      applicationId: "app_1",
      jobId: "job_1",
      interviewPreparationId: "prep_1",
      provider: "happyrobot" as const,
      status: "completed" as const,
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
        completedAt: "2026-03-24T08:20:00.000Z",
        lastEventAt: "2026-03-24T08:20:00.000Z",
      },
      artifacts: {
        recordingUrl: "https://example.com/recording.mp3",
        transcriptUrl: "https://example.com/transcript.txt",
        transcriptAssetRef: null,
        providerPayloadSnapshotRef: null,
        recordingDurationSeconds: null,
      },
    };

    const requirements = [...buildRequirements()];
    const extraction = extractRequirementEvidenceFromTranscript({
      interviewRunId: interviewRun.id,
      jobId: "job_1",
      requirements,
      transcript: [
        {
          startMs: 10000,
          endMs: 18000,
          text: "I worked in a warehouse for four years and used handheld scanners daily.",
        },
        {
          startMs: 18000,
          endMs: 26000,
          text: "I communicate clearly with shift leads and can work nights.",
        },
      ],
      generatedAt: new Date("2026-03-24T08:30:00.000Z"),
    });

    const evaluation = scoreEvaluationFromRequirementEvidence({
      interviewRun,
      requirements,
      requirementEvidence: extraction,
      classification: "success",
      generateOutput: true,
      eligible: true,
      generatedAt: new Date("2026-03-24T08:30:00.000Z"),
    });

    expect(evaluation.finalNumericScore).not.toBeNull();
    expect(evaluation.finalScoreState).not.toBe("Pending");
    expect(evaluation.blocks).toHaveLength(3);
    expect(evaluation.blocks[0]?.requirements[0]?.evidence?.highlightedQuote).toBe(
      "I worked in a warehouse for four years and used handheld scanners daily.",
    );
    expect(evaluation.blocks[1]?.requirements[0]?.scoreState).not.toBe("Pending");
    expect(evaluation.blocks[2]?.requirements[0]?.scoreState).not.toBe("Pending");
  });
});
