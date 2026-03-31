import type {
  EntityId,
  ISODateTimeString,
  SupportedLanguage,
} from "@/domain/shared/types";
import type { JobRequirement } from "@/domain/jobs/types";

export type InterviewQuestionKind =
  | "condition_check"
  | "requirement_probe"
  | "experience_probe"
  | "soft_skill_probe"
  | "language_check"
  | "closing";

export type InterviewQuestionType = "standard" | "killer" | "language";

export type QuestionConfidenceBand =
  | "excellent"
  | "very_good"
  | "good"
  | "adequate"
  | "poor"
  | "inadequate";

export type QuestionConfidenceLevel = {
  band: QuestionConfidenceBand;
  level: string;
  description: string;
};

export type InterviewQuestion = {
  id: EntityId;
  requirementId: EntityId | null;
  kind: InterviewQuestionKind;
  type: InterviewQuestionType;
  prompt: string;
  metadata: string | null;
  rubric: string;
  confidenceLevels: QuestionConfidenceLevel[];
};

export type InterviewPreparationContext = {
  jobId: EntityId;
  language: SupportedLanguage;
  generatedAt: ISODateTimeString;
  requirements: JobRequirement[];
};

export type InterviewPreparationPackage = {
  id: EntityId;
  jobId: EntityId;
  candidateId: EntityId | null;
  language: SupportedLanguage;
  createdAt: ISODateTimeString;
  requirements: JobRequirement[];
  questions: InterviewQuestion[];
};
