const defaultZohoRecruitScopes = ["ZohoRecruit.modules.ALL"];

export type ZohoRecruitAuthorizationUrlInput = {
  accountsBaseUrl: string;
  clientId: string;
  redirectUri: string;
  scopes?: string[];
  state?: string | null;
};

export type ZohoRecruitAuthorizationCodeExchangeInput = {
  accountsBaseUrl: string;
  code: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
};

export type ZohoRecruitOAuthTokens = {
  accessToken: string;
  refreshToken: string;
  apiDomain: string | null;
  tokenType: string | null;
  expiresIn: number | null;
};

type ZohoRecruitTokenResponse = {
  access_token?: string;
  refresh_token?: string;
  api_domain?: string;
  token_type?: string;
  expires_in?: number;
};

function joinUrl(baseUrl: string, path: string) {
  return `${baseUrl.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`;
}

function redactOAuthSecrets(value: string) {
  return value
    .replace(/"client_secret"\s*:\s*"[^"]*"/g, '"client_secret":"[redacted]"')
    .replace(/"code"\s*:\s*"[^"]*"/g, '"code":"[redacted]"')
    .replace(/client_secret=[^&"]+/g, "client_secret=[redacted]")
    .replace(/code=[^&"]+/g, "code=[redacted]");
}

export function buildZohoRecruitAuthorizationUrl(
  input: ZohoRecruitAuthorizationUrlInput,
) {
  const params = new URLSearchParams({
    scope: (input.scopes ?? defaultZohoRecruitScopes).join(","),
    client_id: input.clientId,
    response_type: "code",
    access_type: "offline",
    redirect_uri: input.redirectUri,
  });

  if (input.state) {
    params.set("state", input.state);
  }

  return joinUrl(input.accountsBaseUrl, `/oauth/v2/auth?${params.toString()}`);
}

export async function exchangeZohoRecruitAuthorizationCode(
  input: ZohoRecruitAuthorizationCodeExchangeInput,
): Promise<ZohoRecruitOAuthTokens> {
  const params = new URLSearchParams({
    code: input.code,
    client_id: input.clientId,
    client_secret: input.clientSecret,
    redirect_uri: input.redirectUri,
    grant_type: "authorization_code",
  });
  const response = await fetch(
    joinUrl(input.accountsBaseUrl, `/oauth/v2/token?${params.toString()}`),
    { method: "POST" },
  );
  const text = await response.text();
  const body = text ? JSON.parse(text) : {};

  if (!response.ok) {
    throw new Error(
      `Zoho Recruit authorization code exchange failed with ${response.status}. ${redactOAuthSecrets(
        JSON.stringify(body),
      )}`,
    );
  }

  const tokenResponse = body as ZohoRecruitTokenResponse;
  if (!tokenResponse.access_token || !tokenResponse.refresh_token) {
    throw new Error(
      "Zoho Recruit authorization code exchange did not return access and refresh tokens.",
    );
  }

  return {
    accessToken: tokenResponse.access_token,
    refreshToken: tokenResponse.refresh_token,
    apiDomain: tokenResponse.api_domain ?? null,
    tokenType: tokenResponse.token_type ?? null,
    expiresIn: tokenResponse.expires_in ?? null,
  };
}
