import type {
  ATSWritebackAction,
  ATSWritebackResult,
} from "@/domain/ats-integrations/types";
import type {
  ATSAdapter,
  ATSProviderApplication,
} from "@/lib/ats-integrations/adapters/types";
import { createZohoRecruitClient } from "@/lib/ats-integrations/zoho/client";
import {
  mapZohoCandidateToProviderApplication,
  mapZohoCandidateToProviderCandidate,
  mapZohoJobOpeningToProviderJob,
  type ZohoRecord,
} from "@/lib/ats-integrations/zoho/mappers";

type ZohoListResponse = {
  data?: ZohoRecord[];
  info?: {
    page?: number;
    per_page?: number;
    more_records?: boolean;
  };
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

function zohoPageFromCursor(cursor: string | null) {
  const page = cursor ? Number.parseInt(cursor, 10) : 1;

  return Number.isFinite(page) && page > 0 ? page : 1;
}

function zohoListPath(input: {
  moduleApiName: string;
  page: number;
  perPage: number;
}) {
  const params = new URLSearchParams({
    per_page: String(input.perPage),
    page: String(input.page),
  });

  return `/recruit/v2/${input.moduleApiName}?${params.toString()}`;
}

function zohoAssociatedRecordsPath(input: {
  moduleApiName: string;
  recordId: string;
  page: number;
  perPage: number;
}) {
  const params = new URLSearchParams({
    per_page: String(input.perPage),
    page: String(input.page),
  });

  return `/recruit/v2/${input.moduleApiName}/${input.recordId}/associate?${params.toString()}`;
}

function nextZohoCursor(input: {
  currentPage: number;
  response: ZohoListResponse;
}) {
  if (!input.response.info?.more_records) {
    return null;
  }

  return String((input.response.info.page ?? input.currentPage) + 1);
}

function stageMovePayload(action: ATSWritebackAction) {
  return {
    ids: [action.targetExternalCandidateId],
    ...(action.targetExternalJobId
      ? { jobids: [action.targetExternalJobId] }
      : {}),
    Candidate_Status: action.targetExternalStageId,
    comments: "Updated by Breathe.",
  };
}

function flattenZohoDataEntries(value: unknown): ZohoRecord[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((item) => {
    if (Array.isArray(item)) {
      return flattenZohoDataEntries(item);
    }

    return item && typeof item === "object" ? [item as ZohoRecord] : [];
  });
}

function resultFromZohoWritebackResponse(
  response: Record<string, unknown>,
): ATSWritebackResult {
  const failedEntry = flattenZohoDataEntries(response.data).find((entry) => {
    const status = typeof entry.status === "string" ? entry.status : null;
    const code = typeof entry.code === "string" ? entry.code : null;

    return (
      status?.toLowerCase() === "error" ||
      (code !== null && code.toUpperCase() !== "SUCCESS")
    );
  });

  if (failedEntry) {
    const code =
      typeof failedEntry.code === "string" ? failedEntry.code : "ERROR";
    const message =
      typeof failedEntry.message === "string"
        ? failedEntry.message
        : "Provider returned an unsuccessful writeback result.";

    return {
      status: "terminal_error",
      providerStatusCode: 200,
      providerResponse: response,
      errorMessage: `Zoho Recruit writeback failed: ${code} - ${message}`,
    };
  }

  return {
    status: "succeeded",
    providerStatusCode: 200,
    providerResponse: response,
    errorMessage: null,
  };
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
    const page = zohoPageFromCursor(input.cursor);
    const response = await client.request<ZohoListResponse>(
      zohoListPath({
        moduleApiName: "Job_Openings",
        page,
        perPage: input.limit,
      }),
      { method: "GET" },
    );

    return {
      records: (response.data ?? []).map(mapZohoJobOpeningToProviderJob),
      nextCursor: nextZohoCursor({ currentPage: page, response }),
      hasMore: Boolean(response.info?.more_records),
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
    const page = zohoPageFromCursor(input.cursor);
    const jobsResponse = await client.request<ZohoListResponse>(
      zohoListPath({
        moduleApiName: "Job_Openings",
        page,
        perPage: input.limit,
      }),
      { method: "GET" },
    );
    const records: ATSProviderApplication[] = [];

    for (const job of jobsResponse.data ?? []) {
      const jobId = typeof job.id === "string" ? job.id : null;

      if (!jobId) {
        continue;
      }

      const jobTitle =
        (typeof job.Posting_Title === "string" && job.Posting_Title.trim()) ||
        (typeof job.Job_Opening_Name === "string" && job.Job_Opening_Name.trim()) ||
        "Unknown Zoho Job";
      let associatedPage = 1;
      let hasMoreAssociatedRecords = true;

      while (hasMoreAssociatedRecords) {
        const associatedResponse = await client.request<ZohoListResponse>(
          zohoAssociatedRecordsPath({
            moduleApiName: "Job_Openings",
            recordId: jobId,
            page: associatedPage,
            perPage: input.limit,
          }),
          { method: "GET" },
        );

        records.push(
          ...(associatedResponse.data ?? []).map((candidate) =>
            mapZohoCandidateToProviderApplication({
              candidate,
              fallbackJobId: jobId,
              fallbackJobTitle: jobTitle,
            }),
          ),
        );
        associatedPage += 1;
        hasMoreAssociatedRecords = Boolean(
          associatedResponse.info?.more_records,
        );
      }
    }

    return {
      records,
      nextCursor: nextZohoCursor({ currentPage: page, response: jobsResponse }),
      hasMore: Boolean(jobsResponse.info?.more_records),
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
            data: [stageMovePayload(action)],
          }),
        },
      );

      return resultFromZohoWritebackResponse(response);
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

      return resultFromZohoWritebackResponse(response);
    }

    return {
      status: "skipped",
      providerStatusCode: null,
      providerResponse: {},
      errorMessage: `Zoho Recruit adapter does not support ${action.actionType}.`,
    };
  },
};
