import { describe, expect, it } from "vitest";

import { mapNumericScoreToState } from "@/lib/evaluation-scoring";

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
});
