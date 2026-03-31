import { describe, expect, it } from "vitest";

import {
  clampEvaluationScore,
  describeEvaluationScoreState,
  evaluationScoreBoundaries,
  mapNumericScoreToEvaluationState,
} from "@/lib/evaluation-scoring";

describe("evaluation scoring", () => {
  it("exposes the stable recruiter-facing score boundaries", () => {
    expect(evaluationScoreBoundaries).toEqual([
      { minimum: 90, state: "Outstanding", label: "Outstanding" },
      { minimum: 75, state: "Great", label: "Great" },
      { minimum: 60, state: "Good", label: "Good" },
      { minimum: 50, state: "Average", label: "Average" },
      { minimum: 30, state: "Low", label: "Low" },
      { minimum: 0, state: "Poor", label: "Poor" },
    ]);
  });

  it("maps numeric scores to the six recruiter-facing states", () => {
    expect(mapNumericScoreToEvaluationState(100)).toBe("Outstanding");
    expect(mapNumericScoreToEvaluationState(90)).toBe("Outstanding");
    expect(mapNumericScoreToEvaluationState(89)).toBe("Great");
    expect(mapNumericScoreToEvaluationState(75)).toBe("Great");
    expect(mapNumericScoreToEvaluationState(74)).toBe("Good");
    expect(mapNumericScoreToEvaluationState(60)).toBe("Good");
    expect(mapNumericScoreToEvaluationState(59)).toBe("Average");
    expect(mapNumericScoreToEvaluationState(50)).toBe("Average");
    expect(mapNumericScoreToEvaluationState(49)).toBe("Low");
    expect(mapNumericScoreToEvaluationState(30)).toBe("Low");
    expect(mapNumericScoreToEvaluationState(29)).toBe("Poor");
    expect(mapNumericScoreToEvaluationState(0)).toBe("Poor");
    expect(mapNumericScoreToEvaluationState(-10)).toBe("Poor");
    expect(mapNumericScoreToEvaluationState(250)).toBe("Outstanding");
  });

  it("treats null as pending and preserves that label", () => {
    expect(mapNumericScoreToEvaluationState(null)).toBe("Pending");
    expect(describeEvaluationScoreState(null)).toEqual({
      score: null,
      state: "Pending",
      label: "Pending",
    });
  });

  it("clamps and rounds scores before describing them", () => {
    expect(clampEvaluationScore(99.5)).toBe(100);
    expect(clampEvaluationScore(29.4)).toBe(29);
    expect(clampEvaluationScore(-20)).toBe(0);
    expect(clampEvaluationScore(120)).toBe(100);

    expect(describeEvaluationScoreState(74.4)).toEqual({
      score: 74,
      state: "Good",
      label: "Good",
    });
  });
});
