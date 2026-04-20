import { NextResponse } from "next/server";

import { requireAuthenticatedApiRequest } from "@/lib/auth/server";
import {
  updateCandidateApplicationStage,
  type RecruiterPipelineAction,
} from "@/lib/candidate-applications";
import { recruiterCanAccessJobId } from "@/lib/team-access";

type RouteContext = {
  params: Promise<{
    candidateId: string;
  }>;
};

function isRecruiterPipelineAction(
  value: unknown,
): value is RecruiterPipelineAction {
  return (
    value === "shortlist" ||
    value === "reject" ||
    value === "hire" ||
    value === "move_to_interviewed" ||
    value === "move_to_shortlisted" ||
    value === "restore_to_interviewed"
  );
}

export async function POST(request: Request, context: RouteContext) {
  const recruiter = await requireAuthenticatedApiRequest();

  if (recruiter instanceof NextResponse) {
    return recruiter;
  }

  const { candidateId } = await context.params;
  const body = await request.json();

  if (typeof body.jobId !== "string" || !isRecruiterPipelineAction(body.action)) {
    return NextResponse.json(
      {
        success: false,
        error: "Missing stage action fields.",
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

  const result = await updateCandidateApplicationStage({
    candidateId,
    jobId: body.jobId,
    action: body.action,
  });

  return NextResponse.json(result, {
    status: result.success ? 200 : 400,
  });
}
