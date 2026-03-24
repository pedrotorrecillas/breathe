export type CandidateLanguage = "en" | "es";

export type CandidateProfile = {
  id: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  email: string;
  locale: CandidateLanguage;
  consentAcceptedAt: string | null;
  source: "public_apply_link" | "ats" | "referral" | "manual";
};

export type CandidatePipelineStage =
  | "applicant"
  | "interviewed"
  | "shortlisted"
  | "hired"
  | "rejected"
  | "needs_human";
