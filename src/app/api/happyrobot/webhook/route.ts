import { NextResponse } from "next/server";

import { receiveHappyRobotWebhook } from "@/lib/public-apply-submissions";
import { parseHappyRobotWebhookEvent } from "@/lib/happyrobot-webhooks";

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "invalid_payload",
          message: "HappyRobot webhook payload must be valid JSON.",
        },
      },
      { status: 400 },
    );
  }

  const parsed = parseHappyRobotWebhookEvent(body);

  if (!parsed.success) {
    const debugEnabled =
      process.env.NODE_ENV !== "production" ||
      process.env.HAPPYROBOT_WEBHOOK_DEBUG === "true";

    return NextResponse.json(
      {
        success: false,
        error: parsed.error,
        ...(debugEnabled
          ? {
              debug: {
                receivedType: Array.isArray(body) ? "array" : typeof body,
                receivedKeys:
                  body && typeof body === "object" && !Array.isArray(body)
                    ? Object.keys(body as Record<string, unknown>)
                    : [],
                rawPayload: body,
              },
            }
          : {}),
      },
      { status: 400 },
    );
  }

  const result = await receiveHappyRobotWebhook(body);

  return NextResponse.json(result, {
    status: result.success ? 200 : 400,
  });
}
