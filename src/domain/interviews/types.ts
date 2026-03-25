import type {
  EntityId,
  ISODateTimeString,
  SupportedLanguage,
} from "@/domain/shared/types";

export type InterviewPipelineStage =
  | "applicant"
  | "interviewed"
  | "shortlisted"
  | "hired"
  | "rejected";

export type InterviewRunStatus =
  | "created"
  | "normalized"
  | "dispatching"
  | "queued"
  | "dialing"
  | "in_progress"
  | "completed"
  | "human_requested"
  | "failed_job_condition"
  | "no_response"
  | "disconnected"
  | "error";

export type InterviewProvider = "happyrobot";

export type InterviewRuntimeLanguage =
  | SupportedLanguage
  | "auto_detected"
  | "unsupported";

export type InterviewRuntimeTimezone = {
  timezone: string | null;
  localDateTime: ISODateTimeString | null;
  utcDateTime: ISODateTimeString | null;
};

export type InterviewRuntimeDispatch = {
  dispatchedAt: ISODateTimeString | null;
  providerCallId: string | null;
  providerAgentId: string | null;
  providerSessionId: string | null;
  outboundNumber: string | null;
};

export type InterviewRuntimeArtifacts = {
  recordingUrl: string | null;
  transcriptUrl: string | null;
  transcriptAssetRef: string | null;
  providerPayloadSnapshotRef: string | null;
  recordingDurationSeconds: number | null;
};

export type InterviewRuntimeTrace = {
  createdAt: ISODateTimeString;
  normalizedAt: ISODateTimeString | null;
  initiatedAt: ISODateTimeString | null;
  completedAt: ISODateTimeString | null;
  lastEventAt: ISODateTimeString | null;
};

export type InterviewRuntimeMetadata = {
  selectedLanguage: InterviewRuntimeLanguage;
  candidateTimezone: InterviewRuntimeTimezone;
  disclosedWithAi: boolean;
  disclosureText: string;
  callbackRequestedAt: ISODateTimeString | null;
  failureReason: string | null;
  providerOutcomeLabel: string | null;
};

export type InterviewRun = {
  id: EntityId;
  candidateId: EntityId;
  applicationId: EntityId;
  jobId: EntityId;
  interviewPreparationId: EntityId | null;
  provider: InterviewProvider;
  status: InterviewRunStatus;
  pipelineStage: InterviewPipelineStage;
  dispatch: InterviewRuntimeDispatch;
  metadata: InterviewRuntimeMetadata;
  trace: InterviewRuntimeTrace;
  artifacts: InterviewRuntimeArtifacts;
};
