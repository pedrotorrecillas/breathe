import { beforeEach, describe, expect, it, vi } from "vitest";

const mockRequireAuthenticatedRecruiter = vi.fn();
const mockRecruiterCanManageTeams = vi.fn();
const mockAppendAuditEvent = vi.fn();
const mockLoadRuntimeStoreState = vi.fn();
const mockSaveRuntimeStoreState = vi.fn();
const mockRevalidatePath = vi.fn();
const mockProcessATSWorkflowRequest = vi.fn();
const mockProcessATSWritebackAction = vi.fn();
const mockValidateConnection = vi.fn();

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

vi.mock("@/lib/ats-integrations/writeback", () => ({
  processATSWritebackAction: (...args: unknown[]) =>
    mockProcessATSWritebackAction(...args),
}));

vi.mock("@/lib/ats-integrations/registry", () => ({
  getATSAdapter: () => ({
    validateConnection: (...args: unknown[]) => mockValidateConnection(...args),
  }),
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
      atsWritebackActions: [
        {
          id: "ats_writeback_1",
          companyId: "company_1",
          connectionId: "ats_conn_1",
          provider: "mock_ats",
          actionType: "candidate_note",
          targetExternalCandidateId: "mock_candidate_ana",
          targetExternalApplicationId: "mock_app_1",
          targetExternalJobId: "mock_job_1",
          targetExternalStageId: null,
          sourceObjectType: "evaluation",
          sourceObjectId: "eval_1",
          status: "queued",
          idempotencyKey: "key",
          payload: { summary: "Great: 86" },
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
    mockProcessATSWritebackAction.mockResolvedValue({
      action: {
        id: "ats_writeback_1",
        companyId: "company_1",
        status: "succeeded",
      },
      attempt: {
        id: "ats_attempt_1",
        status: "succeeded",
      },
    });
    mockValidateConnection.mockResolvedValue({
      ok: true,
      externalAccountId: "mock_account_verified",
      message: "Mock ATS connection is available.",
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

  it("keeps separate trigger rules for the same stage on different external jobs", async () => {
    const state = await mockLoadRuntimeStoreState();
    state.atsTriggerRules = [
      {
        id: "ats_rule_ats_conn_1_Breathe_Screen",
        companyId: "company_1",
        connectionId: "ats_conn_1",
        provider: "mock_ats",
        name: "Run Breathe at Breathe Screen",
        enabled: true,
        externalJobId: "mock_job_1",
        externalStageId: "Breathe Screen",
        actions: ["prepare_interview"],
        requiresRecruiterApproval: true,
        createdAt: "2026-05-19T10:00:00.000Z",
        updatedAt: "2026-05-19T10:00:00.000Z",
      },
    ];
    mockLoadRuntimeStoreState.mockResolvedValue(state);
    const { saveATSTriggerRuleAction } =
      await import("@/app/(recruiter)/settings/integrations/ats/actions");
    const formData = new FormData();
    formData.set("connectionId", "ats_conn_1");
    formData.set("externalStageId", "Breathe Screen");
    formData.set("externalJobId", "mock_job_2");
    formData.append("actions", "queue_interview");

    await saveATSTriggerRuleAction(formData);

    const savedState = mockSaveRuntimeStoreState.mock.calls[0][0];
    expect(savedState.atsTriggerRules).toHaveLength(2);
    expect(savedState.atsTriggerRules).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          externalJobId: "mock_job_1",
          externalStageId: "Breathe Screen",
          actions: ["prepare_interview"],
        }),
        expect.objectContaining({
          externalJobId: "mock_job_2",
          externalStageId: "Breathe Screen",
          actions: ["queue_interview"],
        }),
      ]),
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

  it("dispatches queued ATS writeback actions", async () => {
    const { processATSWritebackActionAction } =
      await import("@/app/(recruiter)/settings/integrations/ats/actions");
    const formData = new FormData();
    formData.set("writebackActionId", "ats_writeback_1");

    await processATSWritebackActionAction(formData);

    expect(mockProcessATSWritebackAction).toHaveBeenCalledWith({
      writebackActionId: "ats_writeback_1",
      now: expect.any(String),
    });
    expect(mockAppendAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "ats.writeback_action_processed",
        targetId: "ats_writeback_1",
      }),
    );
    expect(mockRevalidatePath).toHaveBeenCalledWith(
      "/settings/integrations/ats",
    );
  });

  it("tests an ATS connection and stores the provider health result", async () => {
    const { testATSConnectionAction } =
      await import("@/app/(recruiter)/settings/integrations/ats/actions");
    const formData = new FormData();
    formData.set("connectionId", "ats_conn_1");

    await testATSConnectionAction(formData);

    expect(mockValidateConnection).toHaveBeenCalledWith({
      connection: expect.objectContaining({ id: "ats_conn_1" }),
    });
    const savedState = mockSaveRuntimeStoreState.mock.calls[0][0];
    expect(savedState.atsConnections[0]).toMatchObject({
      id: "ats_conn_1",
      status: "active",
      externalAccountId: "mock_account_verified",
      lastError: null,
    });
    expect(mockAppendAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "ats.connection_tested",
        targetId: "ats_conn_1",
        metadata: expect.objectContaining({
          ok: true,
          message: "Mock ATS connection is available.",
        }),
      }),
    );
    expect(mockRevalidatePath).toHaveBeenCalledWith(
      "/settings/integrations/ats",
    );
  });

  it("stores provider validation failures on the connection", async () => {
    mockValidateConnection.mockRejectedValue(
      new Error("ZOHO_RECRUIT_ACCESS_TOKEN is required."),
    );
    const { testATSConnectionAction } =
      await import("@/app/(recruiter)/settings/integrations/ats/actions");
    const formData = new FormData();
    formData.set("connectionId", "ats_conn_1");

    await testATSConnectionAction(formData);

    const savedState = mockSaveRuntimeStoreState.mock.calls[0][0];
    expect(savedState.atsConnections[0]).toMatchObject({
      id: "ats_conn_1",
      status: "error",
      lastError: "ZOHO_RECRUIT_ACCESS_TOKEN is required.",
    });
    expect(mockAppendAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "ats.connection_tested",
        targetId: "ats_conn_1",
        metadata: expect.objectContaining({
          ok: false,
          message: "ZOHO_RECRUIT_ACCESS_TOKEN is required.",
        }),
      }),
    );
    expect(mockRevalidatePath).toHaveBeenCalledWith(
      "/settings/integrations/ats",
    );
  });

  it("saves writeback policy review settings from admin", async () => {
    const { saveATSWritebackPolicyAction } =
      await import("@/app/(recruiter)/settings/integrations/ats/actions");
    const formData = new FormData();
    formData.set("connectionId", "ats_conn_1");
    formData.set("reportMode", "status_comment");
    formData.set("moveToExternalStageId", "mock_stage_shortlisted");

    await saveATSWritebackPolicyAction(formData);

    const savedState = mockSaveRuntimeStoreState.mock.calls[0][0];
    expect(savedState.atsConnections[0].writebackPolicy).toEqual({
      reportMode: "status_comment",
      moveToExternalStageId: "mock_stage_shortlisted",
      requiresRecruiterReview: false,
    });
    expect(mockAppendAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "ats.writeback_policy_saved",
        metadata: expect.objectContaining({
          requiresRecruiterReview: false,
        }),
      }),
    );
  });
});
