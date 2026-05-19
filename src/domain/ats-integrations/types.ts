import type { EntityId, ISODateTimeString } from "@/domain/shared/types";

export const atsProviderKeys = [
  "mock_ats",
  "zoho_recruit",
  "recruitee",
  "ashby",
  "teamtailor",
  "greenhouse",
  "lever",
  "kombo",
] as const;

export type ATSProviderKey = (typeof atsProviderKeys)[number];

export function isATSProviderKey(value: unknown): value is ATSProviderKey {
  return (
    typeof value === "string" &&
    atsProviderKeys.includes(value as ATSProviderKey)
  );
}

export type ATSConnectionStatus = "draft" | "active" | "paused" | "error";

export type ATSAuthMode = "oauth" | "api_token" | "env_token" | "mock";

export type ATSSyncMode = "manual" | "scheduled" | "webhook_plus_polling";

export type ATSConnection = {
  id: EntityId;
  companyId: EntityId;
  provider: ATSProviderKey;
  status: ATSConnectionStatus;
  syncMode?: ATSSyncMode;
  displayName: string;
  authMode: ATSAuthMode;
  secretRef: string | null;
  externalAccountId: string | null;
  lastSyncAt: ISODateTimeString | null;
  lastError: string | null;
  createdAt: ISODateTimeString;
  updatedAt: ISODateTimeString;
  writebackPolicy?: ATSWritebackPolicy;
};

export type ATSExternalRecordStatus =
  | "active"
  | "archived_external"
  | "deleted_external";

export type ATSStageCategory =
  | "new"
  | "screening"
  | "interview"
  | "evaluation"
  | "offer"
  | "hired"
  | "rejected"
  | "other";

export type ATSRawSnapshot = Record<string, unknown>;

export type ATSCanonicalJob = {
  id: EntityId;
  companyId: EntityId;
  connectionId: EntityId;
  provider: ATSProviderKey;
  externalId: string;
  externalUrl: string | null;
  title: string;
  status: ATSExternalRecordStatus;
  externalUpdatedAt: ISODateTimeString | null;
  lastSeenAt: ISODateTimeString;
  rawSnapshot: ATSRawSnapshot;
};

export type ATSCanonicalCandidate = {
  id: EntityId;
  companyId: EntityId;
  connectionId: EntityId;
  provider: ATSProviderKey;
  externalId: string;
  externalUrl: string | null;
  fullName: string;
  email: string | null;
  phone: string | null;
  status: ATSExternalRecordStatus;
  externalUpdatedAt: ISODateTimeString | null;
  lastSeenAt: ISODateTimeString;
  rawSnapshot: ATSRawSnapshot;
};

export type ATSCanonicalStage = {
  id: EntityId;
  companyId: EntityId;
  connectionId: EntityId;
  provider: ATSProviderKey;
  externalJobId: string | null;
  externalId: string;
  name: string;
  category: ATSStageCategory;
  position: number;
  status: ATSExternalRecordStatus;
  lastSeenAt: ISODateTimeString;
  rawSnapshot: ATSRawSnapshot;
};

export type ATSCanonicalApplication = {
  id: EntityId;
  companyId: EntityId;
  connectionId: EntityId;
  provider: ATSProviderKey;
  externalId: string;
  externalCandidateId: string;
  externalJobId: string | null;
  externalStageId: string | null;
  externalUrl: string | null;
  internalCandidateId: EntityId | null;
  internalApplicationId: EntityId | null;
  internalJobId: EntityId | null;
  candidateName: string;
  candidateEmail: string | null;
  candidatePhone: string | null;
  jobTitle: string | null;
  stageName: string | null;
  stageCategory: ATSStageCategory;
  status: ATSExternalRecordStatus;
  externalUpdatedAt: ISODateTimeString | null;
  lastSeenAt: ISODateTimeString;
  rawSnapshot: ATSRawSnapshot;
};

export type ATSSyncResource = "jobs" | "candidates" | "applications" | "stages";

export type ATSSyncCursor = {
  id: EntityId;
  companyId: EntityId;
  connectionId: EntityId;
  provider: ATSProviderKey;
  resource: ATSSyncResource;
  cursor: string | null;
  syncedUntil: ISODateTimeString | null;
  updatedAt: ISODateTimeString;
};

export type ATSSyncEventType =
  | "job_seen"
  | "candidate_seen"
  | "application_seen"
  | "application_stage_changed"
  | "external_record_archived";

export type ATSSyncEvent = {
  id: EntityId;
  companyId: EntityId;
  connectionId: EntityId;
  provider: ATSProviderKey;
  eventType: ATSSyncEventType;
  externalObjectType: "job" | "candidate" | "application" | "stage";
  externalObjectId: string;
  externalJobId: string | null;
  externalCandidateId: string | null;
  externalStageId: string | null;
  occurredAt: ISODateTimeString;
  processedAt: ISODateTimeString | null;
  idempotencyKey: string;
  payload: ATSRawSnapshot;
};

export type ATSTriggerAction =
  | "import_candidate"
  | "prepare_interview"
  | "queue_interview"
  | "dispatch_interview";

export type ATSTriggerRule = {
  id: EntityId;
  companyId: EntityId;
  connectionId: EntityId;
  provider: ATSProviderKey;
  name: string;
  enabled: boolean;
  externalJobId: string | null;
  externalStageId: string;
  actions: ATSTriggerAction[];
  requiresRecruiterApproval: boolean;
  createdAt: ISODateTimeString;
  updatedAt: ISODateTimeString;
};

export type ATSWritebackActionType =
  | "candidate_note"
  | "candidate_report_link"
  | "candidate_custom_field"
  | "application_stage_move"
  | "status_comment";

export type ATSWritebackStatus =
  | "queued"
  | "succeeded"
  | "skipped"
  | "retryable_error"
  | "terminal_error";

export type ATSWritebackAction = {
  id: EntityId;
  companyId: EntityId;
  connectionId: EntityId;
  provider: ATSProviderKey;
  actionType: ATSWritebackActionType;
  targetExternalCandidateId: string | null;
  targetExternalApplicationId: string | null;
  targetExternalJobId: string | null;
  targetExternalStageId: string | null;
  sourceObjectType: "evaluation" | "interview_run" | "manual_admin_action";
  sourceObjectId: EntityId;
  status: ATSWritebackStatus;
  idempotencyKey: string;
  payload: ATSRawSnapshot;
  createdAt: ISODateTimeString;
  updatedAt: ISODateTimeString;
};

export type ATSWritebackPolicy = {
  reportMode: "candidate_note" | "status_comment" | "disabled";
  moveToExternalStageId: string | null;
  stageMoveMappings?: Partial<Record<ATSInternalStageKey, string | null>>;
  requiresRecruiterReview: boolean;
};

export type ATSInternalStageKey =
  | "applicant"
  | "interviewed"
  | "shortlisted"
  | "hired"
  | "rejected"
  | "needs_human";

export type ATSWritebackAttempt = {
  id: EntityId;
  writebackActionId: EntityId;
  attemptedAt: ISODateTimeString;
  status: ATSWritebackStatus;
  providerStatusCode: number | null;
  providerResponse: ATSRawSnapshot;
  errorMessage: string | null;
};

export type ATSWritebackResult = {
  status: ATSWritebackStatus;
  providerStatusCode: number | null;
  providerResponse: ATSRawSnapshot;
  errorMessage: string | null;
};

export type ATSWorkflowRequest = {
  id: EntityId;
  companyId: EntityId;
  connectionId: EntityId;
  provider: ATSProviderKey;
  atsSyncEventId: EntityId;
  atsTriggerRuleId: EntityId;
  externalApplicationId: string;
  internalCandidateId: EntityId | null;
  internalApplicationId: EntityId | null;
  requestedActions: ATSTriggerAction[];
  requiresRecruiterApproval: boolean;
  status: "queued" | "completed" | "skipped" | "error";
  createdAt: ISODateTimeString;
  updatedAt: ISODateTimeString;
};
