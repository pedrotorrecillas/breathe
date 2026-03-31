import { NextResponse } from "next/server";

import { submitPublicApplication } from "@/lib/public-apply-submissions";

export async function POST(request: Request) {
  const body = await request.json();
  const result = await submitPublicApplication(body);

  if (!result.success) {
    return NextResponse.json(result, { status: 400 });
  }

  return NextResponse.json(result);
}
