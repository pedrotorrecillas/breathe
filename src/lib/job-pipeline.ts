export const activePipelineStages = [
  "Applicants",
  "Interviewed",
  "Shortlisted",
  "Hired",
] as const;

export const jobDetailTabs = [...activePipelineStages, "Rejected"] as const;

export type ActivePipelineStage = (typeof activePipelineStages)[number];
export type JobDetailTab = (typeof jobDetailTabs)[number];

export type PipelineScoreState =
  | "Outstanding"
  | "Great"
  | "Good"
  | "Average"
  | "Low"
  | "Poor";

export type PipelineOperationalState =
  | "pending"
  | "calling"
  | "completed"
  | "human_requested"
  | "no_response";

export type PipelineCandidate = {
  id: string;
  fullName: string;
  stage: JobDetailTab;
  summary: string;
  relevantDateLabel: string;
  relevantDateValue: string;
  scoreState?: PipelineScoreState;
  operationalState?: PipelineOperationalState;
  rejectedReason?: string;
};

export type RecruiterAction =
  | "shortlist"
  | "reject"
  | "hire"
  | "move_to_interviewed"
  | "move_to_shortlisted"
  | "restore_to_interviewed";

export function getOperationalStateLabel(
  operationalState: PipelineOperationalState,
) {
  switch (operationalState) {
    case "pending":
      return "Awaiting call";
    case "calling":
      return "Calling now";
    case "completed":
      return "Interview complete";
    case "human_requested":
      return "Human requested";
    case "no_response":
      return "No response yet";
  }
}

export function getCandidatesForStage(
  candidates: PipelineCandidate[],
  stage: JobDetailTab,
) {
  return candidates.filter((candidate) => candidate.stage === stage);
}

export function applyRecruiterAction(
  candidates: PipelineCandidate[],
  candidateId: string,
  action: RecruiterAction,
): PipelineCandidate[] {
  return candidates.map((candidate) => {
    if (candidate.id !== candidateId) {
      return candidate;
    }

    if (action === "shortlist" && candidate.stage === "Interviewed") {
      return {
        ...candidate,
        stage: "Shortlisted",
        rejectedReason: undefined,
      };
    }

    if (action === "reject") {
      return {
        ...candidate,
        stage: "Rejected",
        rejectedReason:
          candidate.stage === "Applicants"
            ? "Rejected from applicants"
            : "Rejected after review",
      };
    }

    if (action === "hire" && candidate.stage === "Shortlisted") {
      return {
        ...candidate,
        stage: "Hired",
        rejectedReason: undefined,
      };
    }

    if (action === "move_to_interviewed" && candidate.stage === "Shortlisted") {
      return {
        ...candidate,
        stage: "Interviewed",
        rejectedReason: undefined,
      };
    }

    if (action === "move_to_shortlisted" && candidate.stage === "Hired") {
      return {
        ...candidate,
        stage: "Shortlisted",
        rejectedReason: undefined,
      };
    }

    if (action === "restore_to_interviewed" && candidate.stage === "Rejected") {
      return {
        ...candidate,
        stage: "Interviewed",
        rejectedReason: undefined,
      };
    }

    return candidate;
  });
}
