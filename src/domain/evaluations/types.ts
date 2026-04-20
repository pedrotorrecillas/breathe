import type { EntityId, ISODateTimeString } from "@/domain/shared/types";
import type { JobRequirementCategory } from "@/domain/jobs/types";

export type EvaluationScoreState =
  | "Outstanding"
  | "Great"
  | "Good"
  | "Average"
  | "Low"
  | "Poor"
  | "Pending";

export type EvaluationRequirementImportance = "MANDATORY" | "OPTIONAL";

export type EvaluationBlockCategory =
  | "essential"
  | "technical"
  | "interpersonal";

export type EvaluationEvidence = {
  highlightedQuote: string | null;
  transcriptStartMs: number | null;
  transcriptEndMs: number | null;
};

export type EvaluationRequirementResult = {
  requirementId: EntityId;
  label: string;
  importance: EvaluationRequirementImportance;
  numericScore: number | null;
  scoreState: EvaluationScoreState;
  explanation: string;
  evidence: EvaluationEvidence | null;
};

export type EvaluationBlockResult = {
  category: EvaluationBlockCategory;
  label: string;
  numericScore: number | null;
  scoreState: EvaluationScoreState;
  requirements: EvaluationRequirementResult[];
};

export type EvaluationWeightConfig = {
  mandatoryRequirementWeight: number;
  optionalRequirementWeight: number;
  essentialBlockWeight: number;
  technicalBlockWeight: number;
  interpersonalBlockWeight: number;
};

export type EvaluationRequirementEvidence = {
  requirementId: EntityId;
  requirementLabel: string;
  requirementCategory: JobRequirementCategory;
  answerText: string | null;
  highlightedQuote: string | null;
  transcriptStartMs: number | null;
  transcriptEndMs: number | null;
  extractionConfidence: number;
  extractionExplanation: string;
};

export type EvaluationRequirementEvidenceSet = {
  interviewRunId: EntityId;
  jobId: EntityId;
  generatedAt: ISODateTimeString;
  requirementEvidence: EvaluationRequirementEvidence[];
};

export type CandidateEvaluation = {
  id: EntityId;
  companyId: EntityId;
  interviewRunId: EntityId;
  generatedAt: ISODateTimeString;
  finalNumericScore: number | null;
  finalScoreState: EvaluationScoreState;
  blocks: EvaluationBlockResult[];
  weightConfigSnapshot: EvaluationWeightConfig;
  fitClassification?: "strong_fit" | "viable_fit" | "weak_fit" | null;
};

export type EvaluationPipelineStatus = "pending" | "generated" | "reviewed";
