import type {
  CandidateApplication,
  CandidateProfile,
  CandidateSource,
} from "@/domain/candidates/types";
import type { InterviewRun } from "@/domain/interviews/types";
import type { SupportedLanguage } from "@/domain/shared/types";
import type {
  NormalizedCandidateProfileSource,
  PublicApplyLegalAcceptance,
} from "@/lib/public-apply";

type PublicApplySubmissionInput = {
  jobId: string;
  fullName: string;
  phone: string;
  email: string;
  language: SupportedLanguage;
  profileSource: NormalizedCandidateProfileSource;
  legalAcceptance: PublicApplyLegalAcceptance;
};

type PublicApplyFailureMode = "candidate" | "application" | "interview";

const candidates: CandidateProfile[] = [];
const applications: CandidateApplication[] = [];
const interviewRuns: InterviewRun[] = [];

function normalizePhone(phone: string) {
  const trimmed = phone.trim();
  const hasPlusPrefix = trimmed.startsWith("+");
  const digits = trimmed.replace(/[^\d]/g, "");
  return `${hasPlusPrefix ? "+" : ""}${digits}`;
}

function normalizeEmail(email: string) {
  const trimmed = email.trim().toLowerCase();
  return trimmed || null;
}

function nextId(prefix: string, count: number) {
  return `${prefix}_${count + 1}`;
}

export function resetPublicApplySubmissionStore() {
  candidates.length = 0;
  applications.length = 0;
  interviewRuns.length = 0;
}

export function getPublicApplySubmissionSnapshot() {
  return {
    candidates: [...candidates],
    applications: [...applications],
    interviewRuns: [...interviewRuns],
  };
}

export function submitPublicApplication(
  input: PublicApplySubmissionInput,
  options?: {
    failureMode?: PublicApplyFailureMode;
  },
):
  | {
      success: true;
      data: {
        candidate: CandidateProfile;
        application: CandidateApplication;
        interviewRun: InterviewRun;
      };
    }
  | {
      success: false;
      error: string;
    } {
  if (options?.failureMode === "candidate") {
    return {
      success: false,
      error: "Candidate creation failed before persistence.",
    };
  }

  const normalizedPhone = normalizePhone(input.phone);
  const normalizedEmail = normalizeEmail(input.email);
  const source: CandidateSource = "public_apply_link";

  const existingCandidate =
    candidates.find((candidate) => candidate.normalizedPhone === normalizedPhone) ??
    (normalizedEmail
      ? candidates.find(
          (candidate) => candidate.normalizedEmail === normalizedEmail,
        ) ?? null
      : null);

  const stagedCandidate: CandidateProfile = existingCandidate
    ? {
        ...existingCandidate,
        fullName: input.fullName.trim(),
        phone: input.phone.trim(),
        normalizedPhone,
        email: input.email.trim() || null,
        normalizedEmail,
        linkedinUrl: input.profileSource.linkedinUrl,
        cvAssetRef: input.profileSource.cvAssetRef,
        locale: input.language,
        source,
        consentAcceptedAt: input.legalAcceptance.acceptedAt,
      }
    : {
        id: nextId("cand", candidates.length),
        fullName: input.fullName.trim(),
        phone: input.phone.trim(),
        normalizedPhone,
        email: input.email.trim() || null,
        normalizedEmail,
        linkedinUrl: input.profileSource.linkedinUrl,
        cvAssetRef: input.profileSource.cvAssetRef,
        locale: input.language,
        source,
        consentAcceptedAt: input.legalAcceptance.acceptedAt,
      };

  if (options?.failureMode === "application") {
    return {
      success: false,
      error: "Application creation failed before persistence.",
    };
  }

  const stagedApplication: CandidateApplication = {
    id: nextId("app", applications.length),
    candidateId: stagedCandidate.id,
    jobId: input.jobId,
    source,
    stage: "applicant",
    submittedAt: input.legalAcceptance.acceptedAt,
    needsHumanReviewAt: null,
    legalAcceptance: input.legalAcceptance,
  };

  if (options?.failureMode === "interview") {
    return {
      success: false,
      error: "Interview run creation failed before persistence.",
    };
  }

  const stagedInterviewRun: InterviewRun = {
    id: nextId("run", interviewRuns.length),
    candidateId: stagedCandidate.id,
    applicationId: stagedApplication.id,
    jobId: input.jobId,
    interviewPreparationId: null,
    provider: "happyrobot",
    status: "queued",
    pipelineStage: "applicant",
    dispatch: {
      dispatchedAt: null,
      providerCallId: null,
      providerAgentId: null,
      providerSessionId: null,
      outboundNumber: stagedCandidate.normalizedPhone,
    },
    metadata: {
      selectedLanguage: input.language,
      candidateTimezone: {
        timezone: null,
        localDateTime: null,
        utcDateTime: null,
      },
      disclosedWithAi: true,
      disclosureText: "This interview is conducted using an AI-powered system.",
      callbackRequestedAt: null,
      failureReason: null,
      providerOutcomeLabel: null,
    },
    trace: {
      createdAt: input.legalAcceptance.acceptedAt,
      normalizedAt: null,
      initiatedAt: null,
      completedAt: null,
      lastEventAt: null,
    },
    artifacts: {
      recordingUrl: null,
      transcriptUrl: null,
      transcriptAssetRef: null,
      providerPayloadSnapshotRef: null,
      recordingDurationSeconds: null,
    },
  };

  if (existingCandidate) {
    const candidateIndex = candidates.findIndex(
      (candidate) => candidate.id === existingCandidate.id,
    );
    candidates[candidateIndex] = stagedCandidate;
  } else {
    candidates.push(stagedCandidate);
  }

  applications.push(stagedApplication);
  interviewRuns.push(stagedInterviewRun);

  return {
    success: true,
    data: {
      candidate: stagedCandidate,
      application: stagedApplication,
      interviewRun: stagedInterviewRun,
    },
  };
}
