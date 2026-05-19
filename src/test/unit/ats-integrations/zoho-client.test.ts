import { afterEach, describe, expect, it, vi } from "vitest";

import { zohoRecruitAdapter } from "@/lib/ats-integrations/adapters/zoho-recruit";
import { createZohoRecruitClient } from "@/lib/ats-integrations/zoho/client";

const zohoConnection = {
  id: "ats_conn_zoho",
  companyId: "company_1",
  provider: "zoho_recruit" as const,
  status: "active" as const,
  displayName: "Zoho Recruit",
  authMode: "env_token" as const,
  secretRef: "env:ZOHO_RECRUIT_ACCESS_TOKEN",
  externalAccountId: "zoho_account",
  lastSyncAt: null,
  lastError: null,
  createdAt: "2026-05-19T10:00:00.000Z",
  updatedAt: "2026-05-19T10:00:00.000Z",
};

describe("Zoho Recruit client", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("only advertises writeback capabilities implemented by the Zoho adapter", () => {
    expect(zohoRecruitAdapter.capabilities).toMatchObject({
      supportsCandidateNotes: true,
      supportsStatusComments: true,
      supportsStageMove: true,
      supportsCustomFields: false,
    });
  });

  it("exposes every Zoho demo status used by default writeback mappings", async () => {
    const stages = await zohoRecruitAdapter.listStages({
      connection: zohoConnection,
      externalJobId: "58431000000012345",
    });

    expect(stages).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          externalId: "Breathe Screen",
          category: "screening",
        }),
        expect.objectContaining({
          externalId: "Interview Completed",
          category: "interview",
        }),
        expect.objectContaining({
          externalId: "Shortlisted",
          category: "evaluation",
        }),
        expect.objectContaining({
          externalId: "Hired",
          category: "hired",
        }),
        expect.objectContaining({
          externalId: "Rejected",
          category: "rejected",
        }),
      ]),
    );
  });

  it("refreshes an access token before calling Recruit when only refresh credentials are configured", async () => {
    const fetchMock = vi.fn(async (url: string | URL) => {
      const href = String(url);

      if (href.startsWith("https://accounts.zoho.eu/oauth/v2/token")) {
        return new Response(
          JSON.stringify({
            access_token: "fresh_access_token",
            api_domain: "https://recruit.zoho.eu",
            expires_in: 3600,
            token_type: "Bearer",
          }),
          { status: 200 },
        );
      }

      return new Response(JSON.stringify({ data: [] }), { status: 200 });
    });
    vi.stubGlobal("fetch", fetchMock);

    const client = createZohoRecruitClient(zohoConnection, {
      accessToken: null,
      refreshToken: "refresh_token",
      clientId: "client_id",
      clientSecret: "client_secret",
      accountsBaseUrl: "https://accounts.zoho.eu",
      apiBaseUrl: "https://recruit.zoho.com",
    });

    await client.request("/recruit/v2/Job_Openings?per_page=1", {
      method: "GET",
    });

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      "https://accounts.zoho.eu/oauth/v2/token?refresh_token=refresh_token&client_id=client_id&client_secret=client_secret&grant_type=refresh_token",
      expect.objectContaining({ method: "POST" }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "https://recruit.zoho.eu/recruit/v2/Job_Openings?per_page=1",
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Zoho-oauthtoken fresh_access_token",
        }),
      }),
    );
  });

  it("refreshes and retries once when a configured access token has expired", async () => {
    const fetchMock = vi.fn(async (url: string | URL, init?: RequestInit) => {
      const href = String(url);

      if (href === "https://recruit.zoho.com/recruit/v2/Job_Openings?per_page=1") {
        const authorization = String(
          (init?.headers as Record<string, string> | undefined)
            ?.Authorization ?? "",
        );

        if (authorization === "Zoho-oauthtoken stale_access_token") {
          return new Response(
            JSON.stringify({
              code: "INVALID_TOKEN",
              message: "invalid oauth token",
            }),
            { status: 401 },
          );
        }

        return new Response(JSON.stringify({ data: [] }), { status: 200 });
      }

      if (href.startsWith("https://accounts.zoho.eu/oauth/v2/token")) {
        return new Response(
          JSON.stringify({
            access_token: "fresh_access_token",
            api_domain: "https://recruit.zoho.com",
            expires_in: 3600,
            token_type: "Bearer",
          }),
          { status: 200 },
        );
      }

      return new Response(JSON.stringify({ data: [] }), { status: 200 });
    });
    vi.stubGlobal("fetch", fetchMock);

    const client = createZohoRecruitClient(zohoConnection, {
      accessToken: "stale_access_token",
      refreshToken: "refresh_token",
      clientId: "client_id",
      clientSecret: "client_secret",
      accountsBaseUrl: "https://accounts.zoho.eu",
      apiBaseUrl: "https://recruit.zoho.com",
    });

    await expect(
      client.request("/recruit/v2/Job_Openings?per_page=1", {
        method: "GET",
      }),
    ).resolves.toEqual({ data: [] });

    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      "https://recruit.zoho.com/recruit/v2/Job_Openings?per_page=1",
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Zoho-oauthtoken stale_access_token",
        }),
      }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "https://accounts.zoho.eu/oauth/v2/token?refresh_token=refresh_token&client_id=client_id&client_secret=client_secret&grant_type=refresh_token",
      expect.objectContaining({ method: "POST" }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      3,
      "https://recruit.zoho.com/recruit/v2/Job_Openings?per_page=1",
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Zoho-oauthtoken fresh_access_token",
        }),
      }),
    );
  });

  it("creates candidate notes through the Zoho Notes module with the related candidate id", async () => {
    vi.stubEnv("ZOHO_RECRUIT_ACCESS_TOKEN", "access_token");
    const fetchMock = vi.fn(
      async () =>
        new Response(JSON.stringify({ data: [{ status: "success" }] }), {
          status: 200,
        }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await zohoRecruitAdapter.writeback({
      connection: zohoConnection,
      action: {
        id: "ats_writeback_1",
        companyId: "company_1",
        connectionId: "ats_conn_zoho",
        provider: "zoho_recruit",
        actionType: "candidate_note",
        targetExternalCandidateId: "58431000000054321",
        targetExternalApplicationId: "58431000000054321",
        targetExternalJobId: "58431000000012345",
        targetExternalStageId: null,
        sourceObjectType: "evaluation",
        sourceObjectId: "eval_1",
        status: "queued",
        idempotencyKey: "key",
        payload: { body: "Breathe interview summary" },
        createdAt: "2026-05-19T12:00:00.000Z",
        updatedAt: "2026-05-19T12:00:00.000Z",
      },
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "https://recruit.zoho.com/recruit/v2/Notes",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          data: [
            {
              Note_Title: "Breathe interview report",
              Note_Content: "Breathe interview summary",
              Parent_Id: "58431000000054321",
              se_module: "Candidates",
            },
          ],
        }),
      }),
    );
  });

  it("moves Zoho candidate status for the associated job opening when available", async () => {
    vi.stubEnv("ZOHO_RECRUIT_ACCESS_TOKEN", "access_token");
    const fetchMock = vi.fn(
      async () =>
        new Response(JSON.stringify({ data: [[{ status: "success" }]] }), {
          status: 200,
        }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await zohoRecruitAdapter.writeback({
      connection: zohoConnection,
      action: {
        id: "ats_writeback_stage_1",
        companyId: "company_1",
        connectionId: "ats_conn_zoho",
        provider: "zoho_recruit",
        actionType: "application_stage_move",
        targetExternalCandidateId: "58431000000054321",
        targetExternalApplicationId: "58431000000054321:58431000000012345",
        targetExternalJobId: "58431000000012345",
        targetExternalStageId: "Interview Completed",
        sourceObjectType: "evaluation",
        sourceObjectId: "eval_1",
        status: "queued",
        idempotencyKey: "key",
        payload: { body: "Breathe interview summary" },
        createdAt: "2026-05-19T12:00:00.000Z",
        updatedAt: "2026-05-19T12:00:00.000Z",
      },
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "https://recruit.zoho.com/recruit/v2/Candidates/status",
      expect.objectContaining({
        method: "PUT",
        body: JSON.stringify({
          data: [
            {
              ids: ["58431000000054321"],
              jobids: ["58431000000012345"],
              Candidate_Status: "Interview Completed",
              comments: "Breathe interview summary",
            },
          ],
        }),
      }),
    );
  });

  it("marks Zoho writebacks as terminal errors when the provider response contains record errors", async () => {
    vi.stubEnv("ZOHO_RECRUIT_ACCESS_TOKEN", "access_token");
    const fetchMock = vi.fn(
      async () =>
        new Response(
          JSON.stringify({
            data: [
              {
                status: "error",
                code: "INVALID_DATA",
                message: "the related id given seems to be invalid",
              },
            ],
          }),
          { status: 200 },
        ),
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await zohoRecruitAdapter.writeback({
      connection: zohoConnection,
      action: {
        id: "ats_writeback_error_1",
        companyId: "company_1",
        connectionId: "ats_conn_zoho",
        provider: "zoho_recruit",
        actionType: "candidate_note",
        targetExternalCandidateId: "missing_candidate",
        targetExternalApplicationId: "missing_candidate",
        targetExternalJobId: null,
        targetExternalStageId: null,
        sourceObjectType: "evaluation",
        sourceObjectId: "eval_1",
        status: "queued",
        idempotencyKey: "key",
        payload: { body: "Breathe interview summary" },
        createdAt: "2026-05-19T12:00:00.000Z",
        updatedAt: "2026-05-19T12:00:00.000Z",
      },
    });

    expect(result).toMatchObject({
      status: "terminal_error",
      providerStatusCode: 200,
      errorMessage:
        "Zoho Recruit writeback failed: INVALID_DATA - the related id given seems to be invalid",
    });
  });

  it("skips Zoho note writebacks when the Notes module is blocked by permissions", async () => {
    vi.stubEnv("ZOHO_RECRUIT_ACCESS_TOKEN", "access_token");
    const fetchMock = vi.fn(
      async () =>
        new Response(
          JSON.stringify({
            data: [
              {
                status: "error",
                code: "NO_PERMISSION",
                message:
                  "permission denied to add records in the Notes module",
              },
            ],
          }),
          { status: 200 },
        ),
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await zohoRecruitAdapter.writeback({
      connection: zohoConnection,
      action: {
        id: "ats_writeback_note_permission",
        companyId: "company_1",
        connectionId: "ats_conn_zoho",
        provider: "zoho_recruit",
        actionType: "candidate_note",
        targetExternalCandidateId: "58431000000054321",
        targetExternalApplicationId: "58431000000054321",
        targetExternalJobId: null,
        targetExternalStageId: null,
        sourceObjectType: "evaluation",
        sourceObjectId: "eval_1",
        status: "queued",
        idempotencyKey: "note_permission",
        payload: { body: "Breathe interview summary" },
        createdAt: "2026-05-19T12:00:00.000Z",
        updatedAt: "2026-05-19T12:00:00.000Z",
      },
    });

    expect(result).toMatchObject({
      status: "skipped",
      providerStatusCode: 200,
      errorMessage:
        "Zoho Recruit note writeback skipped because the Notes module is not available for this account.",
    });
  });

  it("marks Zoho writebacks as retryable when the provider returns no result entries", async () => {
    vi.stubEnv("ZOHO_RECRUIT_ACCESS_TOKEN", "access_token");
    const fetchMock = vi.fn(
      async () => new Response(JSON.stringify({ data: [] }), { status: 200 }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await zohoRecruitAdapter.writeback({
      connection: zohoConnection,
      action: {
        id: "ats_writeback_empty_result",
        companyId: "company_1",
        connectionId: "ats_conn_zoho",
        provider: "zoho_recruit",
        actionType: "candidate_note",
        targetExternalCandidateId: "58431000000054321",
        targetExternalApplicationId: "58431000000054321",
        targetExternalJobId: null,
        targetExternalStageId: null,
        sourceObjectType: "evaluation",
        sourceObjectId: "eval_1",
        status: "queued",
        idempotencyKey: "empty_result",
        payload: { body: "Breathe interview summary" },
        createdAt: "2026-05-19T12:00:00.000Z",
        updatedAt: "2026-05-19T12:00:00.000Z",
      },
    });

    expect(result).toMatchObject({
      status: "retryable_error",
      providerStatusCode: 200,
      errorMessage: "Zoho Recruit writeback returned no result entries.",
    });
  });

  it("returns terminal errors without calling Zoho when writeback targets are missing", async () => {
    vi.stubEnv("ZOHO_RECRUIT_ACCESS_TOKEN", "access_token");
    const fetchMock = vi.fn(
      async () => new Response(JSON.stringify({ data: [] }), { status: 200 }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const noteResult = await zohoRecruitAdapter.writeback({
      connection: zohoConnection,
      action: {
        id: "ats_writeback_missing_note_target",
        companyId: "company_1",
        connectionId: "ats_conn_zoho",
        provider: "zoho_recruit",
        actionType: "candidate_note",
        targetExternalCandidateId: null,
        targetExternalApplicationId: null,
        targetExternalJobId: null,
        targetExternalStageId: null,
        sourceObjectType: "evaluation",
        sourceObjectId: "eval_1",
        status: "queued",
        idempotencyKey: "missing_note_target",
        payload: { body: "Breathe interview summary" },
        createdAt: "2026-05-19T12:00:00.000Z",
        updatedAt: "2026-05-19T12:00:00.000Z",
      },
    });
    const stageResult = await zohoRecruitAdapter.writeback({
      connection: zohoConnection,
      action: {
        id: "ats_writeback_missing_stage_target",
        companyId: "company_1",
        connectionId: "ats_conn_zoho",
        provider: "zoho_recruit",
        actionType: "application_stage_move",
        targetExternalCandidateId: "58431000000054321",
        targetExternalApplicationId: "58431000000054321",
        targetExternalJobId: null,
        targetExternalStageId: null,
        sourceObjectType: "evaluation",
        sourceObjectId: "eval_1",
        status: "queued",
        idempotencyKey: "missing_stage_target",
        payload: { summary: "Great: 86" },
        createdAt: "2026-05-19T12:00:00.000Z",
        updatedAt: "2026-05-19T12:00:00.000Z",
      },
    });

    expect(noteResult).toMatchObject({
      status: "terminal_error",
      errorMessage:
        "Zoho Recruit writeback requires targetExternalCandidateId.",
    });
    expect(stageResult).toMatchObject({
      status: "terminal_error",
      errorMessage: "Zoho Recruit stage move requires targetExternalStageId.",
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("maps adapter cursors to Zoho list record pages", async () => {
    vi.stubEnv("ZOHO_RECRUIT_ACCESS_TOKEN", "access_token");
    const fetchMock = vi.fn(async (url: string | URL) => {
      const parsedUrl = new URL(String(url));

      if (parsedUrl.pathname === "/recruit/v2/Job_Openings") {
        return new Response(
          JSON.stringify({
            data: [
              {
                id: "58431000000012345",
                Posting_Title: "Store Associate",
                Job_Opening_Status: "In-progress",
                Modified_Time: "2026-05-19T10:00:00+02:00",
              },
            ],
            info: {
              page: 2,
              per_page: 100,
              more_records: true,
            },
          }),
          { status: 200 },
        );
      }

      return new Response(
        JSON.stringify({
          data: [],
          info: {
            page: 3,
            per_page: 50,
            more_records: false,
          },
        }),
        { status: 200 },
      );
    });
    vi.stubGlobal("fetch", fetchMock);

    const jobsPage = await zohoRecruitAdapter.listJobs({
      connection: zohoConnection,
      cursor: "2",
      limit: 100,
    });
    const applicationsPage = await zohoRecruitAdapter.listApplications({
      connection: zohoConnection,
      cursor: "3",
      limit: 50,
    });

    const jobUrl = new URL(String(fetchMock.mock.calls[0][0]));
    const applicationsUrl = new URL(String(fetchMock.mock.calls[1][0]));
    expect(jobUrl.searchParams.get("page")).toBe("2");
    expect(jobUrl.searchParams.get("per_page")).toBe("100");
    expect(applicationsUrl.searchParams.get("page")).toBe("3");
    expect(applicationsUrl.searchParams.get("per_page")).toBe("50");
    expect(jobsPage).toMatchObject({
      nextCursor: "3",
      hasMore: true,
    });
    expect(applicationsPage).toMatchObject({
      nextCursor: "3",
      hasMore: true,
    });
  });

  it("lists applications from candidates associated to Zoho job openings", async () => {
    vi.stubEnv("ZOHO_RECRUIT_ACCESS_TOKEN", "access_token");
    const fetchMock = vi.fn(async (url: string | URL) => {
      const href = String(url);

      if (
        href.includes("/recruit/v2/Job_Openings/58431000000012345/associate")
      ) {
        return new Response(
          JSON.stringify({
            data: [
              {
                id: "58431000000054321",
                Full_Name: "Ana Martin",
                Email: "ana@example.com",
                Mobile: "+34600000000",
                Candidate_Status: "Breathe Screen",
                Modified_Time: "2026-05-19T10:05:00+02:00",
              },
            ],
            info: {
              page: 1,
              per_page: 25,
              more_records: false,
            },
          }),
          { status: 200 },
        );
      }

      return new Response(
        JSON.stringify({
          data: [
            {
              id: "58431000000012345",
              Posting_Title: "Store Associate",
              Job_Opening_Status: "In-progress",
              Modified_Time: "2026-05-19T10:00:00+02:00",
            },
          ],
          info: {
            page: 1,
            per_page: 25,
            more_records: false,
          },
        }),
        { status: 200 },
      );
    });
    vi.stubGlobal("fetch", fetchMock);

    const applicationsPage = await zohoRecruitAdapter.listApplications({
      connection: zohoConnection,
      cursor: null,
      limit: 25,
    });

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      "https://recruit.zoho.com/recruit/v2/Job_Openings?per_page=25&page=1",
      expect.any(Object),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "https://recruit.zoho.com/recruit/v2/Job_Openings/58431000000012345/associate?per_page=25&page=1",
      expect.any(Object),
    );
    expect(applicationsPage.records).toEqual([
      expect.objectContaining({
        externalId: "58431000000054321:58431000000012345",
        externalCandidateId: "58431000000054321",
        externalJobId: "58431000000012345",
        jobTitle: "Store Associate",
        externalStageId: "Breathe Screen",
        stageCategory: "screening",
      }),
    ]);
    expect(applicationsPage).toMatchObject({
      nextCursor: null,
      hasMore: false,
    });
  });

  it("paginates associated candidates for each Zoho job opening", async () => {
    vi.stubEnv("ZOHO_RECRUIT_ACCESS_TOKEN", "access_token");
    const fetchMock = vi.fn(async (url: string | URL) => {
      const parsedUrl = new URL(String(url));
      const href = parsedUrl.href;
      const page = parsedUrl.searchParams.get("page");

      if (
        href.includes("/recruit/v2/Job_Openings/58431000000012345/associate") &&
        page === "1"
      ) {
        return new Response(
          JSON.stringify({
            data: [
              {
                id: "58431000000054321",
                Full_Name: "Ana Martin",
                Candidate_Status: "Breathe Screen",
              },
            ],
            info: {
              page: 1,
              per_page: 1,
              more_records: true,
            },
          }),
          { status: 200 },
        );
      }

      if (
        href.includes("/recruit/v2/Job_Openings/58431000000012345/associate") &&
        page === "2"
      ) {
        return new Response(
          JSON.stringify({
            data: [
              {
                id: "58431000000067890",
                Full_Name: "Marta Ruiz",
                Candidate_Status: "Interview Completed",
              },
            ],
            info: {
              page: 2,
              per_page: 1,
              more_records: false,
            },
          }),
          { status: 200 },
        );
      }

      return new Response(
        JSON.stringify({
          data: [
            {
              id: "58431000000012345",
              Posting_Title: "Store Associate",
              Job_Opening_Status: "In-progress",
            },
          ],
          info: {
            page: 1,
            per_page: 1,
            more_records: false,
          },
        }),
        { status: 200 },
      );
    });
    vi.stubGlobal("fetch", fetchMock);

    const applicationsPage = await zohoRecruitAdapter.listApplications({
      connection: zohoConnection,
      cursor: null,
      limit: 1,
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "https://recruit.zoho.com/recruit/v2/Job_Openings/58431000000012345/associate?per_page=1&page=2",
      expect.any(Object),
    );
    expect(applicationsPage.records.map((record) => record.externalId)).toEqual(
      [
        "58431000000054321:58431000000012345",
        "58431000000067890:58431000000012345",
      ],
    );
  });

  it("skips malformed associated Zoho candidate records without failing the page", async () => {
    vi.stubEnv("ZOHO_RECRUIT_ACCESS_TOKEN", "access_token");
    const fetchMock = vi.fn(async (url: string | URL) => {
      const href = String(url);

      if (
        href.includes("/recruit/v2/Job_Openings/58431000000012345/associate")
      ) {
        return new Response(
          JSON.stringify({
            data: [
              {
                Full_Name: "Candidate Without Id",
                Candidate_Status: "Breathe Screen",
              },
              {
                id: "58431000000054321",
                Full_Name: "Ana Martin",
                Candidate_Status: "Breathe Screen",
              },
            ],
            info: {
              page: 1,
              per_page: 25,
              more_records: false,
            },
          }),
          { status: 200 },
        );
      }

      return new Response(
        JSON.stringify({
          data: [
            {
              id: "58431000000012345",
              Posting_Title: "Store Associate",
              Job_Opening_Status: "In-progress",
            },
          ],
          info: {
            page: 1,
            per_page: 25,
            more_records: false,
          },
        }),
        { status: 200 },
      );
    });
    vi.stubGlobal("fetch", fetchMock);

    const applicationsPage = await zohoRecruitAdapter.listApplications({
      connection: zohoConnection,
      cursor: null,
      limit: 25,
    });

    expect(applicationsPage.records).toHaveLength(1);
    expect(applicationsPage.records[0]).toMatchObject({
      externalId: "58431000000054321:58431000000012345",
      candidateName: "Ana Martin",
    });
  });
});
