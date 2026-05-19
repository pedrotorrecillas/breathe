import { afterEach, describe, expect, it } from "vitest";

import { POST } from "@/app/api/ats/webhooks/[provider]/route";
import {
  loadRuntimeStoreState,
  resetRuntimeStoreState,
  saveRuntimeStoreState,
} from "@/lib/db/runtime-store";

describe("ATS webhook route", () => {
  afterEach(async () => {
    await resetRuntimeStoreState();
  });

  it("rejects unsupported providers", async () => {
    const response = await POST(
      new Request("http://test.local/api/ats/webhooks/unknown", {
        method: "POST",
        body: JSON.stringify({ id: "evt_1" }),
      }),
      { params: Promise.resolve({ provider: "unknown" }) },
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: "Unsupported ATS provider.",
    });
  });

  it("accepts known providers as a stored no-op scaffold", async () => {
    const response = await POST(
      new Request("http://test.local/api/ats/webhooks/mock_ats", {
        method: "POST",
        body: JSON.stringify({ id: "evt_1" }),
      }),
      { params: Promise.resolve({ provider: "mock_ats" }) },
    );

    expect(response.status).toBe(202);
  });

  it("persists and dedupes raw webhook events for active provider connections", async () => {
    const state = await loadRuntimeStoreState();
    state.atsConnections.push({
      id: "ats_conn_1",
      companyId: "company_1",
      provider: "mock_ats",
      status: "active",
      syncMode: "webhook_plus_polling",
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

    const request = () =>
      new Request("http://test.local/api/ats/webhooks/mock_ats", {
        method: "POST",
        body: JSON.stringify({
          id: "evt_1",
          connectionId: "ats_conn_1",
          objectType: "application",
          objectId: "mock_app_1",
          externalJobId: "mock_job_1",
          externalCandidateId: "mock_candidate_1",
          externalStageId: "mock_stage_screen",
        }),
      });

    const first = await POST(request(), {
      params: Promise.resolve({ provider: "mock_ats" }),
    });
    const second = await POST(request(), {
      params: Promise.resolve({ provider: "mock_ats" }),
    });

    expect(first.status).toBe(202);
    await expect(first.json()).resolves.toMatchObject({
      status: "accepted",
      persisted: true,
      duplicate: false,
    });
    expect(second.status).toBe(202);
    await expect(second.json()).resolves.toMatchObject({
      status: "accepted",
      persisted: true,
      duplicate: true,
    });
    const afterWebhook = await loadRuntimeStoreState();
    expect(afterWebhook.atsSyncEvents).toHaveLength(1);
    expect(afterWebhook.atsSyncEvents[0]).toMatchObject({
      companyId: "company_1",
      connectionId: "ats_conn_1",
      provider: "mock_ats",
      eventType: "provider_webhook_received",
      externalObjectType: "application",
      externalObjectId: "mock_app_1",
      externalJobId: "mock_job_1",
      externalCandidateId: "mock_candidate_1",
      externalStageId: "mock_stage_screen",
      processedAt: null,
      payload: expect.objectContaining({
        id: "evt_1",
        connectionId: "ats_conn_1",
      }),
    });
  });

  it("rejects providers that do not support webhooks", async () => {
    const response = await POST(
      new Request("http://test.local/api/ats/webhooks/zoho_recruit", {
        method: "POST",
        body: JSON.stringify({ id: "evt_1" }),
      }),
      { params: Promise.resolve({ provider: "zoho_recruit" }) },
    );

    expect(response.status).toBe(501);
    await expect(response.json()).resolves.toMatchObject({
      error: "ATS provider does not support webhooks.",
    });
  });
});
