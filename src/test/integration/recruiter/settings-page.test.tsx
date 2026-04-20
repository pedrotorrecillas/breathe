import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const mockRequireAuthenticatedRecruiter = vi.fn();
const mockGetRecruiterAccessProfile = vi.fn();
const mockListTeamManagementSnapshot = vi.fn();
const mockRecruiterCanManageTeams = vi.fn();

vi.mock("@/lib/auth/server", () => ({
  requireAuthenticatedRecruiter: () => mockRequireAuthenticatedRecruiter(),
}));

vi.mock("@/lib/team-access", () => ({
  getRecruiterAccessProfile: (...args: unknown[]) =>
    mockGetRecruiterAccessProfile(...args),
  listTeamManagementSnapshot: (...args: unknown[]) =>
    mockListTeamManagementSnapshot(...args),
  recruiterCanManageTeams: (...args: unknown[]) =>
    mockRecruiterCanManageTeams(...args),
}));

vi.mock("@/components/team-management-workspace", () => ({
  TeamManagementWorkspace: () => <div data-testid="team-management-workspace" />,
}));

const recruiterFixture = {
  company: {
    id: "company_1",
    name: "Breathe Recruiting",
  },
  membership: {
    role: "recruiter" as const,
  },
  user: {
    id: "user_1",
    email: "recruiter@breathe.test",
    displayName: "Recruiter Admin",
    authProvider: "google" as const,
  },
};

describe("settings page", () => {
  afterEach(() => {
    cleanup();
  });

  it("shows account info and personal access state for non-admin recruiters", async () => {
    mockRequireAuthenticatedRecruiter.mockResolvedValue(recruiterFixture);
    mockRecruiterCanManageTeams.mockReturnValue(false);
    mockGetRecruiterAccessProfile.mockResolvedValue({
      teams: [{ id: "team_1", name: "AI Opportunity", isDefault: false }],
      jobs: [{ id: "job_1", title: "AI-native Software Engineer" }],
    });

    const { default: SettingsPage } = await import(
      "@/app/(recruiter)/settings/page"
    );

    render(await SettingsPage());

    expect(
      screen.getByRole("heading", { name: /^Settings$/i }),
    ).toBeInTheDocument();
    expect(screen.getByDisplayValue("Recruiter Admin")).toBeInTheDocument();
    expect(screen.getByText(/recruiter@breathe.test/i)).toBeInTheDocument();
    expect(screen.getByText(/AI Opportunity/i)).toBeInTheDocument();
    expect(
      screen.queryByTestId("team-management-workspace"),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText(/only admins and owners can change teams/i),
    ).toBeInTheDocument();
  });

  it("shows embedded team management for admins", async () => {
    mockRequireAuthenticatedRecruiter.mockResolvedValue({
      ...recruiterFixture,
      membership: { role: "owner" as const },
    });
    mockRecruiterCanManageTeams.mockReturnValue(true);
    mockGetRecruiterAccessProfile.mockResolvedValue({
      teams: [{ id: "team_1", name: "Company Admins", isDefault: true }],
      jobs: [{ id: "job_1", title: "AI-native Software Engineer" }],
    });
    mockListTeamManagementSnapshot.mockResolvedValue({
      teams: [],
      users: [],
      jobs: [],
    });

    const { default: SettingsPage } = await import(
      "@/app/(recruiter)/settings/page"
    );

    render(await SettingsPage());

    expect(
      screen.getByTestId("team-management-workspace"),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/only admins and owners can change teams/i),
    ).not.toBeInTheDocument();
  });
});
