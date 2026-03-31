import { describe, expect, it } from "vitest";

import type { CandidateEvaluation } from "@/domain/evaluations/types";

describe("evaluation model", () => {
  it("supports numeric scoring, score labels, and weight snapshots across blocks", () => {
    const evaluation: CandidateEvaluation = {
      id: "eval_1",
      interviewRunId: "run_1",
      generatedAt: "2026-03-24T08:30:00.000Z",
      finalNumericScore: 78,
      finalScoreState: "Great",
      blocks: [
        {
          category: "essential",
          label: "Essential requirements",
          numericScore: 82,
          scoreState: "Great",
          requirements: [
            {
              requirementId: "req_1",
              label: "Warehouse experience",
              importance: "MANDATORY",
              numericScore: 86,
              scoreState: "Great",
              explanation: "The candidate described multiple years of directly relevant warehouse work.",
              evidence: {
                highlightedQuote: "I worked three years in a cold-chain warehouse.",
                transcriptStartMs: 12000,
                transcriptEndMs: 19000,
              },
            },
          ],
        },
        {
          category: "technical",
          label: "Technical skills",
          numericScore: 75,
          scoreState: "Great",
          requirements: [
            {
              requirementId: "req_2",
              label: "Scanner systems",
              importance: "OPTIONAL",
              numericScore: 72,
              scoreState: "Good",
              explanation: "The candidate showed familiarity with handheld scanning tools but limited depth.",
              evidence: null,
            },
          ],
        },
        {
          category: "interpersonal",
          label: "Interpersonal skills",
          numericScore: 70,
          scoreState: "Good",
          requirements: [
            {
              requirementId: "req_3",
              label: "Team communication",
              importance: "MANDATORY",
              numericScore: 70,
              scoreState: "Good",
              explanation: "The candidate gave a clear example of coordinating with teammates during busy shifts.",
              evidence: null,
            },
          ],
        },
      ],
      weightConfigSnapshot: {
        mandatoryRequirementWeight: 0.8,
        optionalRequirementWeight: 0.2,
        essentialBlockWeight: 0.45,
        technicalBlockWeight: 0.45,
        interpersonalBlockWeight: 0.1,
      },
      fitClassification: "strong_fit",
    };

    expect(evaluation.finalNumericScore).toBe(78);
    expect(evaluation.finalScoreState).toBe("Great");
    expect(evaluation.blocks).toHaveLength(3);
    expect(evaluation.blocks[0]?.requirements[0]?.importance).toBe("MANDATORY");
    expect(evaluation.weightConfigSnapshot.essentialBlockWeight).toBe(0.45);
  });
});
