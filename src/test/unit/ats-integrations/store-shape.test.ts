import { beforeEach, describe, expect, it } from "vitest";

import {
  loadRuntimeStoreState,
  resetRuntimeStoreState,
  saveRuntimeStoreState,
} from "@/lib/db/runtime-store";

describe("ATS runtime store state", () => {
  beforeEach(async () => {
    await resetRuntimeStoreState();
  });

  it("persists ATS collections in memory mode", async () => {
    const state = await loadRuntimeStoreState();
    expect(state.atsConnections).toEqual([]);
    expect(state.atsSyncEvents).toEqual([]);
    expect(state.atsWritebackActions).toEqual([]);

    state.atsConnections.push({
      id: "ats_conn_1",
      companyId: "company_1",
      provider: "mock_ats",
      status: "active",
      displayName: "Mock ATS",
      authMode: "mock",
      secretRef: null,
      externalAccountId: "mock_account",
      lastSyncAt: null,
      lastError: null,
      createdAt: "2026-05-19T10:00:00.000Z",
      updatedAt: "2026-05-19T10:00:00.000Z",
    });

    await saveRuntimeStoreState(state);

    const reloaded = await loadRuntimeStoreState();
    expect(reloaded.atsConnections).toHaveLength(1);
    expect(reloaded.atsConnections[0].provider).toBe("mock_ats");
  });
});
