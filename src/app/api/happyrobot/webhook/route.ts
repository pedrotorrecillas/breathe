import { NextResponse } from "next/server";

import { receiveHappyRobotWebhook } from "@/lib/public-apply-submissions";

export async function POST(request: Request) {
  const body = await request.json();
  const result = await receiveHappyRobotWebhook(body);

  return NextResponse.json(result, {
    status: result.success ? 200 : 400,
  });
}
