import type {
  EntityId,
  ISODateTimeString,
  SupportedLanguage,
} from "@/domain/shared/types";

export type HappyRobotCallStatus =
  | "queued"
  | "dialing"
  | "connected"
  | "completed"
  | "failed"
  | "needs_human";

export type HappyRobotCallRequest = {
  jobId: EntityId;
  candidateId: EntityId;
  applicationId: EntityId;
  language: SupportedLanguage;
  disclosureText: string;
  interviewPackageId: EntityId;
};

export type HappyRobotCallResult = {
  providerCallId: string;
  status: HappyRobotCallStatus;
  recordingUrl: string | null;
  transcriptUrl: string | null;
  startedAt: ISODateTimeString | null;
  endedAt: ISODateTimeString | null;
  failureReason: string | null;
};

export type HappyRobotWebhookEvent = {
  eventId: EntityId;
  providerCallId: string;
  status: HappyRobotCallStatus;
  happenedAt: ISODateTimeString;
};
