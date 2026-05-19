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

  it("reports locally skipped writebacks separately from provider failures", async () => {
    const state = await loadRuntimeStoreState();
    state.atsWritebackActions = [
      {
        id: "ats_writeback_archived",
        companyId: "company_1",
        connectionId: "ats_conn_auto",
        provider: "mock_ats",
        actionType: "candidate_note",
        targetExternalCandidateId: "mock_candidate_archived",
        targetExternalApplicationId: "mock_app_archived",
        targetExternalJobId: "mock_job_1",
        targetExternalStageId: null,
        sourceObjectType: "evaluation",
        sourceObjectId: "eval_archived",
        status: "queued",
        idempotencyKey: "key_archived",
        payload: { body: "Archived summary" },
        createdAt: "2026-05-19T10:00:00.000Z",
        updatedAt: "2026-05-19T10:00:00.000Z",
      },
    ];
    state.atsExternalApplications.push({
      id: "ats_app_archived",
      companyId: "company_1",
      connectionId: "ats_conn_auto",
      provider: "mock_ats",
      externalId: "mock_app_archived",
      externalCandidateId: "mock_candidate_archived",
      externalJobId: "mock_job_1",
      externalStageId: "mock_stage_screen",
      externalUrl: null,
      internalCandidateId: "candidate_1",
      internalApplicationId: "app_1",
      internalJobId: "job_1",
      candidateName: "Ana Martin",
      candidateEmail: "ana@example.com",
      candidatePhone: null,
      jobTitle: "Store Associate",
      stageName: "Screening",
      stageCategory: "screening",
      status: "archived_external",
      externalUpdatedAt: "2026-05-19T10:00:00.000Z",
      lastSeenAt: "2026-05-19T10:30:00.000Z",
      rawSnapshot: {},
    });
    await saveRuntimeStoreState(state);

    const result = await runAutoProcessableATSWritebacks({
      now: "2026-05-19T12:00:00.000Z",
    });

    expect(result).toMatchObject({
      scannedActions: 1,
      attemptedActions: 1,
      succeededActions: 0,
      skippedActions: 1,
      failedActions: 0,
    });
    expect(result.results[0]).toMatchObject({
      writebackActionId: "ats_writeback_archived",
      status: "skipped",
      errorMessage:
        "ATS writeback skipped because the target application is archived_external.",
    });
  });
});
