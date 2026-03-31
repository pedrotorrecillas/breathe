import { NextResponse } from "next/server";

import { extractJobConfiguration } from "@/lib/job-extraction";

export async function POST(request: Request) {
  const body = await request.json();

  if (
    typeof body.title !== "string" ||
    typeof body.description !== "string" ||
    typeof body.language !== "string"
  ) {
    return NextResponse.json(
      {
        success: false,
        error: "Missing extraction fields.",
      },
      { status: 400 },
    );
  }

  const result = await extractJobConfiguration({
    title: body.title,
    description: body.description,
    language: body.language,
  });

  if (!result.success) {
    return NextResponse.json(
      {
        success: false,
        error: result.error,
      },
      { status: 400 },
    );
  }

  return NextResponse.json(result);
}
