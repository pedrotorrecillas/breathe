import type {
  ATSCanonicalApplication,
  ATSSyncEvent,
  ATSWorkflowRequest,
  ATSWritebackAction,
} from "@/domain/ats-integrations/types";
import type { CandidateEvaluation } from "@/domain/evaluations/types";
import type { InterviewRun } from "@/domain/interviews/types";
import type { ATSTriggerMatch } from "@/lib/ats-integrations/triggers";

function sanitizeIdPart(value: string) {
  return value.replace(/[^a-zA-Z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}

export function buildATSWorkflowRequestsForEvent(input: {
  event: ATSSyncEvent;
  matches: ATSTriggerMatch[];
  now: string;
}): ATSWorkflowRequest[] {
  return input.matches.map((match) => ({
    id: `ats_workflow_${input.event.id}_${match.ruleId}`,
    companyId: input.event.companyId,
    atsSyncEventId: input.event.id,
    atsTriggerRuleId: match.ruleId,
    externalApplicationId: input.event.externalObjectId,
    internalCandidateId: null,
    internalApplicationId: null,
    requestedActions: match.actions,
    requiresRecruiterApproval: match.requiresRecruiterApproval,
    status: "queued",
    createdAt: input.now,
    updatedAt: input.now,
  }));
}

export function enqueueATSWritebacksForEvaluation(input: {
  evaluation: CandidateEvaluation;
  interviewRun: InterviewRun;
  atsApplications: ATSCanonicalApplication[];
  existingActions: ATSWritebackAction[];
  now: string;
}): ATSWritebackAction[] {
  const linkedApplication = input.atsApplications.find(
    (application) =>
      application.internalApplicationId === input.interviewRun.applicationId ||
      application.internalCandidateId === input.interviewRun.candidateId,
  );

  if (!linkedApplication) {
    return [];
  }

  const idempotencyKey = [
    linkedApplication.connectionId,
    linkedApplication.externalId,
    "evaluation",
    input.evaluation.id,
    "candidate_note",
  ].join(":");

  if (
    input.existingActions.some(
      (action) => action.idempotencyKey === idempotencyKey,
    )
  ) {
    return [];
  }

  return [
    {
      id: `ats_writeback_${sanitizeIdPart(idempotencyKey)}`,
      companyId: input.evaluation.companyId,
      connectionId: linkedApplication.connectionId,
      provider: linkedApplication.provider,
      actionType: "candidate_note",
      targetExternalCandidateId: linkedApplication.externalCandidateId,
      targetExternalApplicationId: linkedApplication.externalId,
      targetExternalJobId: linkedApplication.externalJobId,
      targetExternalStageId: null,
      sourceObjectType: "evaluation",
      sourceObjectId: input.evaluation.id,
      status: "queued",
      idempotencyKey,
      payload: {
        summary: `${input.evaluation.finalScoreState}: ${
          input.evaluation.finalNumericScore ?? "Pending"
        }`,
        fitClassification: input.evaluation.fitClassification ?? null,
      },
      createdAt: input.now,
      updatedAt: input.now,
    },
  ];
}
