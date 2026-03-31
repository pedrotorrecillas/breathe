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
}): HappyRobotDispatchPreparation {
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
}): HappyRobotDispatchExecution {
  const preparation = prepareHappyRobotDispatch(input);
  const dispatchResponse = dispatchHappyRobotCall({
    callRequest: preparation.callRequest,
    payload: preparation.dispatchPayload,
    now: input.now,
    simulateFailureReason: input.simulateFailureReason,
  });

  return {
    ...preparation,
    interviewRun: applyHappyRobotDispatchResponse({
      interviewRun: preparation.interviewRun,
      response: dispatchResponse,
    }),
    dispatchResponse,
  };
}
