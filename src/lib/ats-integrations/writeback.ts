import type {
  ATSProviderKey,
  ATSRawSnapshot,
  ATSWritebackAction,
  ATSWritebackActionType,
  ATSWritebackAttempt,
} from "@/domain/ats-integrations/types";
import { getATSAdapter } from "@/lib/ats-integrations/registry";
import {
  loadRuntimeStoreState,
  saveRuntimeStoreState,
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
) {
  const state = await loadRuntimeStoreState();
  const action = state.atsWritebackActions.find(
    (item) => item.id === input.writebackActionId,
  );

  if (!action) {
    throw new Error("ATS writeback action not found.");
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

  const adapter = getATSAdapter(action.provider);
  const providerResult = await adapter.writeback({
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

  await saveRuntimeStoreState(state);

  return {
    action: state.atsWritebackActions.find((item) => item.id === action.id)!,
    attempt,
  };
}
