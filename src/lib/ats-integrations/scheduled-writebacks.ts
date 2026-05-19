import {
  processATSWritebackAction,
  type ProcessedATSWritebackAction,
} from "@/lib/ats-integrations/writeback";
import { loadRuntimeStoreState } from "@/lib/db/runtime-store";

export type AutoProcessableATSWritebackResult = {
  writebackActionId: string;
  companyId: string;
  connectionId: string;
  provider: string;
  status: "succeeded" | "skipped" | "failed";
  processed: ProcessedATSWritebackAction | null;
  errorMessage: string | null;
};

export type AutoProcessableATSWritebacksResult = {
  scannedActions: number;
  attemptedActions: number;
  succeededActions: number;
  skippedActions: number;
  failedActions: number;
  results: AutoProcessableATSWritebackResult[];
};

export async function runAutoProcessableATSWritebacks(input: {
  now: string;
}): Promise<AutoProcessableATSWritebacksResult> {
  const state = await loadRuntimeStoreState();
  const processableActions = state.atsWritebackActions.filter((action) => {
    if (action.status !== "queued" && action.status !== "retryable_error") {
      return false;
    }

    const connection = state.atsConnections.find(
      (item) =>
        item.id === action.connectionId &&
        item.companyId === action.companyId &&
        item.provider === action.provider,
    );

    return (
      connection?.status === "active" &&
      connection.writebackPolicy?.requiresRecruiterReview === false
    );
  });
  const results: AutoProcessableATSWritebackResult[] = [];

  for (const action of processableActions) {
    try {
      const processed = await processATSWritebackAction({
        writebackActionId: action.id,
        now: input.now,
      });

      results.push({
        writebackActionId: action.id,
        companyId: action.companyId,
        connectionId: action.connectionId,
        provider: action.provider,
        status:
          processed.action.status === "succeeded" ||
          processed.action.status === "skipped"
            ? processed.action.status
            : "failed",
        processed,
        errorMessage:
          processed.action.status === "succeeded"
            ? null
            : processed.attempt.errorMessage,
      });
    } catch (error) {
      results.push({
        writebackActionId: action.id,
        companyId: action.companyId,
        connectionId: action.connectionId,
        provider: action.provider,
        status: "failed",
        processed: null,
        errorMessage:
          error instanceof Error ? error.message : "ATS writeback failed.",
      });
    }
  }

  const succeededActions = results.filter(
    (result) => result.status === "succeeded",
  ).length;
  const skippedActions = results.filter(
    (result) => result.status === "skipped",
  ).length;
  const failedActions = results.length - succeededActions - skippedActions;

  return {
    scannedActions: state.atsWritebackActions.length,
    attemptedActions: results.length,
    succeededActions,
    skippedActions,
    failedActions,
    results,
  };
}
