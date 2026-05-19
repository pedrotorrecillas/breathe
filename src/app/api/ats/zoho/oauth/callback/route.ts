import { exchangeZohoRecruitAuthorizationCode } from "@/lib/ats-integrations/zoho/oauth";
import { recruitApiBaseUrlForAccountsBaseUrl } from "@/lib/ats-integrations/zoho/urls";
import { requireAuthenticatedApiRequest } from "@/lib/auth/server";
import { recruiterCanManageTeams } from "@/lib/team-access";

type ZohoOAuthCallbackConfig = {
  accountsBaseUrl: string;
  apiBaseUrl: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function htmlResponse(body: string, init?: ResponseInit) {
  return new Response(body, {
    ...init,
    headers: {
      "content-type": "text/html; charset=utf-8",
      ...init?.headers,
    },
  });
}

function renderZohoOAuthPage(input: {
  title: string;
  status: "success" | "error";
  message: string;
  envBlock?: string | null;
}) {
  const accentClass =
    input.status === "success" ? "color: #047857;" : "color: #b91c1c;";

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(input.title)}</title>
    <style>
      body { margin: 0; font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; background: #f8fafc; color: #0f172a; }
      main { max-width: 760px; margin: 48px auto; padding: 32px; background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; }
      h1 { margin: 0 0 12px; font-size: 24px; line-height: 1.2; ${accentClass} }
      p { margin: 0 0 18px; color: #475569; line-height: 1.6; }
      pre { overflow-x: auto; padding: 16px; border-radius: 8px; background: #0f172a; color: #e2e8f0; font-size: 13px; line-height: 1.5; }
      a { color: #0f766e; }
    </style>
  </head>
  <body>
    <main>
      <h1>${escapeHtml(input.title)}</h1>
      <p>${escapeHtml(input.message)}</p>
      ${
        input.envBlock
          ? `<pre>${escapeHtml(input.envBlock)}</pre><p>Set these values in the server environment, restart the app, then use the ATS admin page to add or test the Zoho Recruit connection.</p>`
          : ""
      }
      <p><a href="/settings/integrations/ats">Back to ATS settings</a></p>
    </main>
  </body>
</html>`;
}

function readZohoOAuthCallbackConfig(): ZohoOAuthCallbackConfig | null {
  const clientId = process.env.ZOHO_RECRUIT_CLIENT_ID?.trim();
  const clientSecret = process.env.ZOHO_RECRUIT_CLIENT_SECRET?.trim();
  const redirectUri = process.env.ZOHO_RECRUIT_REDIRECT_URI?.trim();
  const accountsBaseUrl =
    process.env.ZOHO_RECRUIT_ACCOUNTS_BASE_URL?.trim() ||
    "https://accounts.zoho.com";

  if (!clientId || !clientSecret || !redirectUri) {
    return null;
  }

  return {
    accountsBaseUrl,
    apiBaseUrl:
      process.env.ZOHO_RECRUIT_API_BASE_URL?.trim() ||
      recruitApiBaseUrlForAccountsBaseUrl(accountsBaseUrl),
    clientId,
    clientSecret,
    redirectUri,
  };
}

export async function GET(request: Request) {
  const recruiterOrResponse = await requireAuthenticatedApiRequest();

  if (recruiterOrResponse instanceof Response) {
    return recruiterOrResponse;
  }

  if (!recruiterCanManageTeams(recruiterOrResponse)) {
    return htmlResponse(
      renderZohoOAuthPage({
        title: "Zoho OAuth access denied",
        status: "error",
        message: "Only admins and owners can finish Zoho Recruit setup.",
      }),
      { status: 403 },
    );
  }

  const requestUrl = new URL(request.url);
  const providerError = requestUrl.searchParams.get("error");
  if (providerError) {
    return htmlResponse(
      renderZohoOAuthPage({
        title: "Zoho OAuth failed",
        status: "error",
        message: `Zoho returned an OAuth error: ${providerError}.`,
      }),
      { status: 400 },
    );
  }

  const code = requestUrl.searchParams.get("code")?.trim();
  if (!code) {
    return htmlResponse(
      renderZohoOAuthPage({
        title: "Zoho OAuth code missing",
        status: "error",
        message: "Zoho did not return an authorization code.",
      }),
      { status: 400 },
    );
  }

  const config = readZohoOAuthCallbackConfig();
  if (!config) {
    return htmlResponse(
      renderZohoOAuthPage({
        title: "Zoho OAuth setup is incomplete",
        status: "error",
        message:
          "Configure ZOHO_RECRUIT_CLIENT_ID, ZOHO_RECRUIT_CLIENT_SECRET, and ZOHO_RECRUIT_REDIRECT_URI before exchanging a Zoho authorization code.",
      }),
      { status: 503 },
    );
  }

  try {
    const tokens = await exchangeZohoRecruitAuthorizationCode({
      accountsBaseUrl: config.accountsBaseUrl,
      code,
      clientId: config.clientId,
      clientSecret: config.clientSecret,
      redirectUri: config.redirectUri,
    });
    const apiBaseUrl = tokens.apiDomain ?? config.apiBaseUrl;

    return htmlResponse(
      renderZohoOAuthPage({
        title: "Zoho OAuth ready",
        status: "success",
        message:
          "Zoho returned a refresh token for the Recruit demo. Store these server environment values before syncing.",
        envBlock: [
          `ZOHO_RECRUIT_REFRESH_TOKEN=${tokens.refreshToken}`,
          `ZOHO_RECRUIT_ACCOUNTS_BASE_URL=${config.accountsBaseUrl}`,
          `ZOHO_RECRUIT_API_BASE_URL=${apiBaseUrl}`,
        ].join("\n"),
      }),
    );
  } catch (error) {
    return htmlResponse(
      renderZohoOAuthPage({
        title: "Zoho OAuth exchange failed",
        status: "error",
        message:
          error instanceof Error
            ? error.message
            : "Zoho Recruit authorization code exchange failed.",
      }),
      { status: 502 },
    );
  }
}
