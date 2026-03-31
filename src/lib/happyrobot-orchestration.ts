import type { CandidateProfile } from "@/domain/candidates/types";
import type { InterviewPreparationPackage } from "@/domain/interview-preparation/types";
import type { InterviewRun } from "@/domain/interviews/types";
import type { Job } from "@/domain/jobs/types";
import type {
  HappyRobotCallRequest,
  HappyRobotDispatchResponse,
  HappyRobotNormalizedDispatchPayload,
} from "@/domain/runtime/happyrobot/types";
import {
  applyHappyRobotDispatchResponse,
  buildHappyRobotDispatchPayload,
  dispatchHappyRobotCall,
} from "@/lib/happyrobot-dispatch";
import { createInterviewPreparationPackage } from "@/lib/interview-preparation";
import { normalizeInterviewRunForDispatch } from "@/lib/interview-runtime-normalization";
import {
  traceDispatchCompleted,
  traceDispatchFailed,
  traceDispatchStarted,
  traceInterviewPreparationCompleted,
  traceInterviewPreparationStarted,
  type RuntimeTraceSink,
} from "@/lib/runtime-tracing";

export type HappyRobotDispatchPreparation = {
  interviewPackage: InterviewPreparationPackage;
  interviewRun: InterviewRun;
  callRequest: HappyRobotCallRequest;
  dispatchPayload: HappyRobotNormalizedDispatchPayload;
};

export type HappyRobotDispatchExecution = HappyRobotDispatchPreparation & {
  dispatchResponse: HappyRobotDispatchResponse;
};

export function prepareHappyRobotDispatch(input: {
  interviewRun: InterviewRun;
  candidate: CandidateProfile;
  job: Job;
  now?: Date;
  traceSink?: RuntimeTraceSink;
}): HappyRobotDispatchPreparation {
  const occurredAt = (input.now ?? new Date()).toISOString();

  traceInterviewPreparationStarted({
    sink: input.traceSink,
    occurredAt,
    interviewRunId: input.interviewRun.id,
    candidateId: input.candidate.id,
    jobId: input.job.id,
  });

  const interviewPackage = createInterviewPreparationPackage({
    job: input.job,
    candidateId: input.candidate.id,
    now: input.now,
  });
  const interviewRun = normalizeInterviewRunForDispatch({
    interviewRun: input.interviewRun,
    candidate: input.candidate,
    job: input.job,
    interviewPackage,
    now: input.now,
  });
  const callRequest: HappyRobotCallRequest = {
    jobId: input.job.id,
    candidateId: input.candidate.id,
    applicationId: input.interviewRun.applicationId,
    interviewRunId: interviewRun.id,
    interviewPackageId: interviewPackage.id,
    language: interviewPackage.language,
    disclosureText: interviewRun.metadata.disclosureText,
  };
  const dispatchPayload = buildHappyRobotDispatchPayload({
    interviewRun,
    candidate: input.candidate,
    job: input.job,
    interviewPackage,
  });

  traceInterviewPreparationCompleted({
    sink: input.traceSink,
    occurredAt,
    interviewRunId: interviewRun.id,
    candidateId: input.candidate.id,
    jobId: input.job.id,
    interviewPackageId: interviewPackage.id,
    language: interviewPackage.language,
    questionCount: interviewPackage.questions.length,
    normalizedAt: interviewRun.trace.normalizedAt,
    outboundNumber: dispatchPayload.outboundNumber,
  });

  return {
    interviewPackage,
    interviewRun,
    callRequest,
    dispatchPayload,
  };
}

export function executeHappyRobotDispatch(input: {
  interviewRun: InterviewRun;
  candidate: CandidateProfile;
  job: Job;
  now?: Date;
  simulateFailureReason?: string;
  traceSink?: RuntimeTraceSink;
}): HappyRobotDispatchExecution {
  const preparation = prepareHappyRobotDispatch(input);
  const dispatchedAt = (input.now ?? new Date()).toISOString();

  traceDispatchStarted({
    sink: input.traceSink,
    occurredAt: dispatchedAt,
    interviewRunId: preparation.interviewRun.id,
    candidateId: input.candidate.id,
    jobId: input.job.id,
    interviewPackageId: preparation.interviewPackage.id,
    language: preparation.dispatchPayload.language,
    outboundNumber: preparation.dispatchPayload.outboundNumber,
  });

  const dispatchResponse = dispatchHappyRobotCall({
    callRequest: preparation.callRequest,
    payload: preparation.dispatchPayload,
    now: input.now,
    simulateFailureReason: input.simulateFailureReason,
  });

  if (dispatchResponse.success) {
    traceDispatchCompleted({
      sink: input.traceSink,
      occurredAt: dispatchResponse.result.dispatchedAt,
      interviewRunId: preparation.interviewRun.id,
      candidateId: input.candidate.id,
      jobId: input.job.id,
      interviewPackageId: preparation.interviewPackage.id,
      language: preparation.dispatchPayload.language,
      outboundNumber: preparation.dispatchPayload.outboundNumber,
      providerCallId: dispatchResponse.result.providerCallId,
      providerStatus: dispatchResponse.result.status,
    });
  } else {
    traceDispatchFailed({
      sink: input.traceSink,
      occurredAt: dispatchResponse.error.happenedAt,
      interviewRunId: preparation.interviewRun.id,
      candidateId: input.candidate.id,
      jobId: input.job.id,
      interviewPackageId: preparation.interviewPackage.id,
      language: preparation.dispatchPayload.language,
      outboundNumber: preparation.dispatchPayload.outboundNumber,
      failureCode: dispatchResponse.error.code,
      failureMessage: dispatchResponse.error.message,
      providerStatus: dispatchResponse.error.providerStatus,
    });
  }

  return {
    ...preparation,
    interviewRun: applyHappyRobotDispatchResponse({
      interviewRun: preparation.interviewRun,
      response: dispatchResponse,
    }),
    dispatchResponse,
  };
}
