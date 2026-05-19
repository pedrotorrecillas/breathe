import type {
  ATSCanonicalApplication,
  ATSConnection,
  ATSInternalStageKey,
  ATSWritebackAction,
} from "@/domain/ats-integrations/types";
import type {
  CandidateApplication,
  CandidatePipelineStage,
} from "@/domain/candidates/types";
import { writebackStageIdForMappingValue } from "@/lib/ats-integrations/stage-mappings";

function sanitizeIdPart(value: string) {
  return value.replace(/[^a-zA-Z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}

function buildManualStageWritebackPayload(input: {
  previousStage: CandidatePipelineStage;
  nextStage: CandidatePipelineStage;
}) {
  const summary = `Breathe stage changed to ${input.nextStage}`;

  return {
    summary,
    body: [
      "Breathe stage update",
      "",
      `Previous stage: ${input.previousStage}`,
      `New stage: ${input.nextStage}`,
    ].join("\n"),
    previousStage: input.previousStage,
    nextStage: input.nextStage,
  };
}

function buildManualStageWritebackAction(input: {
  application: CandidateApplication;
  atsApplication: ATSCanonicalApplication;
  previousStage: CandidatePipelineStage;
  nextStage: CandidatePipelineStage;
  targetExternalStageId: string;
  now: string;
}): ATSWritebackAction {
  const sourceObjectId = [
    input.application.id,
    input.nextStage,
    input.now,
  ].join(":");
  const idempotencyKey = [
    input.atsApplication.connectionId,
    input.atsApplication.externalId,
    "manual_stage_change",
    sourceObjectId,
  ].join(":");

  return {
    id: `ats_writeback_${sanitizeIdPart(idempotencyKey)}`,
    companyId: input.application.companyId,
    connectionId: input.atsApplication.connectionId,
    provider: input.atsApplication.provider,
    actionType: "application_stage_move",
    targetExternalCandidateId: input.atsApplication.externalCandidateId,
    targetExternalApplicationId: input.atsApplication.externalId,
    targetExternalJobId: input.atsApplication.externalJobId,
    targetExternalStageId: input.targetExternalStageId,
    sourceObjectType: "manual_admin_action",
    sourceObjectId,
    status: "queued",
    idempotencyKey,
    payload: buildManualStageWritebackPayload({
      previousStage: input.previousStage,
      nextStage: input.nextStage,
    }),
    createdAt: input.now,
    updatedAt: input.now,
  };
}

export function buildATSStageMoveWritebacksForApplicationStageChange(input: {
  application: CandidateApplication;
  previousStage: CandidatePipelineStage;
  nextStage: CandidatePipelineStage;
  atsConnections: ATSConnection[];
  atsApplications: ATSCanonicalApplication[];
  existingActions: ATSWritebackAction[];
  now: string;
}): ATSWritebackAction[] {
  const linkedApplications = input.atsApplications.filter(
    (atsApplication) =>
      atsApplication.companyId === input.application.companyId &&
      (atsApplication.internalApplicationId === input.application.id ||
        (atsApplication.internalCandidateId === input.application.candidateId &&
          atsApplication.internalJobId === input.application.jobId)),
  );

  return linkedApplications
    .flatMap((atsApplication) => {
      const connection = input.atsConnections.find(
        (item) =>
          item.id === atsApplication.connectionId &&
          item.companyId === atsApplication.companyId &&
          item.provider === atsApplication.provider,
      );

      if (!connection || connection.status !== "active") {
        return [];
      }

      const mappingValue =
        connection.writebackPolicy?.stageMoveMappings?.[
          input.nextStage as ATSInternalStageKey
        ] ??
        null;

      const targetExternalStageId = mappingValue
        ? writebackStageIdForMappingValue({
            mappingValue,
            externalJobId: atsApplication.externalJobId,
          })
        : null;

      if (!targetExternalStageId) {
        return [];
      }

      return [
        buildManualStageWritebackAction({
          application: input.application,
          atsApplication,
          previousStage: input.previousStage,
          nextStage: input.nextStage,
          targetExternalStageId,
          now: input.now,
        }),
      ];
    })
    .filter(
      (action) =>
        !input.existingActions.some(
          (existing) => existing.idempotencyKey === action.idempotencyKey,
        ),
    );
}
