import type {
  EntityId,
  ISODateString,
  ISODateTimeString,
  SupportedLanguage,
} from "@/domain/shared/types";

export type JobId = EntityId;

export type JobStatus = "draft" | "active" | "inactive";

export type JobRequirementCategory =
  | "condition"
  | "essential"
  | "technical"
  | "interpersonal";

export type JobConditionCode =
  | "salary"
  | "location"
  | "schedule"
  | "right_to_work"
  | "driving_license"
  | "remote_policy"
  | "contract_type"
  | "visa_status"
  | "other";

export type JobRequirement = {
  id: EntityId;
  code: JobConditionCode | null;
  label: string;
  description: string;
  category: JobRequirementCategory;
  weight: number;
  isKnockout: boolean;
};

export type JobInterviewLimits = {
  maxInterviews: number | null;
  outstandingCap: number | null;
  greatCap: number | null;
};

export type JobPipelineSnapshot = {
  applicants: number;
  interviewed: number;
  shortlisted: number;
  hired: number;
  rejected: number;
};

export type Job = {
  id: JobId;
  companyId: EntityId;
  title: string;
  summary: string;
  location: string | null;
  status: JobStatus;
  interviewLanguage: SupportedLanguage;
  createdAt: ISODateTimeString;
  publishedAt: ISODateTimeString | null;
  expiresAt: ISODateString | null;
  publicApplyPath: string | null;
  pipeline: JobPipelineSnapshot;
  requirements: JobRequirement[];
  interviewLimits: JobInterviewLimits;
};
