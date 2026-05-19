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
      apiBaseUrl: "https://recruit.zoho.eu",
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
});
