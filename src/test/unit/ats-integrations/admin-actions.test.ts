import { beforeEach, describe, expect, it, vi } from "vitest";

const mockRequireAuthenticatedRecruiter = vi.fn();
const mockRecruiterCanManageTeams = vi.fn();
const mockAppendAuditEvent = vi.fn();
const mockLoadRuntimeStoreState = vi.fn();
const mockSaveRuntimeStoreState = vi.fn();
const mockRevalidatePath = vi.fn();
const mockProcessATSWorkflowRequest = vi.fn();

vi.mock("next/cache", () => ({
  revalidatePath: (...args: unknown[]) => mockRevalidatePath(...args),
}));

vi.mock("@/lib/auth/server", () => ({
  requireAuthenticatedRecruiter: () => mockRequireAuthenticatedRecruiter(),
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
  saveRuntimeStoreState: (...args: unknown[]) =>
    mockSaveRuntimeStoreState(...args),
}));

vi.mock("@/lib/ats-integrations/workflow-requests", () => ({
  processATSWorkflowRequest: (...args: unknown[]) =>
    mockProcessATSWorkflowRequest(...args),
}));

const recruiterFixture = {
  company: {
    id: "company_1",
  },
  user: {
    id: "user_1",
  },
};

describe("ATS admin actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAuthenticatedRecruiter.mockResolvedValue(recruiterFixture);
    mockRecruiterCanManageTeams.mockReturnValue(true);
    mockLoadRuntimeStoreState.mockResolvedValue({
      atsConnections: [
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
      atsTriggerRules: [],
      atsWorkflowRequests: [
        {
          id: "ats_workflow_1",
          companyId: "company_1",
          atsSyncEventId: "ats_evt_1",
          atsTriggerRuleId: "ats_rule_1",
          externalApplicationId: "mock_app_1",
          internalCandidateId: null,
          internalApplicationId: null,
          requestedActions: ["import_candidate"],
          requiresRecruiterApproval: true,
          status: "queued",
          createdAt: "2026-05-19T10:00:00.000Z",
          updatedAt: "2026-05-19T10:00:00.000Z",
        },
      ],
      auditEvents: [],
    });
    mockProcessATSWorkflowRequest.mockResolvedValue({
      status: "completed",
      request: {
        id: "ats_workflow_1",
        companyId: "company_1",
      },
      candidateId: "ats_cand_1",
      applicationId: "ats_app_1",
    });
  });

  it("saves configurable trigger actions and recruiter approval", async () => {
    const { saveATSTriggerRuleAction } =
      await import("@/app/(recruiter)/settings/integrations/ats/actions");
    const formData = new FormData();
    formData.set("connectionId", "ats_conn_1");
    formData.set("externalStageId", "Breathe Screen");
    formData.append("actions", "prepare_interview");
    formData.append("actions", "dispatch_interview");

    await saveATSTriggerRuleAction(formData);

    const savedState = mockSaveRuntimeStoreState.mock.calls[0][0];
    expect(savedState.atsTriggerRules).toHaveLength(1);
    expect(savedState.atsTriggerRules[0]).toMatchObject({
      externalStageId: "Breathe Screen",
      actions: ["prepare_interview", "dispatch_interview"],
      requiresRecruiterApproval: false,
    });
    expect(mockRevalidatePath).toHaveBeenCalledWith(
      "/settings/integrations/ats",
    );
  });

  it("rejects trigger rules without configured actions", async () => {
    const { saveATSTriggerRuleAction } =
      await import("@/app/(recruiter)/settings/integrations/ats/actions");
    const formData = new FormData();
    formData.set("connectionId", "ats_conn_1");
    formData.set("externalStageId", "Breathe Screen");

    await expect(saveATSTriggerRuleAction(formData)).rejects.toThrow(
      "Choose at least one Breathe action for the ATS trigger.",
    );
    expect(mockSaveRuntimeStoreState).not.toHaveBeenCalled();
  });

  it("approves and processes queued ATS workflow requests", async () => {
    const { approveATSWorkflowRequestAction } =
      await import("@/app/(recruiter)/settings/integrations/ats/actions");
    const formData = new FormData();
    formData.set("workflowRequestId", "ats_workflow_1");

    await approveATSWorkflowRequestAction(formData);

    expect(mockProcessATSWorkflowRequest).toHaveBeenCalledWith({
      workflowRequestId: "ats_workflow_1",
      now: expect.any(String),
      approved: true,
    });
    expect(mockAppendAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "ats.workflow_request_processed",
        targetId: "ats_workflow_1",
      }),
    );
    expect(mockRevalidatePath).toHaveBeenCalledWith(
      "/settings/integrations/ats",
    );
  });
});
