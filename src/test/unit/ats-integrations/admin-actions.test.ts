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
let mockAdapterCapabilities = {
  supportsWebhooks: true,
  supportsPolling: true,
  supportsCandidateNotes: true,
  supportsReportLinks: true,
  supportsStageMove: true,
  supportsCustomFields: true,
  supportsAttachments: false,
};

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
    capabilities: mockAdapterCapabilities,
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
    mockAdapterCapabilities = {
      supportsWebhooks: true,
      supportsPolling: true,
      supportsCandidateNotes: true,
      supportsReportLinks: true,
      supportsStageMove: true,
      supportsCustomFields: true,
      supportsAttachments: false,
    };
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

  it("rejects trigger stages from another ATS connection", async () => {
    const state = await mockLoadRuntimeStoreState();
    state.atsExternalStages = [
      {
        id: "ats_stage_own",
        companyId: "company_1",
        connectionId: "ats_conn_1",
        provider: "mock_ats",
        externalJobId: "mock_job_1",
        externalId: "mock_stage_screen",
        name: "Screen",
        category: "screening",
        position: 1,
        status: "active",
        lastSeenAt: "2026-05-19T10:00:00.000Z",
        rawSnapshot: {},
      },
      {
        id: "ats_stage_other_connection",
        companyId: "company_1",
        connectionId: "ats_conn_2",
        provider: "mock_ats",
        externalJobId: "mock_job_2",
        externalId: "mock_stage_offer",
        name: "Offer",
        category: "offer",
        position: 4,
        status: "active",
        lastSeenAt: "2026-05-19T10:00:00.000Z",
        rawSnapshot: {},
      },
    ];
    mockLoadRuntimeStoreState.mockResolvedValue(state);
    const { saveATSTriggerRuleAction } =
      await import("@/app/(recruiter)/settings/integrations/ats/actions");
    const formData = new FormData();
    formData.set("connectionId", "ats_conn_1");
    formData.set("externalStageId", "mock_stage_offer");
    formData.append("actions", "queue_interview");

    await expect(saveATSTriggerRuleAction(formData)).rejects.toThrow(
      "Choose a trigger stage from the selected ATS connection.",
    );
    expect(mockSaveRuntimeStoreState).not.toHaveBeenCalled();
  });

  it("rejects trigger jobs from another ATS connection", async () => {
    const state = await mockLoadRuntimeStoreState();
    state.atsExternalJobs = [
      {
        id: "ats_job_own",
        companyId: "company_1",
        connectionId: "ats_conn_1",
        provider: "mock_ats",
        externalId: "mock_job_1",
        externalUrl: null,
        title: "Store Associate",
        status: "active",
        externalUpdatedAt: null,
        lastSeenAt: "2026-05-19T10:00:00.000Z",
        rawSnapshot: {},
      },
      {
        id: "ats_job_other_connection",
        companyId: "company_1",
        connectionId: "ats_conn_2",
        provider: "mock_ats",
        externalId: "mock_job_2",
        externalUrl: null,
        title: "Warehouse Lead",
        status: "active",
        externalUpdatedAt: null,
        lastSeenAt: "2026-05-19T10:00:00.000Z",
        rawSnapshot: {},
      },
    ];
    mockLoadRuntimeStoreState.mockResolvedValue(state);
    const { saveATSTriggerRuleAction } =
      await import("@/app/(recruiter)/settings/integrations/ats/actions");
    const formData = new FormData();
    formData.set("connectionId", "ats_conn_1");
    formData.set("externalStageId", "mock_stage_screen");
    formData.set("externalJobId", "mock_job_2");
    formData.append("actions", "queue_interview");

    await expect(saveATSTriggerRuleAction(formData)).rejects.toThrow(
      "Choose a trigger job from the selected ATS connection.",
    );
    expect(mockSaveRuntimeStoreState).not.toHaveBeenCalled();
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

  it("rejects workflow approvals outside the recruiter's company", async () => {
    const state = await mockLoadRuntimeStoreState();
    state.atsWorkflowRequests = [
      {
        id: "ats_workflow_other",
        companyId: "company_2",
        atsSyncEventId: "ats_evt_other",
        atsTriggerRuleId: "ats_rule_other",
        externalApplicationId: "mock_app_other",
        internalCandidateId: null,
        internalApplicationId: null,
        requestedActions: ["import_candidate"],
        requiresRecruiterApproval: true,
        status: "queued",
        createdAt: "2026-05-19T10:00:00.000Z",
        updatedAt: "2026-05-19T10:00:00.000Z",
      },
    ];
    mockLoadRuntimeStoreState.mockResolvedValue(state);
    const { approveATSWorkflowRequestAction } =
      await import("@/app/(recruiter)/settings/integrations/ats/actions");
    const formData = new FormData();
    formData.set("workflowRequestId", "ats_workflow_other");

    await expect(approveATSWorkflowRequestAction(formData)).rejects.toThrow(
      "ATS workflow request not found.",
    );
    expect(mockProcessATSWorkflowRequest).not.toHaveBeenCalled();
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

  it("rejects writeback dispatch outside the recruiter's company", async () => {
    const state = await mockLoadRuntimeStoreState();
    state.atsWritebackActions = [
      {
        id: "ats_writeback_other",
        companyId: "company_2",
        connectionId: "ats_conn_other",
        provider: "mock_ats",
        actionType: "candidate_note",
        targetExternalCandidateId: "mock_candidate_other",
        targetExternalApplicationId: "mock_app_other",
        targetExternalJobId: "mock_job_other",
        targetExternalStageId: null,
        sourceObjectType: "evaluation",
        sourceObjectId: "eval_other",
        status: "queued",
        idempotencyKey: "other_key",
        payload: { summary: "Other" },
        createdAt: "2026-05-19T10:00:00.000Z",
        updatedAt: "2026-05-19T10:00:00.000Z",
      },
    ];
    mockLoadRuntimeStoreState.mockResolvedValue(state);
    const { processATSWritebackActionAction } =
      await import("@/app/(recruiter)/settings/integrations/ats/actions");
    const formData = new FormData();
    formData.set("writebackActionId", "ats_writeback_other");

    await expect(processATSWritebackActionAction(formData)).rejects.toThrow(
      "ATS writeback action not found.",
    );
    expect(mockProcessATSWritebackAction).not.toHaveBeenCalled();
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

  it("saves the admin-selected sync mode on the ATS connection", async () => {
    const { saveATSSyncModeAction } =
      await import("@/app/(recruiter)/settings/integrations/ats/actions");
    const formData = new FormData();
    formData.set("connectionId", "ats_conn_1");
    formData.set("syncMode", "scheduled");

    await saveATSSyncModeAction(formData);

    const savedState = mockSaveRuntimeStoreState.mock.calls[0][0];
    expect(savedState.atsConnections[0]).toMatchObject({
      id: "ats_conn_1",
      syncMode: "scheduled",
    });
    expect(mockAppendAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "ats.sync_mode_saved",
        targetId: "ats_conn_1",
        metadata: expect.objectContaining({
          syncMode: "scheduled",
        }),
      }),
    );
  });

  it("rejects webhook sync mode when the adapter does not support webhooks", async () => {
    mockAdapterCapabilities = {
      ...mockAdapterCapabilities,
      supportsWebhooks: false,
    };
    const { saveATSSyncModeAction } =
      await import("@/app/(recruiter)/settings/integrations/ats/actions");
    const formData = new FormData();
    formData.set("connectionId", "ats_conn_1");
    formData.set("syncMode", "webhook_plus_polling");

    await expect(saveATSSyncModeAction(formData)).rejects.toThrow(
      "Selected ATS provider does not support webhook sync.",
    );
    expect(mockSaveRuntimeStoreState).not.toHaveBeenCalled();
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

  it("rejects writeback target stages from another ATS connection", async () => {
    const state = await mockLoadRuntimeStoreState();
    state.atsExternalStages = [
      {
        id: "ats_stage_own",
        companyId: "company_1",
        connectionId: "ats_conn_1",
        provider: "mock_ats",
        externalJobId: "mock_job_1",
        externalId: "mock_stage_shortlisted",
        name: "Shortlisted",
        category: "evaluation",
        position: 3,
        status: "active",
        lastSeenAt: "2026-05-19T10:00:00.000Z",
        rawSnapshot: {},
      },
      {
        id: "ats_stage_other_connection",
        companyId: "company_1",
        connectionId: "ats_conn_2",
        provider: "mock_ats",
        externalJobId: "mock_job_2",
        externalId: "mock_stage_hired",
        name: "Hired",
        category: "hired",
        position: 4,
        status: "active",
        lastSeenAt: "2026-05-19T10:00:00.000Z",
        rawSnapshot: {},
      },
    ];
    mockLoadRuntimeStoreState.mockResolvedValue(state);
    const { saveATSWritebackPolicyAction } =
      await import("@/app/(recruiter)/settings/integrations/ats/actions");
    const formData = new FormData();
    formData.set("connectionId", "ats_conn_1");
    formData.set("reportMode", "candidate_note");
    formData.set("moveToExternalStageId", "mock_stage_hired");

    await expect(saveATSWritebackPolicyAction(formData)).rejects.toThrow(
      "Choose a writeback target stage from the selected ATS connection.",
    );
    expect(mockSaveRuntimeStoreState).not.toHaveBeenCalled();
  });

  it("rejects candidate note writeback policy when the adapter does not support notes", async () => {
    mockAdapterCapabilities = {
      ...mockAdapterCapabilities,
      supportsCandidateNotes: false,
    };
    const { saveATSWritebackPolicyAction } =
      await import("@/app/(recruiter)/settings/integrations/ats/actions");
    const formData = new FormData();
    formData.set("connectionId", "ats_conn_1");
    formData.set("reportMode", "candidate_note");

    await expect(saveATSWritebackPolicyAction(formData)).rejects.toThrow(
      "Selected ATS provider does not support candidate note writebacks.",
    );
    expect(mockSaveRuntimeStoreState).not.toHaveBeenCalled();
  });

  it("rejects stage move writeback policy when the adapter does not support stage moves", async () => {
    mockAdapterCapabilities = {
      ...mockAdapterCapabilities,
      supportsStageMove: false,
    };
    const { saveATSWritebackPolicyAction } =
      await import("@/app/(recruiter)/settings/integrations/ats/actions");
    const formData = new FormData();
    formData.set("connectionId", "ats_conn_1");
    formData.set("reportMode", "disabled");
    formData.set("moveToExternalStageId", "mock_stage_shortlisted");

    await expect(saveATSWritebackPolicyAction(formData)).rejects.toThrow(
      "Selected ATS provider does not support stage move writebacks.",
    );
    expect(mockSaveRuntimeStoreState).not.toHaveBeenCalled();
  });
});
