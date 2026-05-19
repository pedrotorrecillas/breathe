import type {
  ATSProviderKey,
  ATSRawSnapshot,
  ATSConnection,
  ATSWritebackAction,
  ATSWritebackActionType,
  ATSWritebackAttempt,
  ATSWritebackResult,
  ATSStageCategory,
} from "@/domain/ats-integrations/types";
import { getATSAdapter } from "@/lib/ats-integrations/registry";
import {
  loadRuntimeStoreState,
  saveRuntimeStoreState,
  type RuntimeStoreState,
} from "@/lib/db/runtime-store";

type EnqueueATSWritebackInput = {
  companyId: string;
  connectionId: string;
  provider: ATSProviderKey;
  actionType: ATSWritebackActionType;
  targetExternalCandidateId: string | null;
  targetExternalApplicationId: string | null;
  targetExternalJobId: string | null;
  targetExternalStageId: string | null;
  sourceObjectType: ATSWritebackAction["sourceObjectType"];
  sourceObjectId: string;
  payload: ATSRawSnapshot;
  now: string;
};

type ProcessATSWritebackActionInput = {
  writebackActionId: string;
  now: string;
};

export type ProcessedATSWritebackAction = {
  action: ATSWritebackAction;
  attempt: ATSWritebackAttempt;
};

function sanitizeIdPart(value: string) {
  return value.replace(/[^a-zA-Z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}

export function buildATSWritebackIdempotencyKey(
  input: EnqueueATSWritebackInput,
) {
  return [
    input.connectionId,
    input.targetExternalApplicationId ??
      input.targetExternalCandidateId ??
      "no_target",
    input.sourceObjectType,
    input.sourceObjectId,
    input.actionType,
  ].join(":");
}

function writebackActionId(idempotencyKey: string) {
  return `ats_writeback_${sanitizeIdPart(idempotencyKey)}`;
}

function writebackAttemptId(input: {
  writebackActionId: string;
  attemptedAt: string;
  index: number;
}) {
  return `ats_attempt_${sanitizeIdPart(input.writebackActionId)}_${sanitizeIdPart(
    input.attemptedAt,
  )}_${input.index}`;
}

function updateCanonicalApplicationAfterStageMove(input: {
  state: RuntimeStoreState;
  action: ATSWritebackAction;
  now: string;
}) {
  if (
    input.action.actionType !== "application_stage_move" ||
    !input.action.targetExternalApplicationId ||
    !input.action.targetExternalStageId
  ) {
    return;
  }

  input.state.atsExternalApplications =
    input.state.atsExternalApplications.map((application) => {
      if (
        application.companyId !== input.action.companyId ||
        application.connectionId !== input.action.connectionId ||
        application.externalId !== input.action.targetExternalApplicationId
      ) {
        return application;
      }

      const targetStage = input.state.atsExternalStages.find(
        (stage) =>
          stage.companyId === input.action.companyId &&
          stage.connectionId === input.action.connectionId &&
          stage.externalId === input.action.targetExternalStageId &&
          (!stage.externalJobId ||
            !input.action.targetExternalJobId ||
            stage.externalJobId === input.action.targetExternalJobId),
      );
      const stageName = targetStage?.name ?? input.action.targetExternalStageId;
      const stageCategory: ATSStageCategory =
        targetStage?.category ?? application.stageCategory;

      return {
        ...application,
        externalStageId: input.action.targetExternalStageId,
        stageName,
        stageCategory,
        lastSeenAt: input.now,
        rawSnapshot: {
          ...application.rawSnapshot,
          previousExternalStageId: application.externalStageId,
          previousStageName: application.stageName,
          writebackActionId: input.action.id,
          writebackUpdatedAt: input.now,
        },
      };
    });
}

export async function enqueueATSWriteback(
  input: EnqueueATSWritebackInput,
): Promise<ATSWritebackAction> {
  const state = await loadRuntimeStoreState();
  const idempotencyKey = buildATSWritebackIdempotencyKey(input);
  const existing = state.atsWritebackActions.find(
    (action) => action.idempotencyKey === idempotencyKey,
  );

  if (existing) {
    return existing;
  }

  const action: ATSWritebackAction = {
    id: writebackActionId(idempotencyKey),
    companyId: input.companyId,
    connectionId: input.connectionId,
    provider: input.provider,
    actionType: input.actionType,
    targetExternalCandidateId: input.targetExternalCandidateId,
    targetExternalApplicationId: input.targetExternalApplicationId,
    targetExternalJobId: input.targetExternalJobId,
    targetExternalStageId: input.targetExternalStageId,
    sourceObjectType: input.sourceObjectType,
    sourceObjectId: input.sourceObjectId,
    status: "queued",
    idempotencyKey,
    payload: input.payload,
    createdAt: input.now,
    updatedAt: input.now,
  };

  state.atsWritebackActions.push(action);
  await saveRuntimeStoreState(state);

  return action;
}

export async function processATSWritebackAction(
  input: ProcessATSWritebackActionInput,
): Promise<ProcessedATSWritebackAction> {
  const state = await loadRuntimeStoreState();
  const processed = await processATSWritebackActionInState({
    state,
    writebackActionId: input.writebackActionId,
    now: input.now,
  });

  await saveRuntimeStoreState(state);

  return processed;
}

export async function processATSWritebackActionInState(input: {
  state: RuntimeStoreState;
  writebackActionId: string;
  now: string;
}): Promise<ProcessedATSWritebackAction> {
  const state = input.state;
  const action = state.atsWritebackActions.find(
    (item) => item.id === input.writebackActionId,
  );

  if (!action) {
    throw new Error("ATS writeback action not found.");
  }

  if (action.status !== "queued" && action.status !== "retryable_error") {
    throw new Error("ATS writeback action is not queued for processing.");
  }

  const connection = state.atsConnections.find(
    (item) =>
      item.id === action.connectionId &&
      item.companyId === action.companyId &&
      item.provider === action.provider,
  );

  if (!connection) {
    throw new Error("ATS connection not found for writeback action.");
  }

  if (connection.status !== "active") {
    throw new Error("ATS connection is not active.");
  }

  const providerResult = await dispatchWriteback({
    connection,
    action: {
      ...action,
      updatedAt: input.now,
    },
  });
  const attempt: ATSWritebackAttempt = {
    id: writebackAttemptId({
      writebackActionId: action.id,
      attemptedAt: input.now,
      index: state.atsWritebackAttempts.length,
    }),
    writebackActionId: action.id,
    attemptedAt: input.now,
    status: providerResult.status,
    providerStatusCode: providerResult.providerStatusCode,
    providerResponse: providerResult.providerResponse,
    errorMessage: providerResult.errorMessage,
  };

  state.atsWritebackAttempts.push(attempt);
  state.atsWritebackActions = state.atsWritebackActions.map((item) =>
    item.id === action.id
      ? {
          ...item,
          status: providerResult.status,
          updatedAt: input.now,
        }
      : item,
  );

  if (providerResult.status === "succeeded") {
    updateCanonicalApplicationAfterStageMove({
      state,
      action,
      now: input.now,
    });
  }

  return {
    action: state.atsWritebackActions.find((item) => item.id === action.id)!,
    attempt,
  };
}

async function dispatchWriteback(input: {
  connection: ATSConnection;
  action: ATSWritebackAction;
}): Promise<ATSWritebackResult> {
  try {
    const adapter = getATSAdapter(input.action.provider);

    return await adapter.writeback(input);
  } catch (error) {
    return {
      status: "retryable_error",
      providerStatusCode: null,
      providerResponse: {},
      errorMessage:
        error instanceof Error ? error.message : "ATS writeback failed.",
    };
  }
}
