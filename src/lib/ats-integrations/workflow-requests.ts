import type {
  ATSCanonicalApplication,
  ATSConnection,
  ATSSyncEvent,
  ATSWritebackActionType,
  ATSWorkflowRequest,
  ATSWritebackAction,
  ATSWritebackPolicy,
} from "@/domain/ats-integrations/types";
import type { CandidateEvaluation } from "@/domain/evaluations/types";
import type { InterviewRun } from "@/domain/interviews/types";
import type { ATSTriggerMatch } from "@/lib/ats-integrations/triggers";

function sanitizeIdPart(value: string) {
  return value.replace(/[^a-zA-Z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}

const defaultWritebackPolicy: ATSWritebackPolicy = {
  reportMode: "candidate_note",
  moveToExternalStageId: null,
  requiresRecruiterReview: true,
};

function buildEvaluationPayload(input: { evaluation: CandidateEvaluation }) {
  return {
    summary: `${input.evaluation.finalScoreState}: ${
      input.evaluation.finalNumericScore ?? "Pending"
    }`,
    fitClassification: input.evaluation.fitClassification ?? null,
  };
}

function buildWritebackAction(input: {
  application: ATSCanonicalApplication;
  evaluation: CandidateEvaluation;
  actionType: ATSWritebackActionType;
  targetExternalStageId: string | null;
  now: string;
}): ATSWritebackAction {
  const idempotencyKey = [
    input.application.connectionId,
    input.application.externalId,
    "evaluation",
    input.evaluation.id,
    input.actionType,
  ].join(":");

  return {
    id: `ats_writeback_${sanitizeIdPart(idempotencyKey)}`,
    companyId: input.evaluation.companyId,
    connectionId: input.application.connectionId,
    provider: input.application.provider,
    actionType: input.actionType,
    targetExternalCandidateId: input.application.externalCandidateId,
    targetExternalApplicationId: input.application.externalId,
    targetExternalJobId: input.application.externalJobId,
    targetExternalStageId: input.targetExternalStageId,
    sourceObjectType: "evaluation",
    sourceObjectId: input.evaluation.id,
    status: "queued",
    idempotencyKey,
    payload: buildEvaluationPayload({ evaluation: input.evaluation }),
    createdAt: input.now,
    updatedAt: input.now,
  };
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
  atsConnections: ATSConnection[];
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

  const connection = input.atsConnections.find(
    (item) =>
      item.id === linkedApplication.connectionId &&
      item.companyId === linkedApplication.companyId,
  );
  const policy = connection?.writebackPolicy ?? defaultWritebackPolicy;
  const actionTypes: ATSWritebackActionType[] = [];

  if (policy.reportMode !== "disabled") {
    actionTypes.push(policy.reportMode);
  }

  if (policy.moveToExternalStageId) {
    actionTypes.push("application_stage_move");
  }

  return actionTypes
    .map((actionType) =>
      buildWritebackAction({
        application: linkedApplication,
        evaluation: input.evaluation,
        actionType,
        targetExternalStageId:
          actionType === "application_stage_move"
            ? policy.moveToExternalStageId
            : null,
        now: input.now,
      }),
    )
    .filter(
      (action) =>
        !input.existingActions.some(
          (existing) => existing.idempotencyKey === action.idempotencyKey,
        ),
    );
}
