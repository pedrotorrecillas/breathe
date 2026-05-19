import { beforeEach, describe, expect, it } from "vitest";

import { runConfiguredATSSyncs } from "@/lib/ats-integrations/scheduled-sync";
import {
  loadRuntimeStoreState,
  resetRuntimeStoreState,
  saveRuntimeStoreState,
} from "@/lib/db/runtime-store";

describe("ATS scheduled sync runner", () => {
  beforeEach(async () => {
    await resetRuntimeStoreState();
  });

  it("syncs active scheduled connections and skips manual or inactive ones", async () => {
    const state = await loadRuntimeStoreState();
    state.atsConnections.push(
      {
        id: "ats_conn_manual",
        companyId: "company_1",
        provider: "mock_ats",
        status: "active",
        syncMode: "manual",
        displayName: "Manual Mock ATS",
        authMode: "mock",
        secretRef: null,
        externalAccountId: "mock_manual",
        lastSyncAt: null,
        lastError: null,
        createdAt: "2026-05-19T10:00:00.000Z",
        updatedAt: "2026-05-19T10:00:00.000Z",
      },
      {
        id: "ats_conn_scheduled",
        companyId: "company_1",
        provider: "mock_ats",
        status: "active",
        syncMode: "scheduled",
        displayName: "Scheduled Mock ATS",
        authMode: "mock",
        secretRef: null,
        externalAccountId: "mock_scheduled",
        lastSyncAt: null,
        lastError: null,
        createdAt: "2026-05-19T10:00:00.000Z",
        updatedAt: "2026-05-19T10:00:00.000Z",
      },
      {
        id: "ats_conn_webhook_polling",
        companyId: "company_1",
        provider: "mock_ats",
        status: "active",
        syncMode: "webhook_plus_polling",
        displayName: "Webhook plus polling Mock ATS",
        authMode: "mock",
        secretRef: null,
        externalAccountId: "mock_webhook_polling",
        lastSyncAt: null,
        lastError: null,
        createdAt: "2026-05-19T10:00:00.000Z",
        updatedAt: "2026-05-19T10:00:00.000Z",
      },
      {
        id: "ats_conn_error",
        companyId: "company_1",
        provider: "mock_ats",
        status: "error",
        syncMode: "scheduled",
        displayName: "Errored Mock ATS",
        authMode: "mock",
        secretRef: null,
        externalAccountId: "mock_error",
        lastSyncAt: null,
        lastError: "Previous failure",
        createdAt: "2026-05-19T10:00:00.000Z",
        updatedAt: "2026-05-19T10:00:00.000Z",
      },
    );
    await saveRuntimeStoreState(state);

    const result = await runConfiguredATSSyncs({
      now: "2026-05-19T11:00:00.000Z",
    });

    expect(result).toMatchObject({
      scannedConnections: 4,
      attemptedConnections: 2,
      succeededConnections: 2,
      failedConnections: 0,
    });
    expect(result.results.map((item) => item.connectionId)).toEqual([
      "ats_conn_scheduled",
      "ats_conn_webhook_polling",
    ]);

    const after = await loadRuntimeStoreState();
    expect(
      after.atsConnections.find((item) => item.id === "ats_conn_manual")
        ?.lastSyncAt,
    ).toBeNull();
    expect(
      after.atsConnections.find((item) => item.id === "ats_conn_scheduled")
        ?.lastSyncAt,
    ).toBe("2026-05-19T11:00:00.000Z");
    expect(
      after.atsConnections.find((item) => item.id === "ats_conn_webhook_polling")
        ?.lastSyncAt,
    ).toBe("2026-05-19T11:00:00.000Z");
    expect(
      after.atsConnections.find((item) => item.id === "ats_conn_error")
        ?.lastSyncAt,
    ).toBeNull();
  });
});
