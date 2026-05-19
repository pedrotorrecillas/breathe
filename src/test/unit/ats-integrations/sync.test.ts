import { beforeEach, describe, expect, it } from "vitest";

import { runATSSync } from "@/lib/ats-integrations/sync";
import {
  loadRuntimeStoreState,
  resetRuntimeStoreState,
  saveRuntimeStoreState,
} from "@/lib/db/runtime-store";

describe("ATS sync", () => {
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
    state.atsTriggerRules.push({
      id: "ats_rule_1",
      companyId: "company_1",
      connectionId: "ats_conn_1",
      provider: "mock_ats",
      name: "Run Breathe screen",
      enabled: true,
      externalJobId: "mock_job_store_associate",
      externalStageId: "mock_stage_breathe_screen",
      actions: ["import_candidate", "prepare_interview"],
      requiresRecruiterApproval: true,
      createdAt: "2026-05-19T10:00:00.000Z",
      updatedAt: "2026-05-19T10:00:00.000Z",
    });
    await saveRuntimeStoreState(state);
  });

  it("imports external records and creates idempotent sync events", async () => {
    const first = await runATSSync({
      companyId: "company_1",
      connectionId: "ats_conn_1",
      now: "2026-05-19T11:00:00.000Z",
    });
    expect(first.createdEvents).toBeGreaterThan(0);
    expect(first.createdWorkflowRequests).toBe(1);

    const afterFirst = await loadRuntimeStoreState();
    expect(afterFirst.atsExternalJobs).toHaveLength(1);
    expect(afterFirst.atsExternalCandidates).toHaveLength(1);
    expect(afterFirst.atsExternalApplications).toHaveLength(1);
    expect(
      afterFirst.atsSyncEvents.some(
        (event) => event.eventType === "application_seen",
      ),
    ).toBe(true);
    expect(afterFirst.atsWorkflowRequests).toHaveLength(1);
    expect(afterFirst.atsWorkflowRequests[0]).toMatchObject({
      atsTriggerRuleId: "ats_rule_1",
      externalApplicationId: "mock_app_ana_store_associate",
      requestedActions: ["import_candidate", "prepare_interview"],
      requiresRecruiterApproval: true,
      status: "queued",
    });
    expect(
      afterFirst.atsSyncEvents.find(
        (event) =>
          event.eventType === "application_seen" &&
          event.externalObjectId === "mock_app_ana_store_associate",
      )?.processedAt,
    ).toBe("2026-05-19T11:00:00.000Z");

    const second = await runATSSync({
      companyId: "company_1",
      connectionId: "ats_conn_1",
      now: "2026-05-19T11:01:00.000Z",
    });
    expect(second.createdEvents).toBe(0);
    expect(second.createdWorkflowRequests).toBe(0);
    const afterSecond = await loadRuntimeStoreState();
    expect(afterSecond.atsWorkflowRequests).toHaveLength(1);
  });

  it("emits a stage-changed event when a known application moves into a configured stage", async () => {
    const state = await loadRuntimeStoreState();
    state.atsExternalApplications.push({
      id: "ats_application_ats_conn_1_mock_app_ana_store_associate",
      companyId: "company_1",
      connectionId: "ats_conn_1",
      provider: "mock_ats",
      externalId: "mock_app_ana_store_associate",
      externalCandidateId: "mock_candidate_ana",
      externalJobId: "mock_job_store_associate",
      externalStageId: "mock_stage_new",
      externalUrl:
        "https://mock.example/applications/mock_app_ana_store_associate",
      internalCandidateId: "candidate_existing",
      internalApplicationId: "application_existing",
      internalJobId: "job_existing",
      candidateName: "Ana Gomez",
      candidateEmail: "ana@example.com",
      candidatePhone: "+34600000000",
      jobTitle: "Store Associate",
      stageName: "New",
      stageCategory: "new",
      status: "active",
      externalUpdatedAt: "2026-05-19T08:00:00.000Z",
      lastSeenAt: "2026-05-19T10:00:00.000Z",
      rawSnapshot: { providerStageId: "mock_stage_new" },
    });
    await saveRuntimeStoreState(state);

    const result = await runATSSync({
      companyId: "company_1",
      connectionId: "ats_conn_1",
      now: "2026-05-19T11:00:00.000Z",
    });

    expect(result.createdWorkflowRequests).toBe(1);
    const afterSync = await loadRuntimeStoreState();
    const stageChangedEvent = afterSync.atsSyncEvents.find(
      (event) =>
        event.eventType === "application_stage_changed" &&
        event.externalObjectId === "mock_app_ana_store_associate",
    );
    expect(stageChangedEvent).toMatchObject({
      externalStageId: "mock_stage_breathe_screen",
      processedAt: "2026-05-19T11:00:00.000Z",
      payload: expect.objectContaining({
        previousExternalStageId: "mock_stage_new",
        externalStageId: "mock_stage_breathe_screen",
      }),
    });
    expect(afterSync.atsWorkflowRequests).toHaveLength(1);
    expect(afterSync.atsWorkflowRequests[0]).toMatchObject({
      atsSyncEventId: stageChangedEvent?.id,
      externalApplicationId: "mock_app_ana_store_associate",
    });
    expect(
      afterSync.atsExternalApplications.find(
        (application) =>
          application.externalId === "mock_app_ana_store_associate",
      ),
    ).toMatchObject({
      externalStageId: "mock_stage_breathe_screen",
      internalCandidateId: "candidate_existing",
      internalApplicationId: "application_existing",
      internalJobId: "job_existing",
    });
  });

  it("auto-processes workflow requests when the trigger rule does not require approval", async () => {
    const state = await loadRuntimeStoreState();
    state.jobs.push({
      id: "job_1",
      companyId: "company_1",
      title: "Store Associate",
      summary: "Retail role",
      location: "Madrid",
      status: "active",
      interviewLanguage: "es",
      createdAt: "2026-05-19T09:00:00.000Z",
      publishedAt: "2026-05-19T09:00:00.000Z",
      expiresAt: null,
      publicApplyPath: "/apply/job_1",
      pipeline: {
        applicants: 0,
        interviewed: 0,
        shortlisted: 0,
        hired: 0,
        rejected: 0,
      },
      requirements: [],
      interviewLimits: {
        maxInterviews: null,
        outstandingCap: null,
        greatCap: null,
      },
    });
    state.atsTriggerRules = state.atsTriggerRules.map((rule) => ({
      ...rule,
      actions: ["import_candidate", "prepare_interview", "queue_interview"],
      requiresRecruiterApproval: false,
    }));
    await saveRuntimeStoreState(state);

    const result = await runATSSync({
      companyId: "company_1",
      connectionId: "ats_conn_1",
      now: "2026-05-19T11:00:00.000Z",
    });

    expect(result.createdWorkflowRequests).toBe(1);
    const afterSync = await loadRuntimeStoreState();
    expect(afterSync.atsWorkflowRequests[0]).toMatchObject({
      status: "completed",
      internalCandidateId: expect.any(String),
      internalApplicationId: expect.any(String),
    });
    expect(afterSync.candidates).toHaveLength(1);
    expect(afterSync.applications).toHaveLength(1);
    expect(afterSync.interviewPreparationPackages).toHaveLength(1);
    expect(afterSync.interviewRuns).toHaveLength(1);
    expect(afterSync.interviewRuns[0]).toMatchObject({
      status: "queued",
      provider: "happyrobot",
    });
  });

  it("marks the connection as errored when provider sync fails", async () => {
    const state = await loadRuntimeStoreState();
    state.atsConnections = state.atsConnections.map((connection) =>
      connection.id === "ats_conn_1"
        ? {
            ...connection,
            provider: "recruitee",
            displayName: "Recruitee",
            lastError: null,
          }
        : connection,
    );
    await saveRuntimeStoreState(state);

    await expect(
      runATSSync({
        companyId: "company_1",
        connectionId: "ats_conn_1",
        now: "2026-05-19T11:00:00.000Z",
      }),
    ).rejects.toThrow("ATS provider recruitee is not implemented yet.");

    const afterFailure = await loadRuntimeStoreState();
    expect(afterFailure.atsConnections[0]).toMatchObject({
      id: "ats_conn_1",
      status: "error",
      lastSyncAt: null,
      lastError: "ATS provider recruitee is not implemented yet.",
      updatedAt: "2026-05-19T11:00:00.000Z",
    });
  });
});
