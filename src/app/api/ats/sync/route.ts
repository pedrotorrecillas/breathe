import { NextResponse } from "next/server";

import { runConfiguredATSSyncs } from "@/lib/ats-integrations/scheduled-sync";

function configuredSyncSecret() {
  return process.env.ATS_SYNC_SECRET?.trim() || null;
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
      error: "Unauthorized ATS sync request.",
    } as const;
  }

  return { ok: true } as const;
}

export async function POST(request: Request) {
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

  const result = await runConfiguredATSSyncs({
    now: new Date().toISOString(),
  });

  return NextResponse.json({
    success: true,
    result,
  });
}
