import type { CandidateProfile } from "@/domain/candidates/types";
import type { InterviewPreparationPackage } from "@/domain/interview-preparation/types";
import type { InterviewRun } from "@/domain/interviews/types";
import type { Job } from "@/domain/jobs/types";
import type {
  HappyRobotNormalizedDispatchPayload,
  HappyRobotRuntimeRequirement,
} from "@/domain/runtime/happyrobot/types";

function toRuntimeRequirement(
  requirement: Job["requirements"][number],
): HappyRobotRuntimeRequirement {
  return {
    id: requirement.id,
    label: requirement.label,
    category: requirement.category,
    weight: requirement.weight,
    isKnockout: requirement.isKnockout,
  };
}

export function buildHappyRobotDispatchPayload(input: {
  interviewRun: InterviewRun;
  candidate: CandidateProfile;
  job: Job;
  interviewPackage: InterviewPreparationPackage;
}): HappyRobotNormalizedDispatchPayload {
  const { interviewRun, candidate, job, interviewPackage } = input;

  return {
    interviewRunId: interviewRun.id,
    jobId: job.id,
    candidateId: candidate.id,
    applicationId: interviewRun.applicationId,
    interviewPackageId: interviewPackage.id,
    language: interviewRun.metadata.selectedLanguage,
    candidateTimezone: interviewRun.metadata.candidateTimezone,
    outboundNumber: interviewRun.dispatch.outboundNumber,
    disclosureText: interviewRun.metadata.disclosureText,
    nowUtc: interviewRun.metadata.candidateTimezone.utcDateTime,
    nowLocal: interviewRun.metadata.candidateTimezone.localDateTime,
    jobConditions: job.requirements
      .filter((requirement) => requirement.category === "condition")
      .map(toRuntimeRequirement),
    scoredRequirements: job.requirements
      .filter((requirement) => requirement.category !== "condition")
      .map(toRuntimeRequirement),
    questions: interviewPackage.questions,
    traceContext: {
      source: "public_apply_link",
      generatedAt: interviewPackage.createdAt,
    },
  };
}
