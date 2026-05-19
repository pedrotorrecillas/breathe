import type { ATSConnection } from "@/domain/ats-integrations/types";

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

export function getZohoRecruitConfigFromEnv(): ZohoRecruitConfig {
  return {
    accessToken: process.env.ZOHO_RECRUIT_ACCESS_TOKEN?.trim() || null,
    refreshToken: process.env.ZOHO_RECRUIT_REFRESH_TOKEN?.trim() || null,
    clientId: process.env.ZOHO_RECRUIT_CLIENT_ID?.trim() || null,
    clientSecret: process.env.ZOHO_RECRUIT_CLIENT_SECRET?.trim() || null,
    accountsBaseUrl:
      process.env.ZOHO_RECRUIT_ACCOUNTS_BASE_URL?.trim() ||
      "https://accounts.zoho.com",
    apiBaseUrl:
      process.env.ZOHO_RECRUIT_API_BASE_URL?.trim() ||
      "https://recruit.zoho.com",
  };
}

function joinUrl(baseUrl: string, path: string) {
  return `${baseUrl.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`;
}

function sanitizedBody(value: string) {
  return value.replace(/Zoho-oauthtoken\s+[A-Za-z0-9._-]+/g, "Zoho-oauthtoken [redacted]");
}

export function createZohoRecruitClient(
  _connection: ATSConnection,
  config = getZohoRecruitConfigFromEnv(),
): ZohoRecruitClient {
  if (!config.accessToken) {
    throw new Error("ZOHO_RECRUIT_ACCESS_TOKEN is required for Zoho Recruit sync.");
  }

  return {
    async request<TResponse>(path: string, init?: RequestInit) {
      const response = await fetch(joinUrl(config.apiBaseUrl, path), {
        ...init,
        headers: {
          Accept: "application/json",
          Authorization: `Zoho-oauthtoken ${config.accessToken}`,
          "Content-Type": "application/json",
          ...init?.headers,
        },
      });

      const text = await response.text();
      const body = text ? JSON.parse(text) : {};

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
