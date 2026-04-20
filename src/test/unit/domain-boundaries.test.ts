import { describe, expect, it } from "vitest";

import type {
  CandidateApplication,
  CandidateProfile,
} from "@/domain/candidates/types";
import type { CandidateEvaluation } from "@/domain/evaluations/types";
import type { InterviewPreparationPackage } from "@/domain/interview-preparation/types";
import type { InterviewRun } from "@/domain/interviews/types";
import type { Job } from "@/domain/jobs/types";
import type {
  HappyRobotCallRequest,
  HappyRobotNormalizedDispatchPayload,
} from "@/domain/runtime/happyrobot/types";

describe("domain boundaries", () => {
  it("exposes coherent domain shapes for the Breathe MVP", () => {
    const candidate: CandidateProfile = {
      id: "cand_1",
      fullName: "Ana Torres",
      phone: "+34123456789",
      normalizedPhone: "+34123456789",
      email: "ana@example.com",
      normalizedEmail: "ana@example.com",
      linkedinUrl: null,
      cvAssetRef: null,
      locale: "es",
      source: "public_apply_link",
      consentAcceptedAt: null,
    };

    const application: CandidateApplication = {
      id: "app_1",
      candidateId: candidate.id,
      jobId: "job_1",
      source: "public_apply_link",
      stage: "applicant",
      submittedAt: "2026-03-24T00:00:00.000Z",
      needsHumanReviewAt: null,
      legalAcceptance: {
        acceptedAt: "2026-03-24T00:00:00.000Z",
        termsVersion: "2026-03-mvp",
      },
    };

    const job: Job = {
      id: "job_1",
      title: "Warehouse Associate",
      summary: "Night shift warehouse role with forklift-friendly intake.",
      location: "Madrid",
      status: "draft",
      interviewLanguage: "es",
      createdAt: "2026-03-24T00:00:00.000Z",
      publishedAt: null,
      expiresAt: null,
      publicApplyPath: "/apply/job_1",
      pipeline: {
        applicants: 1,
        interviewed: 0,
        shortlisted: 0,
        hired: 0,
        rejected: 0,
      },
      requirements: [],
      interviewLimits: {
        maxInterviews: null,
        outstandingCap: null,
        greatCap: null,
      },
    };

    const prepPackage: InterviewPreparationPackage = {
      id: "prep_1",
      jobId: job.id,
      candidateId: candidate.id,
      language: "es",
      createdAt: "2026-03-24T00:00:00.000Z",
      requirements: [],
      questions: [],
    };

    const runtimeRequest: HappyRobotCallRequest = {
      jobId: job.id,
      candidateId: candidate.id,
      applicationId: application.id,
      interviewRunId: "run_1",
      interviewPackageId: prepPackage.id,
      language: "es",
      disclosureText: "This interview is conducted using an AI-powered system.",
    };

    const normalizedPayload: HappyRobotNormalizedDispatchPayload = {
      interviewRunId: "run_1",
      jobId: job.id,
      jobTitle: job.title,
      candidateId: candidate.id,
      candidateName: candidate.fullName,
      applicationId: application.id,
      interviewPackageId: prepPackage.id,
      language: "es",
      candidateTimezone: {
        timezone: "Europe/Madrid",
        localDateTime: "2026-03-24T09:00:00.000Z",
        utcDateTime: "2026-03-24T08:00:00.000Z",
      },
      outboundNumber: "+34910000000",
      disclosureText:
        "This interview is conducted using an AI-powered system.",
      nowUtc: "2026-03-24T08:00:00.000Z",
      nowLocal: "2026-03-24T09:00:00.000Z",
      jobConditions: [],
      scoredRequirements: [],
      questions: [],
      traceContext: {
        source: "public_apply_link",
        generatedAt: "2026-03-24T08:00:00.000Z",
      },
    };

    const evaluation: CandidateEvaluation = {
      id: "eval_1",
      companyId: "company_seed_demo",
      interviewRunId: "run_1",
      generatedAt: "2026-03-24T00:00:00.000Z",
      finalNumericScore: null,
      finalScoreState: "Pending",
      blocks: [
        {
          category: "essential",
          label: "Essential requirements",
          numericScore: null,
          scoreState: "Pending",
          requirements: [],
        },
        {
          category: "technical",
          label: "Technical skills",
          numericScore: null,
          scoreState: "Pending",
          requirements: [],
        },
        {
          category: "interpersonal",
          label: "Interpersonal skills",
          numericScore: null,
          scoreState: "Pending",
          requirements: [],
        },
      ],
      weightConfigSnapshot: {
        mandatoryRequirementWeight: 0.8,
        optionalRequirementWeight: 0.2,
        essentialBlockWeight: 0.45,
        technicalBlockWeight: 0.45,
        interpersonalBlockWeight: 0.1,
      },
      fitClassification: null,
    };

    const interviewRun: InterviewRun = {
      id: "run_1",
      candidateId: candidate.id,
      applicationId: application.id,
      jobId: job.id,
      interviewPreparationId: prepPackage.id,
      provider: "happyrobot",
      status: "created",
      pipelineStage: "applicant",
      dispatch: {
        dispatchedAt: null,
        providerCallId: null,
        providerAgentId: null,
        providerSessionId: null,
        outboundNumber: "+34910000000",
      },
      metadata: {
        selectedLanguage: "es",
        candidateTimezone: {
          timezone: "Europe/Madrid",
          localDateTime: "2026-03-24T09:00:00.000Z",
          utcDateTime: "2026-03-24T08:00:00.000Z",
        },
        disclosedWithAi: true,
        disclosureText:
          "This interview is conducted using an AI-powered system.",
        callbackRequestedAt: null,
        failureReason: null,
        providerOutcomeLabel: null,
      },
      trace: {
        createdAt: "2026-03-24T08:00:00.000Z",
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

    expect(candidate.id).toBe(application.candidateId);
    expect(runtimeRequest.applicationId).toBe(application.id);
    expect(normalizedPayload.interviewRunId).toBe(interviewRun.id);
    expect(prepPackage.jobId).toBe(job.id);
    expect(interviewRun.jobId).toBe(job.id);
    expect(evaluation.interviewRunId).toBe(interviewRun.id);
  });
});
