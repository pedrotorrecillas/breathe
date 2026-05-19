import type {
  ATSConnection,
  ATSProviderKey,
  ATSRawSnapshot,
  ATSStageCategory,
  ATSWritebackAction,
  ATSWritebackResult,
} from "@/domain/ats-integrations/types";

export type ATSConnectionAuth = {
  connection: ATSConnection;
};

export type ATSConnectionCheck = {
  ok: boolean;
  externalAccountId: string | null;
  message: string;
};

export type ATSSyncInput = {
  connection: ATSConnection;
  cursor: string | null;
  limit: number;
};

export type ATSJobStagesInput = {
  connection: ATSConnection;
  externalJobId: string;
};

export type ATSCandidateLookupInput = {
  connection: ATSConnection;
  externalCandidateId: string;
};

export type ATSWritebackInput = {
  connection: ATSConnection;
  action: ATSWritebackAction;
};

export type ATSSyncPage<TRecord> = {
  records: TRecord[];
  nextCursor: string | null;
  hasMore: boolean;
};

export type ATSProviderJob = {
  externalId: string;
  externalUrl: string | null;
  title: string;
  status: "active" | "archived_external" | "deleted_external";
  externalUpdatedAt: string | null;
  raw: ATSRawSnapshot;
};

export type ATSProviderCandidate = {
  externalId: string;
  externalUrl: string | null;
  fullName: string;
  email: string | null;
  phone: string | null;
  status: "active" | "archived_external" | "deleted_external";
  externalUpdatedAt: string | null;
  raw: ATSRawSnapshot;
};

export type ATSProviderStage = {
  externalId: string;
  externalJobId: string | null;
  name: string;
  category: ATSStageCategory;
  position: number;
  raw: ATSRawSnapshot;
};

export type ATSProviderApplication = {
  externalId: string;
  externalCandidateId: string;
  externalJobId: string | null;
  externalStageId: string | null;
  externalUrl: string | null;
  candidateName: string;
  candidateEmail: string | null;
  candidatePhone: string | null;
  jobTitle: string | null;
  stageName: string | null;
  stageCategory: ATSStageCategory;
  status: "active" | "archived_external" | "deleted_external";
  externalUpdatedAt: string | null;
  raw: ATSRawSnapshot;
};

export type ATSAdapterCapabilities = {
  supportsWebhooks: boolean;
  supportsPolling: boolean;
  supportsCandidateNotes: boolean;
  supportsReportLinks: boolean;
  supportsStageMove: boolean;
  supportsCustomFields: boolean;
  supportsAttachments: boolean;
};

export type ATSAdapter = {
  provider: ATSProviderKey;
  capabilities: ATSAdapterCapabilities;
  validateConnection(input: ATSConnectionAuth): Promise<ATSConnectionCheck>;
  listJobs(input: ATSSyncInput): Promise<ATSSyncPage<ATSProviderJob>>;
  listStages(input: ATSJobStagesInput): Promise<ATSProviderStage[]>;
  listApplications(
    input: ATSSyncInput,
  ): Promise<ATSSyncPage<ATSProviderApplication>>;
  getCandidate(
    input: ATSCandidateLookupInput,
  ): Promise<ATSProviderCandidate | null>;
  writeback(input: ATSWritebackInput): Promise<ATSWritebackResult>;
};
