import { beforeEach, describe, expect, it } from "vitest";

import {
  enqueueATSWriteback,
  processATSWritebackAction,
} from "@/lib/ats-integrations/writeback";
import {
  loadRuntimeStoreState,
  resetRuntimeStoreState,
  saveRuntimeStoreState,
} from "@/lib/db/runtime-store";

describe("ATS writeback queue", () => {
  beforeEach(async () => {
    await resetRuntimeStoreState();
    const state = await loadRuntimeStoreState();
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
  });

  it("enqueues idempotently and records provider attempts", async () => {
    const queued = await enqueueATSWriteback({
      companyId: "company_1",
      connectionId: "ats_conn_1",
      provider: "mock_ats",
      actionType: "candidate_note",
      targetExternalCandidateId: "mock_candidate_ana",
      targetExternalApplicationId: "mock_app_1",
      targetExternalJobId: "mock_job_store_associate",
      targetExternalStageId: null,
      sourceObjectType: "evaluation",
      sourceObjectId: "eval_1",
      payload: { body: "Breathe interview summary" },
      now: "2026-05-19T12:00:00.000Z",
    });

    const duplicate = await enqueueATSWriteback({
      companyId: "company_1",
      connectionId: "ats_conn_1",
      provider: "mock_ats",
      actionType: "candidate_note",
      targetExternalCandidateId: "mock_candidate_ana",
      targetExternalApplicationId: "mock_app_1",
      targetExternalJobId: "mock_job_store_associate",
      targetExternalStageId: null,
      sourceObjectType: "evaluation",
      sourceObjectId: "eval_1",
      payload: { body: "Breathe interview summary" },
      now: "2026-05-19T12:00:01.000Z",
    });

    expect(duplicate.id).toBe(queued.id);

    await processATSWritebackAction({
      writebackActionId: queued.id,
      now: "2026-05-19T12:01:00.000Z",
    });

    const state = await loadRuntimeStoreState();
    expect(state.atsWritebackActions).toHaveLength(1);
    expect(state.atsWritebackActions[0].status).toBe("succeeded");
    expect(state.atsWritebackAttempts).toHaveLength(1);
  });
});
