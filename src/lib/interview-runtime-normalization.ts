import type { CandidateProfile } from "@/domain/candidates/types";
import type { InterviewPreparationPackage } from "@/domain/interview-preparation/types";
import type {
  InterviewRuntimeLanguage,
  InterviewRuntimeTimezone,
  InterviewRun,
} from "@/domain/interviews/types";
import type { Job } from "@/domain/jobs/types";

const defaultTimezone = "Europe/Madrid";
const defaultOutboundNumber = "+34910000000";

function toIsoDateTime(value: Date) {
  return value.toISOString();
}

export function normalizeInterviewRuntimeLanguage(input: {
  candidateLocale: CandidateProfile["locale"] | null;
  jobLanguage: Job["interviewLanguage"];
}): InterviewRuntimeLanguage {
  const { candidateLocale, jobLanguage } = input;

  if (candidateLocale === jobLanguage) {
    return jobLanguage;
  }

  return jobLanguage;
}

export function normalizeInterviewRuntimeTimezone(input: {
  candidateTimezone?: string | null;
  now?: Date;
}): InterviewRuntimeTimezone {
  const now = input.now ?? new Date();
  const timezone = input.candidateTimezone?.trim() || defaultTimezone;

  return {
    timezone,
    localDateTime: toIsoDateTime(now),
    utcDateTime: toIsoDateTime(now),
  };
}

export function selectInterviewOutboundNumber(input: {
  candidatePhone: string;
}) {
  return input.candidatePhone.startsWith("+34")
    ? "+34910000000"
    : defaultOutboundNumber;
}

export function normalizeInterviewRunForDispatch(input: {
  interviewRun: InterviewRun;
  candidate: CandidateProfile;
  job: Job;
  interviewPackage: InterviewPreparationPackage;
  candidateTimezone?: string | null;
  now?: Date;
}): InterviewRun {
  const runtimeLanguage = normalizeInterviewRuntimeLanguage({
    candidateLocale: input.candidate.locale,
    jobLanguage: input.job.interviewLanguage,
  });
  const runtimeTimezone = normalizeInterviewRuntimeTimezone({
    candidateTimezone: input.candidateTimezone,
    now: input.now,
  });
  const outboundNumber = selectInterviewOutboundNumber({
    candidatePhone: input.candidate.normalizedPhone,
  });

  return {
    ...input.interviewRun,
    interviewPreparationId: input.interviewPackage.id,
    status: "normalized",
    dispatch: {
      ...input.interviewRun.dispatch,
      outboundNumber,
    },
    metadata: {
      ...input.interviewRun.metadata,
      selectedLanguage: runtimeLanguage,
      candidateTimezone: runtimeTimezone,
    },
    trace: {
      ...input.interviewRun.trace,
      normalizedAt: runtimeTimezone.utcDateTime,
    },
  };
}
