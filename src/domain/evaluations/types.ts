import type { EntityId, ISODateTimeString } from "@/domain/shared/types";

export type EvaluationConfidence = "high" | "medium" | "low" | "pending";

export type OverallFit = "strong_fit" | "viable_fit" | "weak_fit" | "pending";

export type RequirementAssessment = {
  requirementId: EntityId;
  label: string;
  category: "condition" | "essential" | "technical" | "interpersonal";
  score: number | null;
  rationale: string;
  highlightedQuote: string | null;
};

export type CandidateEvaluation = {
  id: EntityId;
  interviewRunId: EntityId;
  generatedAt: ISODateTimeString;
  overallFit: OverallFit;
  confidence: EvaluationConfidence;
  summary: string;
  assessments: RequirementAssessment[];
};

export type EvaluationPipelineStatus = "pending" | "generated" | "reviewed";
