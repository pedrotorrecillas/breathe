import type { ATSWritebackAction } from "@/domain/ats-integrations/types";
import type { ATSAdapter } from "@/lib/ats-integrations/adapters/types";
import { createZohoRecruitClient } from "@/lib/ats-integrations/zoho/client";
import {
  mapZohoCandidateToProviderApplication,
  mapZohoCandidateToProviderCandidate,
  mapZohoJobOpeningToProviderJob,
  type ZohoRecord,
} from "@/lib/ats-integrations/zoho/mappers";

type ZohoListResponse = {
  data?: ZohoRecord[];
};

function bodyFromWriteback(action: ATSWritebackAction) {
  const body = action.payload.body;
  const summary = action.payload.summary;

  if (typeof body === "string") {
    return body;
  }

  if (typeof summary === "string") {
    return summary;
  }

  return JSON.stringify(action.payload);
}

export const zohoRecruitAdapter: ATSAdapter = {
  provider: "zoho_recruit",
  capabilities: {
    supportsWebhooks: false,
    supportsPolling: true,
    supportsCandidateNotes: true,
    supportsReportLinks: false,
    supportsStageMove: true,
    supportsCustomFields: true,
    supportsAttachments: false,
  },
  async validateConnection(input) {
    const client = createZohoRecruitClient(input.connection);
    const response = await client.request<ZohoListResponse>(
      "/recruit/v2/Job_Openings?per_page=1",
      { method: "GET" },
    );

    return {
      ok: Array.isArray(response.data),
      externalAccountId: input.connection.externalAccountId ?? "zoho_recruit",
      message: "Zoho Recruit connection is available.",
    };
  },
  async listJobs(input) {
    const client = createZohoRecruitClient(input.connection);
    const response = await client.request<ZohoListResponse>(
      `/recruit/v2/Job_Openings?per_page=${input.limit}`,
      { method: "GET" },
    );

    return {
      records: (response.data ?? []).map(mapZohoJobOpeningToProviderJob),
      nextCursor: null,
      hasMore: false,
    };
  },
  async listStages() {
    return [
      "New",
      "Breathe Screen",
      "Interview Completed",
      "Shortlisted",
      "Rejected",
    ].map((status, index) => ({
      externalId: status,
      externalJobId: null,
      name: status,
      category:
        status === "Breathe Screen"
          ? "screening"
          : status === "Interview Completed"
            ? "interview"
            : status === "Shortlisted"
              ? "evaluation"
              : status === "Rejected"
                ? "rejected"
                : "new",
      position: index,
      raw: { providerStatus: status },
    }));
  },
  async listApplications(input) {
    const client = createZohoRecruitClient(input.connection);
    const response = await client.request<ZohoListResponse>(
      `/recruit/v2/Candidates?per_page=${input.limit}`,
      { method: "GET" },
    );

    return {
      records: (response.data ?? []).map((candidate) =>
        mapZohoCandidateToProviderApplication({
          candidate,
          fallbackJobId: "zoho_job_unknown",
          fallbackJobTitle: "Unknown Zoho Job",
        }),
      ),
      nextCursor: null,
      hasMore: false,
    };
  },
  async getCandidate(input) {
    const client = createZohoRecruitClient(input.connection);
    const response = await client.request<ZohoListResponse>(
      `/recruit/v2/Candidates/${input.externalCandidateId}`,
      { method: "GET" },
    );
    const record = response.data?.[0] ?? null;

    return record ? mapZohoCandidateToProviderCandidate(record) : null;
  },
  async writeback(input) {
    const client = createZohoRecruitClient(input.connection);
    const action = input.action;

    if (action.actionType === "application_stage_move") {
      const response = await client.request<Record<string, unknown>>(
        "/recruit/v2/Candidates/status",
        {
          method: "PUT",
          body: JSON.stringify({
            data: [
              {
                ids: [action.targetExternalCandidateId],
                Candidate_Status: action.targetExternalStageId,
                comments: "Updated by Breathe.",
              },
            ],
          }),
        },
      );

      return {
        status: "succeeded",
        providerStatusCode: 200,
        providerResponse: response,
        errorMessage: null,
      };
    }

    if (
      action.actionType === "candidate_note" ||
      action.actionType === "status_comment"
    ) {
      const response = await client.request<Record<string, unknown>>(
        "/recruit/v2/Notes",
        {
          method: "POST",
          body: JSON.stringify({
            data: [
              {
                Note_Title: "Breathe interview report",
                Note_Content: bodyFromWriteback(action),
                Parent_Id: action.targetExternalCandidateId,
                se_module: "Candidates",
              },
            ],
          }),
        },
      );

      return {
        status: "succeeded",
        providerStatusCode: 200,
        providerResponse: response,
        errorMessage: null,
      };
    }

    return {
      status: "skipped",
      providerStatusCode: null,
      providerResponse: {},
      errorMessage: `Zoho Recruit adapter does not support ${action.actionType}.`,
    };
  },
};
