export type RequirementAssessment = {
  requirementId: string;
  label: string;
  category: "condition" | "essential" | "technical" | "interpersonal";
  score: number | null;
  rationale: string;
  highlightedQuote: string | null;
};

export type CandidateEvaluation = {
  id: string;
  interviewRunId: string;
  overallFit: "strong_fit" | "viable_fit" | "weak_fit" | "pending";
  confidence: "high" | "medium" | "low" | "pending";
  summary: string;
  assessments: RequirementAssessment[];
};
