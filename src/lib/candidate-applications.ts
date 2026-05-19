import type {
  CandidateApplication,
  CandidatePipelineStage,
} from "@/domain/candidates/types";
import { buildATSStageMoveWritebacksForApplicationStageChange } from "@/lib/ats-integrations/stage-writebacks";
import { processATSWritebackActionInState } from "@/lib/ats-integrations/writeback";
import {
  loadRuntimeStoreState,
  saveRuntimeStoreState,
} from "@/lib/db/runtime-store";

export type RecruiterPipelineAction =
  | "shortlist"
  | "reject"
  | "hire"
  | "move_to_interviewed"
  | "move_to_shortlisted"
  | "restore_to_interviewed";

function findLatestApplicationIndex(
  applications: CandidateApplication[],
  candidateId: string,
  jobId: string,
) {
  let latestIndex = -1;

  for (let index = 0; index < applications.length; index += 1) {
    const application = applications[index];

    if (application.candidateId !== candidateId || application.jobId !== jobId) {
      continue;
    }

    if (
      latestIndex < 0 ||
      application.submittedAt >= applications[latestIndex]!.submittedAt
    ) {
      latestIndex = index;
    }
  }

  return latestIndex;
}

function applyRecruiterActionToStage(
  stage: CandidatePipelineStage,
  action: RecruiterPipelineAction,
) {
  if (action === "shortlist" && stage === "interviewed") {
    return {
      stage: "shortlisted" as const,
      recruiterOutcomeNote: null,
    };
  }

  if (action === "reject") {
    return {
      stage: "rejected" as const,
      recruiterOutcomeNote:
        stage === "applicant"
          ? "Rejected from applicants"
          : "Rejected after review",
    };
  }

  if (action === "hire" && stage === "shortlisted") {
    return {
      stage: "hired" as const,
      recruiterOutcomeNote: null,
    };
  }

  if (action === "move_to_interviewed" && stage === "shortlisted") {
    return {
      stage: "interviewed" as const,
      recruiterOutcomeNote: null,
    };
  }

  if (action === "move_to_shortlisted" && stage === "hired") {
    return {
      stage: "shortlisted" as const,
      recruiterOutcomeNote: null,
    };
  }

  if (action === "restore_to_interviewed" && stage === "rejected") {
    return {
      stage: "interviewed" as const,
      recruiterOutcomeNote: null,
    };
  }

  return null;
}

export async function updateCandidateApplicationStage(input: {
  candidateId: string;
  jobId: string;
  action: RecruiterPipelineAction;
}): Promise<
  | { success: true; data: CandidateApplication }
  | { success: false; error: string }
> {
  const state = await loadRuntimeStoreState();
  const applicationIndex = findLatestApplicationIndex(
    state.applications,
    input.candidateId,
    input.jobId,
  );

  if (applicationIndex < 0) {
    return {
      success: false,
      error: "Candidate application could not be found for this action.",
    };
  }

  const application = state.applications[applicationIndex]!;
  const nextTransition = applyRecruiterActionToStage(
    application.stage,
    input.action,
  );

  if (!nextTransition) {
    return {
      success: false,
      error: "That recruiter action is not valid for the current candidate stage.",
    };
  }

  const nextApplication: CandidateApplication = {
    ...application,
    stage: nextTransition.stage,
    needsHumanReviewAt: null,
    recruiterOutcomeNote: nextTransition.recruiterOutcomeNote,
  };
  const now = new Date().toISOString();
  const writebackActions = buildATSStageMoveWritebacksForApplicationStageChange({
    application: nextApplication,
    previousStage: application.stage,
    nextStage: nextApplication.stage,
    atsConnections: state.atsConnections,
    atsApplications: state.atsExternalApplications,
    existingActions: state.atsWritebackActions,
    now,
  });

  state.applications[applicationIndex] = nextApplication;
  state.atsWritebackActions.push(...writebackActions);

  for (const writebackAction of writebackActions) {
    const connection = state.atsConnections.find(
      (item) =>
        item.id === writebackAction.connectionId &&
        item.companyId === writebackAction.companyId &&
        item.provider === writebackAction.provider,
    );

    if (connection?.writebackPolicy?.requiresRecruiterReview === false) {
      await processATSWritebackActionInState({
        state,
        writebackActionId: writebackAction.id,
        now,
      });
    }
  }

  await saveRuntimeStoreState(state);

  return {
    success: true,
    data: nextApplication,
  };
}
