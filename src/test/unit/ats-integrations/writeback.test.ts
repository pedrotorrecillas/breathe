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
      externalAccountId: "mock_account_from_connection",
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
    expect(state.atsWritebackAttempts[0].providerResponse).toMatchObject({
      externalAccountId: "mock_account_from_connection",
    });
  });

  it("records retryable errors when provider writeback dispatch fails", async () => {
    const state = await loadRuntimeStoreState();
    state.atsConnections = state.atsConnections.map((connection) => ({
      ...connection,
      provider: "recruitee",
      displayName: "Recruitee",
    }));
    await saveRuntimeStoreState(state);

    const queued = await enqueueATSWriteback({
      companyId: "company_1",
      connectionId: "ats_conn_1",
      provider: "recruitee",
      actionType: "candidate_note",
      targetExternalCandidateId: "candidate_1",
      targetExternalApplicationId: "application_1",
      targetExternalJobId: "job_1",
      targetExternalStageId: null,
      sourceObjectType: "evaluation",
      sourceObjectId: "eval_1",
      payload: { body: "Breathe interview summary" },
      now: "2026-05-19T12:00:00.000Z",
    });

    const processed = await processATSWritebackAction({
      writebackActionId: queued.id,
      now: "2026-05-19T12:02:00.000Z",
    });

    expect(processed.action.status).toBe("retryable_error");
    expect(processed.attempt).toMatchObject({
      writebackActionId: queued.id,
      status: "retryable_error",
      providerStatusCode: null,
      errorMessage: "ATS provider recruitee is not implemented yet.",
    });
    const afterFailure = await loadRuntimeStoreState();
    expect(afterFailure.atsWritebackActions[0]).toMatchObject({
      id: queued.id,
      status: "retryable_error",
      updatedAt: "2026-05-19T12:02:00.000Z",
    });
    expect(afterFailure.atsWritebackAttempts).toHaveLength(1);
  });

  it("does not dispatch writeback actions that already reached a terminal status", async () => {
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
      sourceObjectId: "eval_terminal",
      payload: { body: "Breathe interview summary" },
      now: "2026-05-19T12:00:00.000Z",
    });

    await processATSWritebackAction({
      writebackActionId: queued.id,
      now: "2026-05-19T12:01:00.000Z",
    });

    await expect(
      processATSWritebackAction({
        writebackActionId: queued.id,
        now: "2026-05-19T12:02:00.000Z",
      }),
    ).rejects.toThrow("ATS writeback action is not queued for processing.");

    const state = await loadRuntimeStoreState();
    expect(state.atsWritebackActions[0].status).toBe("succeeded");
    expect(state.atsWritebackAttempts).toHaveLength(1);
  });
});
