import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockRequireAuthenticatedApiRequest = vi.fn();
const mockRecruiterCanManageTeams = vi.fn();
const mockExchangeZohoRecruitAuthorizationCode = vi.fn();

vi.mock("@/lib/auth/server", () => ({
  requireAuthenticatedApiRequest: () => mockRequireAuthenticatedApiRequest(),
}));

vi.mock("@/lib/team-access", () => ({
  recruiterCanManageTeams: (...args: unknown[]) =>
    mockRecruiterCanManageTeams(...args),
}));

vi.mock("@/lib/ats-integrations/zoho/oauth", () => ({
  exchangeZohoRecruitAuthorizationCode: (...args: unknown[]) =>
    mockExchangeZohoRecruitAuthorizationCode(...args),
}));

const recruiterFixture = {
  company: {
    id: "company_1",
  },
  user: {
    id: "user_1",
  },
};

describe("Zoho OAuth callback route", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("ZOHO_RECRUIT_CLIENT_ID", "client_id");
    vi.stubEnv("ZOHO_RECRUIT_CLIENT_SECRET", "client_secret");
    vi.stubEnv(
      "ZOHO_RECRUIT_REDIRECT_URI",
      "http://localhost:3000/api/ats/zoho/oauth/callback",
    );
    vi.stubEnv("ZOHO_RECRUIT_ACCOUNTS_BASE_URL", "https://accounts.zoho.eu");
    vi.stubEnv("ZOHO_RECRUIT_API_BASE_URL", "https://recruit.zoho.eu");
    mockRequireAuthenticatedApiRequest.mockResolvedValue(recruiterFixture);
    mockRecruiterCanManageTeams.mockReturnValue(true);
    mockExchangeZohoRecruitAuthorizationCode.mockResolvedValue({
      accessToken: "access_token",
      refreshToken: "refresh_token",
      apiDomain: "https://recruit.zoho.eu",
      tokenType: "Bearer",
      expiresIn: 3600,
    });
  });

  it("exchanges the Zoho authorization code and renders env values for admins", async () => {
    const { GET } = await import("@/app/api/ats/zoho/oauth/callback/route");

    const response = await GET(
      new Request(
        "http://localhost:3000/api/ats/zoho/oauth/callback?code=grant_code",
      ),
    );
    const html = await response.text();

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/html");
    expect(mockExchangeZohoRecruitAuthorizationCode).toHaveBeenCalledWith({
      accountsBaseUrl: "https://accounts.zoho.eu",
      code: "grant_code",
      clientId: "client_id",
      clientSecret: "client_secret",
      redirectUri: "http://localhost:3000/api/ats/zoho/oauth/callback",
    });
    expect(html).toContain("ZOHO_RECRUIT_REFRESH_TOKEN=refresh_token");
    expect(html).toContain("ZOHO_RECRUIT_API_BASE_URL=https://recruit.zoho.eu");
    expect(html).toContain(
      "ZOHO_RECRUIT_ACCOUNTS_BASE_URL=https://accounts.zoho.eu",
    );
    expect(html).not.toContain("client_secret");
    expect(html).not.toContain("access_token");
  });

  it("rejects callback requests from non-admin recruiters", async () => {
    mockRecruiterCanManageTeams.mockReturnValue(false);
    const { GET } = await import("@/app/api/ats/zoho/oauth/callback/route");

    const response = await GET(
      new Request(
        "http://localhost:3000/api/ats/zoho/oauth/callback?code=grant_code",
      ),
    );

    expect(response.status).toBe(403);
    expect(mockExchangeZohoRecruitAuthorizationCode).not.toHaveBeenCalled();
  });

  it("returns a setup error when OAuth env is incomplete", async () => {
    vi.stubEnv("ZOHO_RECRUIT_CLIENT_SECRET", "");
    const { GET } = await import("@/app/api/ats/zoho/oauth/callback/route");

    const response = await GET(
      new Request(
        "http://localhost:3000/api/ats/zoho/oauth/callback?code=grant_code",
      ),
    );
    const html = await response.text();

    expect(response.status).toBe(503);
    expect(html).toContain("Zoho OAuth setup is incomplete");
    expect(mockExchangeZohoRecruitAuthorizationCode).not.toHaveBeenCalled();
  });
});
