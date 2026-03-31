import type {
  EntityId,
  ISODateTimeString,
  SupportedLanguage,
} from "@/domain/shared/types";
import type {
  InterviewRuntimeLanguage,
  InterviewRuntimeTimezone,
  InterviewRunStatus,
} from "@/domain/interviews/types";
import type { InterviewQuestion } from "@/domain/interview-preparation/types";
import type { JobRequirement } from "@/domain/jobs/types";

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
  interviewRunId: EntityId;
  interviewPackageId: EntityId;
  language: SupportedLanguage;
  disclosureText: string;
};

export type HappyRobotRuntimeRequirement = Pick<
  JobRequirement,
  "id" | "label" | "category" | "weight" | "isKnockout"
>;

export type HappyRobotNormalizedDispatchPayload = {
  interviewRunId: EntityId;
  jobId: EntityId;
  candidateId: EntityId;
  applicationId: EntityId;
  interviewPackageId: EntityId;
  language: InterviewRuntimeLanguage;
  candidateTimezone: InterviewRuntimeTimezone;
  outboundNumber: string | null;
  disclosureText: string;
  nowUtc: ISODateTimeString | null;
  nowLocal: ISODateTimeString | null;
  jobConditions: HappyRobotRuntimeRequirement[];
  scoredRequirements: HappyRobotRuntimeRequirement[];
  questions: InterviewQuestion[];
  traceContext: {
    source: "public_apply_link";
    generatedAt: ISODateTimeString;
  };
};

export type HappyRobotCallResult = {
  providerCallId: string;
  providerAgentId: string | null;
  providerSessionId: string | null;
  status: HappyRobotCallStatus;
  dispatchedAt: ISODateTimeString;
  recordingUrl: string | null;
  transcriptUrl: string | null;
  startedAt: ISODateTimeString | null;
  endedAt: ISODateTimeString | null;
  failureReason: string | null;
};

export type HappyRobotDispatchFailureCode =
  | "missing_outbound_number"
  | "unsupported_language"
  | "provider_error";

export type HappyRobotDispatchFailure = {
  code: HappyRobotDispatchFailureCode;
  message: string;
  retryable: boolean;
  providerStatus: HappyRobotCallStatus | null;
  happenedAt: ISODateTimeString;
};

export type HappyRobotDispatchResponse =
  | {
      success: true;
      result: HappyRobotCallResult;
    }
  | {
      success: false;
      error: HappyRobotDispatchFailure;
    };

export type HappyRobotWebhookEvent = {
  eventId: EntityId;
  interviewRunId: EntityId | null;
  providerCallId: string;
  status: HappyRobotCallStatus;
  happenedAt: ISODateTimeString;
  recordingUrl?: string | null;
  transcriptUrl?: string | null;
  failureReason?: string | null;
  rawPayloadRef?: string | null;
};

export type ProviderOutcomeMapping = {
  internalStatus: InterviewRunStatus;
  keepInApplicants: boolean;
  shouldGenerateEvaluation: boolean;
};
