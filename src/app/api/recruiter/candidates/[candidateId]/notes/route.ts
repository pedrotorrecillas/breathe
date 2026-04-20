import { NextResponse } from "next/server";

import { createCandidateNote } from "@/lib/candidate-notes";
import { requireAuthenticatedApiRequest } from "@/lib/auth/server";
import { recruiterCanAccessJobId } from "@/lib/team-access";

type RouteContext = {
  params: Promise<{
    candidateId: string;
  }>;
};

export async function POST(request: Request, context: RouteContext) {
  const recruiter = await requireAuthenticatedApiRequest();

  if (recruiter instanceof NextResponse) {
    return recruiter;
  }

  const { candidateId } = await context.params;
  const body = await request.json();

  if (
    typeof body.applicationId !== "string" ||
    typeof body.jobId !== "string" ||
    typeof body.body !== "string"
  ) {
    return NextResponse.json(
      {
        success: false,
        error: "Missing note fields.",
      },
      { status: 400 },
    );
  }

  if (!(await recruiterCanAccessJobId(recruiter, body.jobId))) {
    return NextResponse.json(
      {
        success: false,
        error: "You do not have access to that opportunity.",
      },
      { status: 403 },
    );
  }

  const result = await createCandidateNote({
    candidateId,
    applicationId: body.applicationId,
    jobId: body.jobId,
    body: body.body,
    author: {
      userId: recruiter.user.id,
      name: recruiter.user.displayName,
    },
  });

  return NextResponse.json(result, {
    status: result.success ? 200 : 400,
  });
}
