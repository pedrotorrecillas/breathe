import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import ATSSettingsPage from "@/app/(recruiter)/settings/integrations/ats/page";

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
  getATSAdminSnapshot: vi.fn(async () => ({
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
      { provider: "mock_ats", label: "Mock ATS", implemented: true },
      { provider: "zoho_recruit", label: "Zoho Recruit", implemented: true },
    ],
  })),
}));

describe("ATS settings page", () => {
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
      screen.getAllByRole("option", { name: /Store Associate/i }).length,
    ).toBeGreaterThan(0);
    expect(
      screen.getAllByRole("option", { name: /Breathe Screen/i }).length,
    ).toBeGreaterThan(0);
    expect(
      screen.getByRole("checkbox", {
        name: /Review writebacks before sending/i,
      }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^Test$/i })).toBeInTheDocument();
  });
});
