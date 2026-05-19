import type { ATSWritebackAction } from "@/domain/ats-integrations/types";
import type {
  ATSAdapter,
  ATSProviderApplication,
  ATSProviderCandidate,
  ATSProviderJob,
  ATSProviderStage,
  ATSSyncPage,
} from "@/lib/ats-integrations/adapters/types";

const mockUpdatedAt = "2026-05-19T10:00:00.000Z";

const mockJobs: ATSProviderJob[] = [
  {
    externalId: "mock_job_store_associate",
    externalUrl: "https://mock-ats.test/jobs/store-associate",
    title: "Store Associate",
    status: "active",
    externalUpdatedAt: mockUpdatedAt,
    raw: {
      providerRecordId: "mock_job_store_associate",
      department: "Retail",
    },
  },
];

const mockStages: ATSProviderStage[] = [
  {
    externalId: "mock_stage_new",
    externalJobId: "mock_job_store_associate",
    name: "New",
    category: "new",
    position: 0,
    raw: { providerRecordId: "mock_stage_new" },
  },
  {
    externalId: "mock_stage_breathe_screen",
    externalJobId: "mock_job_store_associate",
    name: "Breathe Screen",
    category: "screening",
    position: 1,
    raw: { providerRecordId: "mock_stage_breathe_screen" },
  },
  {
    externalId: "mock_stage_interview_completed",
    externalJobId: "mock_job_store_associate",
    name: "Interview Completed",
    category: "interview",
    position: 2,
    raw: { providerRecordId: "mock_stage_interview_completed" },
  },
  {
    externalId: "mock_stage_shortlisted",
    externalJobId: "mock_job_store_associate",
    name: "Shortlisted",
    category: "evaluation",
    position: 3,
    raw: { providerRecordId: "mock_stage_shortlisted" },
  },
  {
    externalId: "mock_stage_rejected",
    externalJobId: "mock_job_store_associate",
    name: "Rejected",
    category: "rejected",
    position: 4,
    raw: { providerRecordId: "mock_stage_rejected" },
  },
];

const mockCandidates: ATSProviderCandidate[] = [
  {
    externalId: "mock_candidate_ana",
    externalUrl: "https://mock-ats.test/candidates/ana",
    fullName: "Ana Martin",
    email: "ana@example.com",
    phone: "+34600000000",
    status: "active",
    externalUpdatedAt: mockUpdatedAt,
    raw: {
      providerRecordId: "mock_candidate_ana",
      source: "mock",
    },
  },
];

const mockApplications: ATSProviderApplication[] = [
  {
    externalId: "mock_app_ana_store_associate",
    externalCandidateId: "mock_candidate_ana",
    externalJobId: "mock_job_store_associate",
    externalStageId: "mock_stage_breathe_screen",
    externalUrl:
      "https://mock-ats.test/candidates/ana/applications/store-associate",
    candidateName: "Ana Martin",
    candidateEmail: "ana@example.com",
    candidatePhone: "+34600000000",
    jobTitle: "Store Associate",
    stageName: "Breathe Screen",
    stageCategory: "screening",
    status: "active",
    externalUpdatedAt: mockUpdatedAt,
    raw: {
      providerRecordId: "mock_app_ana_store_associate",
      providerCandidateId: "mock_candidate_ana",
      providerJobId: "mock_job_store_associate",
      providerStageId: "mock_stage_breathe_screen",
    },
  },
];

function page<TRecord>(records: TRecord[]): ATSSyncPage<TRecord> {
  return {
    records,
    nextCursor: null,
    hasMore: false,
  };
}

function mockWritebackResponse(input: {
  action: ATSWritebackAction;
  externalAccountId: string | null;
}) {
  return {
    externalAccountId: input.externalAccountId,
    actionType: input.action.actionType,
    targetExternalCandidateId: input.action.targetExternalCandidateId,
    targetExternalApplicationId: input.action.targetExternalApplicationId,
    acceptedAt: input.action.updatedAt,
  };
}

export const mockATSAdapter: ATSAdapter = {
  provider: "mock_ats",
  capabilities: {
    supportsWebhooks: true,
    supportsPolling: true,
    supportsCandidateNotes: true,
    supportsReportLinks: true,
    supportsStageMove: true,
    supportsCustomFields: true,
    supportsAttachments: false,
  },
  async validateConnection(input) {
    return {
      ok: true,
      externalAccountId: input.connection.externalAccountId ?? "mock_account",
      message: "Mock ATS connection is available.",
    };
  },
  async listJobs() {
    return page(mockJobs);
  },
  async listStages(input) {
    return mockStages.filter(
      (stage) => stage.externalJobId === input.externalJobId,
    );
  },
  async listApplications() {
    return page(mockApplications);
  },
  async getCandidate(input) {
    return (
      mockCandidates.find(
        (candidate) => candidate.externalId === input.externalCandidateId,
      ) ?? null
    );
  },
  async writeback(input) {
    return {
      status: "succeeded",
      providerStatusCode: 200,
      providerResponse: mockWritebackResponse({
        action: input.action,
        externalAccountId: input.connection.externalAccountId,
      }),
      errorMessage: null,
    };
  },
};
