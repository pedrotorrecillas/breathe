import { beforeEach, describe, expect, it } from "vitest";

import { runAutoProcessableATSWritebacks } from "@/lib/ats-integrations/scheduled-writebacks";
import {
  loadRuntimeStoreState,
  resetRuntimeStoreState,
  saveRuntimeStoreState,
} from "@/lib/db/runtime-store";

describe("ATS scheduled writeback runner", () => {
  beforeEach(async () => {
    await resetRuntimeStoreState();
    const state = await loadRuntimeStoreState();
    state.atsConnections.push(
      {
        id: "ats_conn_auto",
        companyId: "company_1",
        provider: "mock_ats",
        status: "active",
        displayName: "Auto Mock ATS",
        authMode: "mock",
        secretRef: null,
        externalAccountId: "mock_auto",
        lastSyncAt: null,
        lastError: null,
        createdAt: "2026-05-19T10:00:00.000Z",
        updatedAt: "2026-05-19T10:00:00.000Z",
        writebackPolicy: {
          reportMode: "candidate_note",
          moveToExternalStageId: null,
          requiresRecruiterReview: false,
        },
      },
      {
        id: "ats_conn_review",
        companyId: "company_1",
        provider: "mock_ats",
        status: "active",
        displayName: "Review Mock ATS",
        authMode: "mock",
        secretRef: null,
        externalAccountId: "mock_review",
        lastSyncAt: null,
        lastError: null,
        createdAt: "2026-05-19T10:00:00.000Z",
        updatedAt: "2026-05-19T10:00:00.000Z",
        writebackPolicy: {
          reportMode: "candidate_note",
          moveToExternalStageId: null,
          requiresRecruiterReview: true,
        },
      },
    );
    state.atsWritebackActions.push(
      {
        id: "ats_writeback_queued",
        companyId: "company_1",
        connectionId: "ats_conn_auto",
        provider: "mock_ats",
        actionType: "candidate_note",
        targetExternalCandidateId: "mock_candidate_1",
        targetExternalApplicationId: "mock_app_1",
        targetExternalJobId: "mock_job_1",
        targetExternalStageId: null,
        sourceObjectType: "evaluation",
        sourceObjectId: "eval_1",
        status: "queued",
        idempotencyKey: "key_queued",
        payload: { body: "Queued summary" },
        createdAt: "2026-05-19T10:00:00.000Z",
        updatedAt: "2026-05-19T10:00:00.000Z",
      },
      {
        id: "ats_writeback_retryable",
        companyId: "company_1",
        connectionId: "ats_conn_auto",
        provider: "mock_ats",
        actionType: "candidate_note",
        targetExternalCandidateId: "mock_candidate_2",
        targetExternalApplicationId: "mock_app_2",
        targetExternalJobId: "mock_job_1",
        targetExternalStageId: null,
        sourceObjectType: "evaluation",
        sourceObjectId: "eval_2",
        status: "retryable_error",
        idempotencyKey: "key_retryable",
        payload: { body: "Retryable summary" },
        createdAt: "2026-05-19T10:00:00.000Z",
        updatedAt: "2026-05-19T10:01:00.000Z",
      },
      {
        id: "ats_writeback_needs_review",
        companyId: "company_1",
        connectionId: "ats_conn_review",
        provider: "mock_ats",
        actionType: "candidate_note",
        targetExternalCandidateId: "mock_candidate_3",
        targetExternalApplicationId: "mock_app_3",
        targetExternalJobId: "mock_job_1",
        targetExternalStageId: null,
        sourceObjectType: "evaluation",
        sourceObjectId: "eval_3",
        status: "queued",
        idempotencyKey: "key_review",
        payload: { body: "Review summary" },
        createdAt: "2026-05-19T10:00:00.000Z",
        updatedAt: "2026-05-19T10:00:00.000Z",
      },
    );
    await saveRuntimeStoreState(state);
  });

  it("processes queued and retryable writebacks that do not require recruiter review", async () => {
    const result = await runAutoProcessableATSWritebacks({
      now: "2026-05-19T12:00:00.000Z",
    });

    expect(result).toMatchObject({
      scannedActions: 3,
      attemptedActions: 2,
      succeededActions: 2,
      failedActions: 0,
    });
    expect(result.results.map((item) => item.writebackActionId)).toEqual([
      "ats_writeback_queued",
      "ats_writeback_retryable",
    ]);

    const state = await loadRuntimeStoreState();
    expect(
      state.atsWritebackActions.find(
        (item) => item.id === "ats_writeback_queued",
      )?.status,
    ).toBe("succeeded");
    expect(
      state.atsWritebackActions.find(
        (item) => item.id === "ats_writeback_retryable",
      )?.status,
    ).toBe("succeeded");
    expect(
      state.atsWritebackActions.find(
        (item) => item.id === "ats_writeback_needs_review",
      )?.status,
    ).toBe("queued");
    expect(state.atsWritebackAttempts).toHaveLength(2);
  });
});
