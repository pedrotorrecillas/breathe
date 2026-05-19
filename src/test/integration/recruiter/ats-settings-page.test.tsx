import { cleanup, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import ATSSettingsPage from "@/app/(recruiter)/settings/integrations/ats/page";

const atsSnapshotState = vi.hoisted(() => ({
  snapshot: null as unknown,
}));

function buildATSSnapshot() {
  return {
    connections: [
      {
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
        writebackPolicy: {
          reportMode: "status_comment",
          moveToExternalStageId: "mock_stage_breathe_screen",
          requiresRecruiterReview: false,
        },
      },
    ],
    triggerRules: [],
    workflowRequests: [],
    writebackActions: [
      {
        id: "ats_writeback_retry",
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
        status: "retryable_error",
        idempotencyKey: "key",
        payload: { body: "Breathe interview summary" },
        createdAt: "2026-05-19T10:00:00.000Z",
        updatedAt: "2026-05-19T10:00:00.000Z",
      },
    ],
    writebackAttempts: [
      {
        id: "ats_attempt_retry",
        writebackActionId: "ats_writeback_retry",
        attemptedAt: "2026-05-19T10:01:00.000Z",
        status: "retryable_error",
        providerStatusCode: 429,
        providerResponse: { code: "RATE_LIMIT" },
        errorMessage: "Zoho Recruit request failed with 429.",
      },
    ],
    externalJobs: [
      {
        id: "ats_job_1",
        companyId: "company_1",
        connectionId: "ats_conn_1",
        provider: "mock_ats",
        externalId: "mock_job_store_associate",
        externalUrl: null,
        title: "Store Associate",
        status: "active",
        externalUpdatedAt: null,
        lastSeenAt: "2026-05-19T10:00:00.000Z",
        rawSnapshot: {},
      },
    ],
    externalStages: [
      {
        id: "ats_stage_1",
        companyId: "company_1",
        connectionId: "ats_conn_1",
        provider: "mock_ats",
        externalJobId: "mock_job_store_associate",
        externalId: "mock_stage_breathe_screen",
        name: "Breathe Screen",
        category: "screening",
        position: 1,
        status: "active",
        lastSeenAt: "2026-05-19T10:00:00.000Z",
        rawSnapshot: {},
      },
    ],
    availableProviders: [
      {
        provider: "mock_ats",
        label: "Mock ATS",
        implemented: true,
        capabilities: {
          supportsWebhooks: true,
          supportsPolling: true,
          supportsCandidateNotes: true,
          supportsReportLinks: true,
          supportsStageMove: true,
          supportsCustomFields: true,
          supportsAttachments: false,
        },
      },
      {
        provider: "zoho_recruit",
        label: "Zoho Recruit",
        implemented: true,
        capabilities: {
          supportsWebhooks: false,
          supportsPolling: true,
          supportsCandidateNotes: true,
          supportsReportLinks: false,
          supportsStageMove: true,
          supportsCustomFields: true,
          supportsAttachments: false,
        },
      },
    ],
  };
}

vi.mock("@/lib/auth/server", () => ({
  requireAuthenticatedRecruiter: vi.fn(async () => ({
    user: {
      id: "user_1",
      displayName: "Recruiter Admin",
      email: "admin@example.com",
      authProvider: "password",
    },
    company: {
      id: "company_1",
      slug: "nacar",
      name: "Nacar",
      defaultWorkspaceKey: null,
    },
    membership: {
      id: "membership_1",
      companyId: "company_1",
      userId: "user_1",
      role: "owner",
      workspaceKey: null,
    },
    session: {
      id: "session_1",
      userId: "user_1",
      companyId: "company_1",
      membershipId: "membership_1",
      tokenHash: "hash",
      activeWorkspaceKey: null,
      expiresAt: "2026-05-20T10:00:00.000Z",
      createdAt: "2026-05-19T10:00:00.000Z",
      lastSeenAt: "2026-05-19T10:00:00.000Z",
    },
  })),
}));

vi.mock("@/lib/team-access", () => ({
  recruiterCanManageTeams: vi.fn(() => true),
}));

vi.mock("@/lib/ats-integrations/connections", () => ({
  getATSAdminSnapshot: vi.fn(async () => atsSnapshotState.snapshot),
}));

describe("ATS settings page", () => {
  beforeEach(() => {
    cleanup();
    atsSnapshotState.snapshot = buildATSSnapshot();
  });

  it("renders admin controls for ATS integrations", async () => {
    render(await ATSSettingsPage());

    expect(
      screen.getByRole("heading", { name: /ATS integrations/i }),
    ).toBeInTheDocument();
    expect(screen.getAllByText(/Zoho Recruit/i).length).toBeGreaterThan(0);
    expect(
      screen.getByRole("button", { name: /Add Zoho Recruit/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Stage triggers/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Writeback policy/i).length).toBeGreaterThan(0);
    expect(
      screen.getByRole("heading", { name: /ATS-triggered work/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /ATS outbound queue/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /^Retry$/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Last attempt: retryable_error · Zoho Recruit request failed with 429\./i),
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole("option", { name: /Store Associate/i }).length,
    ).toBeGreaterThan(0);
    expect(
      screen.getAllByRole("option", { name: /Breathe Screen/i }).length,
    ).toBeGreaterThan(0);
    expect(
      screen.getByRole("checkbox", {
        name: /Review writebacks before sending/i,
      }),
    ).not.toBeChecked();
    expect(screen.getByLabelText("Report writeback mode")).toHaveValue(
      "status_comment",
    );
    expect(screen.getByLabelText("Writeback target stage")).toHaveValue(
      "mock_stage_breathe_screen",
    );
    expect(screen.getByRole("button", { name: /^Test$/i })).toBeInTheDocument();
  });

  it("does not offer candidate note writeback when the selected provider does not support notes", async () => {
    const snapshot = buildATSSnapshot();
    snapshot.connections[0].writebackPolicy = {
      reportMode: "disabled",
      moveToExternalStageId: null,
      requiresRecruiterReview: true,
    };
    snapshot.availableProviders[0].capabilities.supportsCandidateNotes = false;
    atsSnapshotState.snapshot = snapshot;

    render(await ATSSettingsPage());

    expect(
      screen.queryByRole("option", { name: "Candidate note" }),
    ).not.toBeInTheDocument();
    expect(screen.getByLabelText("Report writeback mode")).toHaveValue(
      "disabled",
    );
  });

  it("does not offer webhook sync for providers without webhook support", async () => {
    const snapshot = buildATSSnapshot();
    snapshot.connections[0] = {
      ...snapshot.connections[0],
      provider: "zoho_recruit",
      displayName: "Zoho Recruit demo",
      syncMode: "scheduled",
    };
    atsSnapshotState.snapshot = snapshot;

    render(await ATSSettingsPage());

    expect(
      screen.getByLabelText("Sync mode for Zoho Recruit"),
    ).toHaveValue("scheduled");
    expect(
      screen.queryByRole("option", { name: "Webhook plus polling" }),
    ).not.toBeInTheDocument();
  });
});
