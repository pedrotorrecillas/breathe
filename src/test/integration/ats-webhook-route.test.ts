import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { POST } from "@/app/api/ats/webhooks/[provider]/route";
import {
  loadRuntimeStoreState,
  resetRuntimeStoreState,
  saveRuntimeStoreState,
} from "@/lib/db/runtime-store";

describe("ATS webhook route", () => {
  beforeEach(() => {
    vi.stubEnv("ATS_WEBHOOK_SECRET", "webhook-secret");
  });

  afterEach(async () => {
    vi.unstubAllEnvs();
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
        headers: {
          authorization: "Bearer webhook-secret",
        },
        body: JSON.stringify({ id: "evt_1" }),
      }),
      { params: Promise.resolve({ provider: "mock_ats" }) },
    );

    expect(response.status).toBe(202);
  });

  it("rejects webhook requests when the webhook secret is not configured", async () => {
    vi.stubEnv("ATS_WEBHOOK_SECRET", "");

    const response = await POST(
      new Request("http://test.local/api/ats/webhooks/mock_ats", {
        method: "POST",
        headers: {
          authorization: "Bearer webhook-secret",
        },
        body: JSON.stringify({ id: "evt_1" }),
      }),
      { params: Promise.resolve({ provider: "mock_ats" }) },
    );

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toMatchObject({
      error: "ATS webhook secret is not configured.",
    });
  });

  it("rejects webhook requests without the configured secret", async () => {
    const response = await POST(
      new Request("http://test.local/api/ats/webhooks/mock_ats", {
        method: "POST",
        body: JSON.stringify({ id: "evt_1" }),
      }),
      { params: Promise.resolve({ provider: "mock_ats" }) },
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toMatchObject({
      error: "Unauthorized ATS webhook request.",
    });
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
        headers: {
          "x-ats-webhook-secret": "webhook-secret",
        },
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
    const rawWebhookEvents = afterWebhook.atsSyncEvents.filter(
      (event) => event.eventType === "provider_webhook_received",
    );
    expect(rawWebhookEvents).toHaveLength(1);
    expect(rawWebhookEvents[0]).toMatchObject({
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

  it("runs canonical sync for new webhook events on active provider connections", async () => {
    const state = await loadRuntimeStoreState();
    state.jobs.push({
      id: "job_store_associate",
      companyId: "company_1",
      title: "Store Associate",
      summary: "Retail role",
      location: "Madrid",
      status: "active",
      interviewLanguage: "es",
      createdAt: "2026-05-19T09:00:00.000Z",
      publishedAt: "2026-05-19T09:00:00.000Z",
      expiresAt: null,
      publicApplyPath: "/apply/store-associate",
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
    state.atsTriggerRules.push({
      id: "ats_rule_breathe_screen",
      companyId: "company_1",
      connectionId: "ats_conn_1",
      provider: "mock_ats",
      name: "Run Breathe screen",
      enabled: true,
      externalJobId: "mock_job_store_associate",
      externalStageId: "mock_stage_breathe_screen",
      actions: ["import_candidate", "prepare_interview", "queue_interview"],
      requiresRecruiterApproval: false,
      createdAt: "2026-05-19T10:00:00.000Z",
      updatedAt: "2026-05-19T10:00:00.000Z",
    });
    await saveRuntimeStoreState(state);

    const response = await POST(
      new Request("http://test.local/api/ats/webhooks/mock_ats", {
        method: "POST",
        headers: {
          authorization: "Bearer webhook-secret",
        },
        body: JSON.stringify({
          id: "evt_sync_1",
          connectionId: "ats_conn_1",
          objectType: "application",
          objectId: "mock_app_ana_store_associate",
        }),
      }),
      { params: Promise.resolve({ provider: "mock_ats" }) },
    );

    expect(response.status).toBe(202);
    await expect(response.json()).resolves.toMatchObject({
      status: "accepted",
      persisted: true,
      duplicate: false,
      sync: {
        status: "succeeded",
        result: expect.objectContaining({
          createdWorkflowRequests: 1,
        }),
      },
    });
    const afterWebhook = await loadRuntimeStoreState();
    expect(afterWebhook.atsWorkflowRequests[0]).toMatchObject({
      status: "completed",
      externalApplicationId: "mock_app_ana_store_associate",
    });
    expect(afterWebhook.candidates).toHaveLength(1);
    expect(afterWebhook.applications).toHaveLength(1);
    expect(afterWebhook.interviewRuns).toHaveLength(1);
  });

  it("rejects providers that do not support webhooks", async () => {
    const response = await POST(
      new Request("http://test.local/api/ats/webhooks/zoho_recruit", {
        method: "POST",
        headers: {
          authorization: "Bearer webhook-secret",
        },
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
