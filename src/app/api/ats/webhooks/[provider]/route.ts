import { NextResponse } from "next/server";

import { isATSProviderKey } from "@/domain/ats-integrations/types";

type ATSWebhookRouteContext = {
  params: Promise<{ provider: string }>;
};

export async function POST(request: Request, context: ATSWebhookRouteContext) {
  const { provider } = await context.params;

  if (!isATSProviderKey(provider)) {
    return NextResponse.json(
      { error: "Unsupported ATS provider." },
      { status: 400 },
    );
  }

  const payload = await request.json().catch(() => null);

  if (!payload || typeof payload !== "object") {
    return NextResponse.json(
      { error: "ATS webhook payload must be valid JSON." },
      { status: 400 },
    );
  }

  return NextResponse.json(
    {
      status: "accepted",
      provider,
    },
    { status: 202 },
  );
}
