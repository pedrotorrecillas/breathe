import { describe, expect, it } from "vitest";

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

describe("evaluation requirement extraction", () => {
  it("extracts one evidence object per requirement before scoring", () => {
    const extraction = extractRequirementEvidenceFromTranscript({
      interviewRunId: "run_1",
      jobId: "job_1",
      requirements: [...buildRequirements()],
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

    expect(extraction.interviewRunId).toBe("run_1");
    expect(extraction.jobId).toBe("job_1");
    expect(extraction.requirementEvidence).toHaveLength(4);
    expect(
      extraction.requirementEvidence.find((item) => item.requirementId === "req_1"),
    ).toEqual(
      expect.objectContaining({
        requirementLabel: "Warehouse experience",
        requirementCategory: "essential",
        answerText: "I worked in a warehouse for four years and used handheld scanners daily.",
        highlightedQuote: "I worked in a warehouse for four years and used handheld scanners daily.",
        transcriptStartMs: 10000,
        transcriptEndMs: 18000,
      }),
    );
    expect(
      extraction.requirementEvidence.find((item) => item.requirementId === "cond_1"),
    ).toEqual(
      expect.objectContaining({
        requirementLabel: "Night shift availability",
        answerText: "I communicate clearly with shift leads and can work nights.",
      }),
    );
  });
});

