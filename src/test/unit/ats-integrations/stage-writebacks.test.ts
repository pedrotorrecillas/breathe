import { describe, expect, it } from "vitest";

import type {
  ATSCanonicalApplication,
  ATSConnection,
} from "@/domain/ats-integrations/types";
import type { CandidateApplication } from "@/domain/candidates/types";
import { stageMappingValueForExternalStage } from "@/lib/ats-integrations/stage-mappings";
import { buildATSStageMoveWritebacksForApplicationStageChange } from "@/lib/ats-integrations/stage-writebacks";

const application: CandidateApplication = {
  id: "application_1",
  companyId: "company_1",
  candidateId: "candidate_1",
  jobId: "job_1",
  source: "ats",
  stage: "shortlisted",
  submittedAt: "2026-05-19T10:00:00.000Z",
  needsHumanReviewAt: null,
  legalAcceptance: null,
  recruiterOutcomeNote: null,
};

const atsApplicationBase: ATSCanonicalApplication = {
  id: "ats_application_1",
  companyId: "company_1",
  connectionId: "ats_conn_1",
  provider: "mock_ats",
  externalId: "ats_app_1",
  externalCandidateId: "ats_candidate_1",
  externalJobId: "job_1",
  externalStageId: "shared_screening",
  externalUrl: null,
  internalCandidateId: "candidate_1",
  internalApplicationId: "application_1",
  internalJobId: "job_1",
  candidateName: "Ana Martin",
  candidateEmail: "ana@example.com",
  candidatePhone: null,
  jobTitle: "Store Associate",
  stageName: "Screening",
  stageCategory: "screening",
  status: "active",
  externalUpdatedAt: "2026-05-19T10:00:00.000Z",
  lastSeenAt: "2026-05-19T10:00:00.000Z",
  rawSnapshot: {},
};

describe("ATS stage writebacks", () => {
  it("does not create stage move writebacks for externally archived ATS applications", () => {
    const connection: ATSConnection = {
      id: "ats_conn_1",
      companyId: "company_1",
      provider: "mock_ats",
      status: "active",
      displayName: "Mock ATS",
      authMode: "mock",
      secretRef: null,
      externalAccountId: "mock_account",
      lastSyncAt: null,
      lastError: null,
      createdAt: "2026-05-19T10:00:00.000Z",
      updatedAt: "2026-05-19T10:00:00.000Z",
      writebackPolicy: {
        reportMode: "candidate_note",
        moveToExternalStageId: null,
        requiresRecruiterReview: true,
        stageMoveMappings: {
          rejected: "shared_rejected",
        },
      },
    };

    const actions = buildATSStageMoveWritebacksForApplicationStageChange({
      application,
      previousStage: "shortlisted",
      nextStage: "rejected",
      atsConnections: [connection],
      atsApplications: [
        {
          ...atsApplicationBase,
          status: "archived_external",
        },
      ],
      existingActions: [],
      now: "2026-05-19T11:00:00.000Z",
    });

    expect(actions).toHaveLength(0);
  });

  it("uses job-scoped stage mappings without leaking the scope into provider writebacks", () => {
    const connection: ATSConnection = {
      id: "ats_conn_1",
      companyId: "company_1",
      provider: "mock_ats",
      status: "active",
      displayName: "Mock ATS",
      authMode: "mock",
      secretRef: null,
      externalAccountId: "mock_account",
      lastSyncAt: null,
      lastError: null,
      createdAt: "2026-05-19T10:00:00.000Z",
      updatedAt: "2026-05-19T10:00:00.000Z",
      writebackPolicy: {
        reportMode: "candidate_note",
        moveToExternalStageId: null,
        requiresRecruiterReview: true,
        stageMoveMappings: {
          rejected: stageMappingValueForExternalStage({
            externalJobId: "job_1",
            externalStageId: "shared_rejected",
          }),
        },
      },
    };

    const actions = buildATSStageMoveWritebacksForApplicationStageChange({
      application,
      previousStage: "shortlisted",
      nextStage: "rejected",
      atsConnections: [connection],
      atsApplications: [
        atsApplicationBase,
        {
          ...atsApplicationBase,
          id: "ats_application_2",
          externalId: "ats_app_2",
          externalJobId: "job_2",
        },
      ],
      existingActions: [],
      now: "2026-05-19T11:00:00.000Z",
    });

    expect(actions).toHaveLength(1);
    expect(actions[0]).toMatchObject({
      targetExternalApplicationId: "ats_app_1",
      targetExternalJobId: "job_1",
      targetExternalStageId: "shared_rejected",
    });
  });
});
