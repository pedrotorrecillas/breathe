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

export type QuestionConfidenceLevel = 1 | 2 | 3 | 4 | 5 | 6;

export type InterviewQuestion = {
  id: EntityId;
  requirementId: EntityId | null;
  kind: InterviewQuestionKind;
  prompt: string;
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
  questions: InterviewQuestion[];
};
