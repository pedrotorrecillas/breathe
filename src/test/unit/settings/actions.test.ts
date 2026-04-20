import { beforeEach, describe, expect, it, vi } from "vitest";

const mockRequireAuthenticatedRecruiter = vi.fn();
const mockUpdateAuthenticatedRecruiterProfile = vi.fn();
const mockUpdateCompanyProfile = vi.fn();
const mockRecruiterCanManageTeams = vi.fn();
const mockRevalidatePath = vi.fn();
const mockAppendAuditEvent = vi.fn();
const mockLoadRuntimeStoreState = vi.fn();
const mockSaveRuntimeStoreState = vi.fn();

vi.mock("next/cache", () => ({
  revalidatePath: (...args: unknown[]) => mockRevalidatePath(...args),
}));

vi.mock("@/lib/auth/server", () => ({
  requireAuthenticatedRecruiter: () => mockRequireAuthenticatedRecruiter(),
}));

vi.mock("@/lib/auth/store", () => ({
  updateAuthenticatedRecruiterProfile: (...args: unknown[]) =>
    mockUpdateAuthenticatedRecruiterProfile(...args),
  updateCompanyProfile: (...args: unknown[]) => mockUpdateCompanyProfile(...args),
}));

vi.mock("@/lib/team-access", () => ({
  recruiterCanManageTeams: (...args: unknown[]) =>
    mockRecruiterCanManageTeams(...args),
}));

vi.mock("@/lib/audit/log", () => ({
  appendAuditEvent: (...args: unknown[]) => mockAppendAuditEvent(...args),
}));

vi.mock("@/lib/db/runtime-store", () => ({
  loadRuntimeStoreState: () => mockLoadRuntimeStoreState(),
  saveRuntimeStoreState: (...args: unknown[]) => mockSaveRuntimeStoreState(...args),
}));

const recruiterFixture = {
  company: {
    id: "company_1",
  },
  user: {
    id: "user_1",
  },
};

describe("settings actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAuthenticatedRecruiter.mockResolvedValue(recruiterFixture);
    mockLoadRuntimeStoreState.mockResolvedValue({
      auditEvents: [],
    });
  });

  it("updates the authenticated recruiter profile", async () => {
    const { idleSettingsActionState, updateProfileAction } = await import(
      "@/app/(recruiter)/settings/actions"
    );
    const formData = new FormData();
    formData.set("displayName", "Pedro Torre");

    const result = await updateProfileAction(idleSettingsActionState, formData);

    expect(mockUpdateAuthenticatedRecruiterProfile).toHaveBeenCalledWith({
      userId: "user_1",
      displayName: "Pedro Torre",
    });
    expect(mockAppendAuditEvent).toHaveBeenCalled();
    expect(mockSaveRuntimeStoreState).toHaveBeenCalled();
    expect(mockRevalidatePath).toHaveBeenCalledWith("/settings");
    expect(result).toEqual({
      status: "success",
      message: "Profile updated.",
    });
  });

  it("rejects company settings updates from non-admin recruiters", async () => {
    mockRecruiterCanManageTeams.mockReturnValue(false);

    const { idleSettingsActionState, updateCompanyAction } = await import(
      "@/app/(recruiter)/settings/actions"
    );
    const formData = new FormData();
    formData.set("companyName", "Breathe Labs");

    const result = await updateCompanyAction(idleSettingsActionState, formData);

    expect(mockUpdateCompanyProfile).not.toHaveBeenCalled();
    expect(result).toEqual({
      status: "error",
      message: "Only admins can update company settings.",
    });
  });

  it("updates company settings for admins", async () => {
    mockRecruiterCanManageTeams.mockReturnValue(true);

    const { idleSettingsActionState, updateCompanyAction } = await import(
      "@/app/(recruiter)/settings/actions"
    );
    const formData = new FormData();
    formData.set("companyName", "Breathe Labs");

    const result = await updateCompanyAction(idleSettingsActionState, formData);

    expect(mockUpdateCompanyProfile).toHaveBeenCalledWith({
      companyId: "company_1",
      companyName: "Breathe Labs",
    });
    expect(mockAppendAuditEvent).toHaveBeenCalled();
    expect(mockSaveRuntimeStoreState).toHaveBeenCalled();
    expect(mockRevalidatePath).toHaveBeenCalledWith("/settings");
    expect(result).toEqual({
      status: "success",
      message: "Company settings updated.",
    });
  });
});
