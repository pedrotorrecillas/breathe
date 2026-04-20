import { NextResponse } from "next/server";

import { requireAuthenticatedApiRequest } from "@/lib/auth/server";
import { parseJobExtractionDraft } from "@/domain/jobs/configuration";
import { publishRecruiterJob } from "@/lib/recruiter-jobs";

export async function POST(request: Request) {
  const recruiter = await requireAuthenticatedApiRequest();

  if (recruiter instanceof NextResponse) {
    return recruiter;
  }

  const body = await request.json();
  const parsedDraft = parseJobExtractionDraft(body.draft);

  if (!parsedDraft.success) {
    return NextResponse.json(
      {
        success: false,
        error: parsedDraft.errors.join(" "),
      },
      { status: 400 },
    );
  }

  if (
    typeof body.title !== "string" ||
    typeof body.language !== "string" ||
    typeof body.description !== "string"
  ) {
    return NextResponse.json(
      {
        success: false,
        error: "Missing publish fields.",
      },
      { status: 400 },
    );
  }

  const job = await publishRecruiterJob({
    companyId: recruiter.company.id,
    title: body.title,
    language: body.language,
    description: body.description,
    draft: parsedDraft.data,
    interviewLimits: {
      maxInterviews: body.interviewLimits?.maxInterviews ?? null,
      outstandingCap: body.interviewLimits?.outstandingCap ?? null,
      greatCap: body.interviewLimits?.greatCap ?? null,
    },
  });

  return NextResponse.json({
    success: true,
    data: job,
  });
}
