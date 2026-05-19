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
    connections: [],
    triggerRules: [],
    workflowRequests: [],
    writebackActions: [],
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
    expect(screen.getByText(/Writeback policy/i)).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /ATS-triggered work/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /ATS outbound queue/i }),
    ).toBeInTheDocument();
  });
});
