import { afterEach, describe, expect, it, vi } from "vitest";

import {
  buildZohoRecruitAuthorizationUrl,
  exchangeZohoRecruitAuthorizationCode,
} from "@/lib/ats-integrations/zoho/oauth";

describe("Zoho Recruit OAuth helpers", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("builds an offline authorization URL with the Recruit module scope", () => {
    const url = new URL(
      buildZohoRecruitAuthorizationUrl({
        accountsBaseUrl: "https://accounts.zoho.eu",
        clientId: "client_id",
        redirectUri: "https://nacar.test/oauth/zoho/callback",
        state: "demo-state",
      }),
    );

    expect(url.origin).toBe("https://accounts.zoho.eu");
    expect(url.pathname).toBe("/oauth/v2/auth");
    expect(url.searchParams.get("scope")).toBe("ZohoRecruit.modules.ALL");
    expect(url.searchParams.get("client_id")).toBe("client_id");
    expect(url.searchParams.get("response_type")).toBe("code");
    expect(url.searchParams.get("access_type")).toBe("offline");
    expect(url.searchParams.get("redirect_uri")).toBe(
      "https://nacar.test/oauth/zoho/callback",
    );
    expect(url.searchParams.get("state")).toBe("demo-state");
  });

  it("exchanges a Zoho authorization code for refresh-token credentials", async () => {
    const fetchMock = vi.fn(
      async () =>
        new Response(
          JSON.stringify({
            access_token: "access_token",
            refresh_token: "refresh_token",
            api_domain: "https://recruit.zoho.eu",
            token_type: "Bearer",
            expires_in: 3600,
          }),
          { status: 200 },
        ),
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await exchangeZohoRecruitAuthorizationCode({
      accountsBaseUrl: "https://accounts.zoho.eu",
      code: "grant_code",
      clientId: "client_id",
      clientSecret: "client_secret",
      redirectUri: "https://nacar.test/oauth/zoho/callback",
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "https://accounts.zoho.eu/oauth/v2/token?code=grant_code&client_id=client_id&client_secret=client_secret&redirect_uri=https%3A%2F%2Fnacar.test%2Foauth%2Fzoho%2Fcallback&grant_type=authorization_code",
      { method: "POST" },
    );
    expect(result).toEqual({
      accessToken: "access_token",
      refreshToken: "refresh_token",
      apiDomain: "https://recruit.zoho.eu",
      tokenType: "Bearer",
      expiresIn: 3600,
    });
  });

  it("redacts OAuth secrets from failed token exchange errors", async () => {
    const fetchMock = vi.fn(
      async () =>
        new Response(
          JSON.stringify({
            error: "invalid_client",
            client_secret: "client_secret",
            code: "grant_code",
          }),
          { status: 401 },
        ),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      exchangeZohoRecruitAuthorizationCode({
        accountsBaseUrl: "https://accounts.zoho.eu",
        code: "grant_code",
        clientId: "client_id",
        clientSecret: "client_secret",
        redirectUri: "https://nacar.test/oauth/zoho/callback",
      }),
    ).rejects.toThrow(
      'Zoho Recruit authorization code exchange failed with 401. {"error":"invalid_client","client_secret":"[redacted]","code":"[redacted]"}',
    );
  });
});
