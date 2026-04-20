import type {
  EntityId,
  ISODateTimeString,
  SupportedLanguage,
} from "@/domain/shared/types";

export type CandidateId = EntityId;

export type CandidateSource =
  | "public_apply_link"
  | "ats"
  | "referral"
  | "manual";

export type CandidatePipelineStage =
  | "applicant"
  | "interviewed"
  | "shortlisted"
  | "hired"
  | "rejected"
  | "needs_human";

export type CandidateLegalAcceptance = {
  acceptedAt: ISODateTimeString;
  termsVersion: string;
};

export type CandidateProfile = {
  id: CandidateId;
  companyId: EntityId;
  fullName: string;
  phone: string;
  normalizedPhone: string;
  email: string | null;
  normalizedEmail: string | null;
  linkedinUrl: string | null;
  cvAssetRef: string | null;
  locale: SupportedLanguage;
  source: CandidateSource;
  consentAcceptedAt: ISODateTimeString | null;
};

export type CandidateApplication = {
  id: EntityId;
  companyId: EntityId;
  candidateId: CandidateId;
  jobId: EntityId;
  source: CandidateSource;
  stage: CandidatePipelineStage;
  submittedAt: ISODateTimeString;
  needsHumanReviewAt: ISODateTimeString | null;
  legalAcceptance: CandidateLegalAcceptance | null;
};

export type CandidateNote = {
  id: EntityId;
  companyId: EntityId;
  candidateId: CandidateId;
  applicationId: EntityId;
  jobId: EntityId;
  body: string;
  createdAt: ISODateTimeString;
  authorUserId: EntityId | null;
  authorName: string | null;
};
