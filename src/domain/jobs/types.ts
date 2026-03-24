export type JobStatus = "draft" | "active" | "inactive";
export type InterviewLanguage = "en" | "es";

export type RequirementCategory =
  | "condition"
  | "essential"
  | "technical"
  | "interpersonal";

export type JobRequirement = {
  id: string;
  label: string;
  description: string;
  category: RequirementCategory;
  weight: number;
  knockout: boolean;
};

export type InterviewLimits = {
  maxInterviews: number | null;
  stopAfterStrongFits: number | null;
};

export type JobPipelineSnapshot = {
  applicants: number;
  interviewed: number;
  shortlisted: number;
  hired: number;
  rejected: number;
};

export type Job = {
  id: string;
  title: string;
  status: JobStatus;
  interviewLanguage: InterviewLanguage;
  createdAt: string;
  publicApplyPath: string | null;
  pipeline: JobPipelineSnapshot;
  requirements: JobRequirement[];
  interviewLimits: InterviewLimits;
};
