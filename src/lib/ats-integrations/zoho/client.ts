import type { ATSConnection } from "@/domain/ats-integrations/types";
import {
  recruitApiBaseUrlForAccountsBaseUrl,
  resolveZohoRecruitApiBaseUrl,
} from "@/lib/ats-integrations/zoho/urls";

export type ZohoRecruitConfig = {
  accessToken: string | null;
  refreshToken: string | null;
  clientId: string | null;
  clientSecret: string | null;
  accountsBaseUrl: string;
  apiBaseUrl: string;
};

export type ZohoRecruitClient = {
  request<TResponse>(path: string, init?: RequestInit): Promise<TResponse>;
};

type ZohoRefreshTokenResponse = {
  access_token?: string;
  expires_in?: number;
  api_domain?: string;
  token_type?: string;
};

export function getZohoRecruitConfigFromEnv(): ZohoRecruitConfig {
  const accountsBaseUrl =
    process.env.ZOHO_RECRUIT_ACCOUNTS_BASE_URL?.trim() ||
    "https://accounts.zoho.com";

  return {
    accessToken: process.env.ZOHO_RECRUIT_ACCESS_TOKEN?.trim() || null,
    refreshToken: process.env.ZOHO_RECRUIT_REFRESH_TOKEN?.trim() || null,
    clientId: process.env.ZOHO_RECRUIT_CLIENT_ID?.trim() || null,
    clientSecret: process.env.ZOHO_RECRUIT_CLIENT_SECRET?.trim() || null,
    accountsBaseUrl,
    apiBaseUrl:
      process.env.ZOHO_RECRUIT_API_BASE_URL?.trim() ||
      recruitApiBaseUrlForAccountsBaseUrl(accountsBaseUrl),
  };
}

function joinUrl(baseUrl: string, path: string) {
  return `${baseUrl.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`;
}

function sanitizedBody(value: string) {
  return value.replace(
    /Zoho-oauthtoken\s+[A-Za-z0-9._-]+/g,
    "Zoho-oauthtoken [redacted]",
  );
}

async function refreshZohoRecruitAccessToken(config: ZohoRecruitConfig) {
  if (!config.refreshToken || !config.clientId || !config.clientSecret) {
    throw new Error(
      "ZOHO_RECRUIT_ACCESS_TOKEN is required unless refresh token, client ID, and client secret are configured.",
    );
  }

  const params = new URLSearchParams({
    refresh_token: config.refreshToken,
    client_id: config.clientId,
    client_secret: config.clientSecret,
    grant_type: "refresh_token",
  });
  const response = await fetch(
    joinUrl(config.accountsBaseUrl, `/oauth/v2/token?${params.toString()}`),
    { method: "POST" },
  );
  const text = await response.text();
  const body = text ? JSON.parse(text) : {};

  if (!response.ok) {
    throw new Error(
      `Zoho Recruit token refresh failed with ${response.status}. ${sanitizedBody(
        JSON.stringify(body),
      )}`,
    );
  }

  const tokenResponse = body as ZohoRefreshTokenResponse;
  if (!tokenResponse.access_token) {
    throw new Error(
      "Zoho Recruit token refresh did not return an access token.",
    );
  }

  return {
    accessToken: tokenResponse.access_token,
    apiBaseUrl: resolveZohoRecruitApiBaseUrl({
      accountsBaseUrl: config.accountsBaseUrl,
      configuredApiBaseUrl: config.apiBaseUrl,
      tokenApiDomain: tokenResponse.api_domain,
    }),
  };
}

export function createZohoRecruitClient(
  _connection: ATSConnection,
  config = getZohoRecruitConfigFromEnv(),
): ZohoRecruitClient {
  let accessToken = config.accessToken;
  let apiBaseUrl = config.apiBaseUrl;

  async function ensureAccessToken() {
    if (accessToken) {
      return;
    }

    const refreshedToken = await refreshZohoRecruitAccessToken(config);
    accessToken = refreshedToken.accessToken;
    apiBaseUrl = refreshedToken.apiBaseUrl;
  }

  async function forceRefreshAccessToken() {
    const refreshedToken = await refreshZohoRecruitAccessToken(config);
    accessToken = refreshedToken.accessToken;
    apiBaseUrl = refreshedToken.apiBaseUrl;
  }

  async function sendRequest(path: string, init?: RequestInit) {
    await ensureAccessToken();

    return fetch(joinUrl(apiBaseUrl, path), {
      ...init,
      headers: {
        Accept: "application/json",
        Authorization: `Zoho-oauthtoken ${accessToken}`,
        "Content-Type": "application/json",
        ...init?.headers,
      },
    });
  }

  return {
    async request<TResponse>(path: string, init?: RequestInit) {
      let response = await sendRequest(path, init);
      if (
        response.status === 401 &&
        config.refreshToken &&
        config.clientId &&
        config.clientSecret
      ) {
        await forceRefreshAccessToken();
        response = await sendRequest(path, init);
      }

      const text = await response.text();

      if (response.status === 204 || !text) {
        return { data: [] } as TResponse;
      }

      const body = JSON.parse(text);

      if (!response.ok) {
        throw new Error(
          `Zoho Recruit request failed with ${response.status}. ${sanitizedBody(
            JSON.stringify(body),
          )}`,
        );
      }

      return body as TResponse;
    },
  };
}
