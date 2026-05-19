import { NextResponse } from "next/server";

import { runAutoProcessableATSWritebacks } from "@/lib/ats-integrations/scheduled-writebacks";

function configuredSyncSecret() {
  return (
    process.env.ATS_SYNC_SECRET?.trim() ||
    process.env.CRON_SECRET?.trim() ||
    null
  );
}

function requestSyncSecret(request: Request) {
  const authorization = request.headers.get("authorization") ?? "";
  const bearerPrefix = "Bearer ";

  if (authorization.startsWith(bearerPrefix)) {
    return authorization.slice(bearerPrefix.length).trim();
  }

  return request.headers.get("x-ats-sync-secret")?.trim() || null;
}

function isAuthorized(request: Request) {
  const expectedSecret = configuredSyncSecret();

  if (!expectedSecret) {
    return {
      ok: false,
      status: 503,
      error: "ATS sync secret is not configured.",
    } as const;
  }

  if (requestSyncSecret(request) !== expectedSecret) {
    return {
      ok: false,
      status: 401,
      error: "Unauthorized ATS writeback processing request.",
    } as const;
  }

  return { ok: true } as const;
}

async function handleWritebacksRequest(request: Request) {
  const authorization = isAuthorized(request);

  if (!authorization.ok) {
    return NextResponse.json(
      {
        success: false,
        error: authorization.error,
      },
      { status: authorization.status },
    );
  }

  const result = await runAutoProcessableATSWritebacks({
    now: new Date().toISOString(),
  });
  const hasFailures = result.failedActions > 0;

  return NextResponse.json(
    {
      success: !hasFailures,
      ...(hasFailures
        ? { error: "One or more ATS writebacks failed." }
        : {}),
      result,
    },
    { status: hasFailures ? 502 : 200 },
  );
}

export async function GET(request: Request) {
  return handleWritebacksRequest(request);
}

export async function POST(request: Request) {
  return handleWritebacksRequest(request);
}
