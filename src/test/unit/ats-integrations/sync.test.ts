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
});
