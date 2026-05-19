import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

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
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

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
      writebackPolicy: {
        reportMode: "candidate_note",
        moveToExternalStageId: null,
        stageMoveMappings: {
          interviewed: "mock_stage_interview_completed",
        },
        requiresRecruiterReview: false,
      },
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

  it("pauses the connection when provider writeback fails with a credential error", async () => {
    vi.stubEnv("ZOHO_RECRUIT_ACCESS_TOKEN", "expired_access_token");
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response(JSON.stringify({ code: "INVALID_TOKEN" }), {
            status: 401,
          }),
      ),
    );
    const state = await loadRuntimeStoreState();
    state.atsConnections = state.atsConnections.map((connection) => ({
      ...connection,
      provider: "zoho_recruit",
      displayName: "Zoho Recruit",
      authMode: "env_token",
      secretRef: "env:ZOHO_RECRUIT_ACCESS_TOKEN",
    }));
    await saveRuntimeStoreState(state);

    const queued = await enqueueATSWriteback({
      companyId: "company_1",
      connectionId: "ats_conn_1",
      provider: "zoho_recruit",
      actionType: "candidate_note",
      targetExternalCandidateId: "58431000000054321",
      targetExternalApplicationId: "58431000000054321",
      targetExternalJobId: null,
      targetExternalStageId: null,
      sourceObjectType: "evaluation",
      sourceObjectId: "eval_zoho_reauth",
      payload: { body: "Breathe interview summary" },
      now: "2026-05-19T12:00:00.000Z",
    });

    const processed = await processATSWritebackAction({
      writebackActionId: queued.id,
      now: "2026-05-19T12:02:00.000Z",
    });

    expect(processed.action.status).toBe("retryable_error");
    expect(processed.attempt.errorMessage).toBe(
      'Zoho Recruit request failed with 401. {"code":"INVALID_TOKEN"}',
    );
    const afterFailure = await loadRuntimeStoreState();
    expect(afterFailure.atsConnections[0]).toMatchObject({
      id: "ats_conn_1",
      status: "paused",
      lastError:
        'needs_reauth: Zoho Recruit request failed with 401. {"code":"INVALID_TOKEN"}',
      updatedAt: "2026-05-19T12:02:00.000Z",
    });
  });

  it("skips queued writebacks when the target ATS application was archived before processing", async () => {
    const state = await loadRuntimeStoreState();
    state.atsExternalApplications.push({
      id: "ats_app_1",
      companyId: "company_1",
      connectionId: "ats_conn_1",
      provider: "mock_ats",
      externalId: "mock_app_1",
      externalCandidateId: "mock_candidate_ana",
      externalJobId: "mock_job_store_associate",
      externalStageId: "mock_stage_breathe_screen",
      externalUrl: null,
      internalCandidateId: "candidate_1",
      internalApplicationId: "app_1",
      internalJobId: "job_1",
      candidateName: "Ana Martin",
      candidateEmail: "ana@example.com",
      candidatePhone: "+34600000000",
      jobTitle: "Store Associate",
      stageName: "Breathe Screen",
      stageCategory: "screening",
      status: "archived_external",
      externalUpdatedAt: "2026-05-19T10:00:00.000Z",
      lastSeenAt: "2026-05-19T10:30:00.000Z",
      rawSnapshot: {},
    });
    await saveRuntimeStoreState(state);

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
      sourceObjectId: "eval_archived",
      payload: { body: "Breathe interview summary" },
      now: "2026-05-19T12:00:00.000Z",
    });

    const processed = await processATSWritebackAction({
      writebackActionId: queued.id,
      now: "2026-05-19T12:01:00.000Z",
    });

    expect(processed.action.status).toBe("skipped");
    expect(processed.attempt).toMatchObject({
      writebackActionId: queued.id,
      status: "skipped",
      providerStatusCode: null,
      errorMessage:
        "ATS writeback skipped because the target application is archived_external.",
    });
    expect(processed.attempt.providerResponse).not.toHaveProperty(
      "externalAccountId",
    );
  });

  it("updates the canonical ATS application after a successful stage move writeback", async () => {
    const state = await loadRuntimeStoreState();
    state.atsExternalStages.push({
      id: "ats_stage_interview_completed",
      companyId: "company_1",
      connectionId: "ats_conn_1",
      provider: "mock_ats",
      externalJobId: "mock_job_store_associate",
      externalId: "mock_stage_interview_completed",
      name: "Interview Completed",
      category: "interview",
      position: 3,
      status: "active",
      lastSeenAt: "2026-05-19T10:00:00.000Z",
      rawSnapshot: {},
    });
    state.atsExternalApplications.push({
      id: "ats_app_1",
      companyId: "company_1",
      connectionId: "ats_conn_1",
      provider: "mock_ats",
      externalId: "mock_app_1",
      externalCandidateId: "mock_candidate_ana",
      externalJobId: "mock_job_store_associate",
      externalStageId: "mock_stage_breathe_screen",
      externalUrl: null,
      internalCandidateId: "candidate_1",
      internalApplicationId: "app_1",
      internalJobId: "job_1",
      candidateName: "Ana Martin",
      candidateEmail: "ana@example.com",
      candidatePhone: "+34600000000",
      jobTitle: "Store Associate",
      stageName: "Breathe Screen",
      stageCategory: "screening",
      status: "active",
      externalUpdatedAt: "2026-05-19T10:00:00.000Z",
      lastSeenAt: "2026-05-19T10:00:00.000Z",
      rawSnapshot: {},
    });
    state.applications.push({
      id: "app_1",
      companyId: "company_1",
      candidateId: "candidate_1",
      jobId: "job_1",
      source: "ats",
      stage: "applicant",
      submittedAt: "2026-05-19T10:00:00.000Z",
      needsHumanReviewAt: null,
      legalAcceptance: null,
      recruiterOutcomeNote: null,
    });
    await saveRuntimeStoreState(state);

    const queued = await enqueueATSWriteback({
      companyId: "company_1",
      connectionId: "ats_conn_1",
      provider: "mock_ats",
      actionType: "application_stage_move",
      targetExternalCandidateId: "mock_candidate_ana",
      targetExternalApplicationId: "mock_app_1",
      targetExternalJobId: "mock_job_store_associate",
      targetExternalStageId: "mock_stage_interview_completed",
      sourceObjectType: "evaluation",
      sourceObjectId: "eval_1",
      payload: { body: "Breathe interview summary" },
      now: "2026-05-19T12:00:00.000Z",
    });

    await processATSWritebackAction({
      writebackActionId: queued.id,
      now: "2026-05-19T12:01:00.000Z",
    });

    const after = await loadRuntimeStoreState();
    expect(after.atsExternalApplications[0]).toMatchObject({
      externalStageId: "mock_stage_interview_completed",
      stageName: "Interview Completed",
      stageCategory: "interview",
      lastSeenAt: "2026-05-19T12:01:00.000Z",
      rawSnapshot: expect.objectContaining({
        previousExternalStageId: "mock_stage_breathe_screen",
        writebackActionId: queued.id,
      }),
    });
    expect(after.applications[0]).toMatchObject({
      stage: "interviewed",
    });
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
