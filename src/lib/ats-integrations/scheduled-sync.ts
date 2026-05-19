import { runATSSync, type RunATSSyncResult } from "@/lib/ats-integrations/sync";
import { loadRuntimeStoreState } from "@/lib/db/runtime-store";

export type ConfiguredATSSyncConnectionResult = {
  connectionId: string;
  companyId: string;
  provider: string;
  status: "succeeded" | "failed";
  result: RunATSSyncResult | null;
  errorMessage: string | null;
};

export type ConfiguredATSSyncResult = {
  scannedConnections: number;
  attemptedConnections: number;
  succeededConnections: number;
  failedConnections: number;
  results: ConfiguredATSSyncConnectionResult[];
};

export async function runConfiguredATSSyncs(input: {
  now: string;
}): Promise<ConfiguredATSSyncResult> {
  const state = await loadRuntimeStoreState();
  const syncableConnections = state.atsConnections.filter(
    (connection) =>
      connection.status === "active" &&
      (connection.syncMode === "scheduled" ||
        connection.syncMode === "webhook_plus_polling"),
  );
  const results: ConfiguredATSSyncConnectionResult[] = [];

  for (const connection of syncableConnections) {
    try {
      const result = await runATSSync({
        companyId: connection.companyId,
        connectionId: connection.id,
        now: input.now,
      });

      results.push({
        connectionId: connection.id,
        companyId: connection.companyId,
        provider: connection.provider,
        status: "succeeded",
        result,
        errorMessage: null,
      });
    } catch (error) {
      results.push({
        connectionId: connection.id,
        companyId: connection.companyId,
        provider: connection.provider,
        status: "failed",
        result: null,
        errorMessage:
          error instanceof Error ? error.message : "ATS sync failed.",
      });
    }
  }

  const succeededConnections = results.filter(
    (result) => result.status === "succeeded",
  ).length;
  const failedConnections = results.length - succeededConnections;

  return {
    scannedConnections: state.atsConnections.length,
    attemptedConnections: results.length,
    succeededConnections,
    failedConnections,
    results,
  };
}
