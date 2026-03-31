import type { EvaluationScoreState } from "@/domain/evaluations/types";

export function mapNumericScoreToState(
  score: number | null,
): EvaluationScoreState {
  if (score === null) {
    return "Pending";
  }

  if (score >= 90) {
    return "Outstanding";
  }

  if (score >= 75) {
    return "Great";
  }

  if (score >= 60) {
    return "Good";
  }

  if (score >= 50) {
    return "Average";
  }

  if (score >= 30) {
    return "Low";
  }

  return "Poor";
}
