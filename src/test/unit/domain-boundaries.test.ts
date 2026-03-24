import { describe, expect, it } from "vitest";

import type {
  CandidateApplication,
  CandidateProfile,
} from "@/domain/candidates/types";
import type { CandidateEvaluation } from "@/domain/evaluations/types";
import type { InterviewPreparationPackage } from "@/domain/interview-preparation/types";
import type { InterviewRun } from "@/domain/interviews/types";
import type { Job } from "@/domain/jobs/types";
import type { HappyRobotCallRequest } from "@/domain/runtime/happyrobot/types";

describe("domain boundaries", () => {
  it("exposes coherent domain shapes for the Clara MVP", () => {
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
    };

    const job: Job = {
      id: "job_1",
      title: "Warehouse Associate",
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
        stopAfterStrongFits: null,
      },
    };

    const prepPackage: InterviewPreparationPackage = {
      id: "prep_1",
      jobId: job.id,
      candidateId: candidate.id,
      language: "es",
      createdAt: "2026-03-24T00:00:00.000Z",
      questions: [],
    };

    const runtimeRequest: HappyRobotCallRequest = {
      jobId: job.id,
      candidateId: candidate.id,
      applicationId: application.id,
      language: "es",
      disclosureText: "This interview is conducted using an AI-powered system.",
      interviewPackageId: prepPackage.id,
    };

    const evaluation: CandidateEvaluation = {
      id: "eval_1",
      interviewRunId: "run_1",
      generatedAt: "2026-03-24T00:00:00.000Z",
      overallFit: "pending",
      confidence: "pending",
      summary: "Awaiting interview completion.",
      assessments: [],
    };

    const interviewRun: InterviewRun = {
      id: "run_1",
      candidateId: candidate.id,
      jobId: job.id,
      provider: "happyrobot",
      status: "queued",
      initiatedAt: null,
      completedAt: null,
      recordingUrl: null,
      transcriptUrl: null,
    };

    expect(candidate.id).toBe(application.candidateId);
    expect(runtimeRequest.applicationId).toBe(application.id);
    expect(prepPackage.jobId).toBe(job.id);
    expect(interviewRun.jobId).toBe(job.id);
    expect(evaluation.interviewRunId).toBe(interviewRun.id);
  });
});
