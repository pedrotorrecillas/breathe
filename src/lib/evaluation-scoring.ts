import type { EvaluationScoreState } from "@/domain/evaluations/types";

export type EvaluationScoreBoundary = {
  minimum: number;
  state: Exclude<EvaluationScoreState, "Pending">;
  label: string;
};

export const evaluationScoreBoundaries: EvaluationScoreBoundary[] = [
  {
    minimum: 90,
    state: "Outstanding",
    label: "Outstanding",
  },
  {
    minimum: 75,
    state: "Great",
    label: "Great",
  },
  {
    minimum: 60,
    state: "Good",
    label: "Good",
  },
  {
    minimum: 50,
    state: "Average",
    label: "Average",
  },
  {
    minimum: 30,
    state: "Low",
    label: "Low",
  },
  {
    minimum: 0,
    state: "Poor",
    label: "Poor",
  },
];

export function clampEvaluationScore(score: number) {
  if (Number.isNaN(score)) {
    return 0;
  }

  return Math.max(0, Math.min(100, Math.round(score)));
}

export function mapNumericScoreToEvaluationState(
  score: number | null,
): EvaluationScoreState {
  if (score === null) {
    return "Pending";
  }

  const normalizedScore = clampEvaluationScore(score);
  const matchedBoundary = evaluationScoreBoundaries.find(
    (boundary) => normalizedScore >= boundary.minimum,
  );

  return matchedBoundary?.state ?? "Poor";
}

export function describeEvaluationScoreState(score: number | null) {
  const state = mapNumericScoreToEvaluationState(score);

  if (state === "Pending") {
    return {
      score,
      state,
      label: "Pending",
    };
  }

  const boundary = evaluationScoreBoundaries.find(
    (item) => item.state === state,
  );

  return {
    score: score === null ? null : clampEvaluationScore(score),
    state,
    label: boundary?.label ?? state,
  };
}
