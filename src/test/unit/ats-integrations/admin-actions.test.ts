import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { stageMappingValueForExternalStage } from "@/lib/ats-integrations/stage-mappings";

const mockRequireAuthenticatedRecruiter = vi.fn();
const mockRecruiterCanManageTeams = vi.fn();
const mockAppendAuditEvent = vi.fn();
const mockLoadRuntimeStoreState = vi.fn();
const mockSaveRuntimeStoreState = vi.fn();
const mockRevalidatePath = vi.fn();
const mockProcessATSWorkflowRequest = vi.fn();
const mockProcessATSWritebackAction = vi.fn();
const mockValidateConnection = vi.fn();
const mockRunATSSync = vi.fn();
let mockAdapterCapabilities = {
  supportsWebhooks: true,
  supportsPolling: true,
  supportsCandidateNotes: true,
  supportsStatusComments: true,
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

vi.mock("@/lib/ats-integrations/sync", () => ({
  runATSSync: (...args: unknown[]) => mockRunATSSync(...args),
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
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    mockAdapterCapabilities = {
      supportsWebhooks: true,
      supportsPolling: true,
      supportsCandidateNotes: true,
      supportsStatusComments: true,
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
        connectionId: "ats_conn_1",
        actionType: "candidate_note",
        targetExternalCandidateId: "mock_candidate_ana",
        targetExternalApplicationId: "mock_app_1",
        targetExternalJobId: "mock_job_1",
        targetExternalStageId: null,
        sourceObjectType: "evaluation",
        sourceObjectId: "eval_1",
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
    mockRunATSSync.mockResolvedValue({
      importedJobs: 1,
      importedCandidates: 1,
      importedApplications: 1,
      importedStages: 6,
      createdEvents: 3,
      createdWorkflowRequests: 1,
    });
  });

  it("creates a Zoho demo connection as errored when credentials are missing", async () => {
    vi.stubEnv("ZOHO_RECRUIT_ACCESS_TOKEN", "");
    vi.stubEnv("ZOHO_RECRUIT_REFRESH_TOKEN", "");
    vi.stubEnv("ZOHO_RECRUIT_CLIENT_ID", "");
    vi.stubEnv("ZOHO_RECRUIT_CLIENT_SECRET", "");
    const { createZohoEnvConnectionAction } =
      await import("@/app/(recruiter)/settings/integrations/ats/actions");

    await createZohoEnvConnectionAction(new FormData());

    const savedState = mockSaveRuntimeStoreState.mock.calls[0][0];
    const zohoConnection = savedState.atsConnections.find(
      (connection: { provider: string }) =>
        connection.provider === "zoho_recruit",
    );
    expect(zohoConnection).toMatchObject({
      provider: "zoho_recruit",
      status: "error",
      lastError:
        "Configure ZOHO_RECRUIT_ACCESS_TOKEN or refresh-token credentials before syncing Zoho Recruit.",
    });
    expect(mockAppendAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "ats.connection_created",
        metadata: expect.objectContaining({
          provider: "zoho_recruit",
          credentialStatus: "missing",
        }),
      }),
    );
  });

  it("keeps a Zoho demo connection errored when configured credentials fail validation", async () => {
    vi.stubEnv("ZOHO_RECRUIT_ACCESS_TOKEN", "bad-token");
    mockValidateConnection.mockRejectedValue(
      new Error("Zoho Recruit request failed with 401."),
    );
    const { createZohoEnvConnectionAction } =
      await import("@/app/(recruiter)/settings/integrations/ats/actions");

    await createZohoEnvConnectionAction(new FormData());

    const savedState = mockSaveRuntimeStoreState.mock.calls[0][0];
    const zohoConnection = savedState.atsConnections.find(
      (connection: { provider: string }) =>
        connection.provider === "zoho_recruit",
    );
    expect(mockValidateConnection).toHaveBeenCalledWith({
      connection: expect.objectContaining({
        provider: "zoho_recruit",
        status: "active",
        secretRef: "env:ZOHO_RECRUIT_ACCESS_TOKEN",
      }),
    });
    expect(zohoConnection).toMatchObject({
      provider: "zoho_recruit",
      status: "error",
      lastError: "Zoho Recruit request failed with 401.",
    });
    expect(mockAppendAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "ats.connection_created",
        metadata: expect.objectContaining({
          provider: "zoho_recruit",
          credentialStatus: "invalid",
        }),
      }),
    );
  });

  it("updates the existing Mock ATS connection instead of creating duplicates", async () => {
    const { createMockATSConnectionAction } =
      await import("@/app/(recruiter)/settings/integrations/ats/actions");

    await createMockATSConnectionAction(new FormData());

    const savedState = mockSaveRuntimeStoreState.mock.calls[0][0];
    const mockConnections = savedState.atsConnections.filter(
      (connection: { provider: string }) => connection.provider === "mock_ats",
    );
    expect(mockConnections).toHaveLength(1);
    expect(mockConnections[0]).toMatchObject({
      id: "ats_conn_1",
      provider: "mock_ats",
      status: "active",
      syncMode: "manual",
      externalAccountId: "mock_account",
      lastError: null,
      createdAt: "2026-05-19T10:00:00.000Z",
    });
  });

  it("updates the existing Zoho demo connection instead of creating duplicates", async () => {
    vi.stubEnv("ZOHO_RECRUIT_ACCESS_TOKEN", "zoho-token");
    const state = await mockLoadRuntimeStoreState();
    state.atsConnections.push({
      id: "ats_conn_zoho_existing",
      companyId: "company_1",
      provider: "zoho_recruit",
      status: "error",
      syncMode: "scheduled",
      displayName: "Zoho Recruit demo",
      authMode: "env_token",
      secretRef: "env:ZOHO_RECRUIT_ACCESS_TOKEN",
      externalAccountId: "zoho_existing",
      lastSyncAt: "2026-05-19T10:00:00.000Z",
      lastError: "Old missing token error.",
      createdAt: "2026-05-19T09:00:00.000Z",
      updatedAt: "2026-05-19T10:00:00.000Z",
    });
    mockLoadRuntimeStoreState.mockResolvedValue(state);
    const { createZohoEnvConnectionAction } =
      await import("@/app/(recruiter)/settings/integrations/ats/actions");

    await createZohoEnvConnectionAction(new FormData());

    const savedState = mockSaveRuntimeStoreState.mock.calls[0][0];
    const zohoConnections = savedState.atsConnections.filter(
      (connection: { provider: string }) =>
        connection.provider === "zoho_recruit",
    );
    expect(zohoConnections).toHaveLength(1);
    expect(zohoConnections[0]).toMatchObject({
      id: "ats_conn_zoho_existing",
      status: "active",
      secretRef: "env:ZOHO_RECRUIT_ACCESS_TOKEN",
      externalAccountId: "mock_account_verified",
      lastSyncAt: "2026-05-19T10:00:00.000Z",
      lastError: null,
      createdAt: "2026-05-19T09:00:00.000Z",
    });
  });

  it("configures Zoho demo trigger and writeback defaults in one admin action", async () => {
    vi.stubEnv("ZOHO_RECRUIT_ACCESS_TOKEN", "zoho-token");
    const { configureZohoDemoDefaultsAction } =
      await import("@/app/(recruiter)/settings/integrations/ats/actions");

    await configureZohoDemoDefaultsAction(new FormData());

    const savedState = mockSaveRuntimeStoreState.mock.calls[0][0];
    const zohoConnection = savedState.atsConnections.find(
      (connection: { provider: string }) =>
        connection.provider === "zoho_recruit",
    );

    expect(zohoConnection).toMatchObject({
      provider: "zoho_recruit",
      status: "active",
      syncMode: "manual",
      writebackPolicy: {
        reportMode: "candidate_note",
        moveToExternalStageId: "Interview Completed",
        stageMoveMappings: {
          interviewed: "Interview Completed",
          shortlisted: "Shortlisted",
          hired: "Hired",
          rejected: "Rejected",
        },
        requiresRecruiterReview: false,
      },
    });
    expect(savedState.atsTriggerRules).toEqual([
      expect.objectContaining({
        connectionId: zohoConnection.id,
        provider: "zoho_recruit",
        externalJobId: null,
        externalStageId: "Breathe Screen",
        actions: ["import_candidate", "prepare_interview", "queue_interview"],
        requiresRecruiterApproval: false,
      }),
    ]);
    expect(mockAppendAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "ats.zoho_demo_configured",
        targetId: zohoConnection.id,
        metadata: expect.objectContaining({
          triggerStage: "Breathe Screen",
          writebackStage: "Interview Completed",
        }),
      }),
    );
    expect(mockRevalidatePath).toHaveBeenCalledWith(
      "/settings/integrations/ats",
    );
  });

  it("runs an initial Zoho sync after configuring demo defaults with validated credentials", async () => {
    vi.stubEnv("ZOHO_RECRUIT_ACCESS_TOKEN", "zoho-token");
    const { configureZohoDemoDefaultsAction } =
      await import("@/app/(recruiter)/settings/integrations/ats/actions");

    await configureZohoDemoDefaultsAction(new FormData());

    const savedState = mockSaveRuntimeStoreState.mock.calls[0][0];
    const zohoConnection = savedState.atsConnections.find(
      (connection: { provider: string }) =>
        connection.provider === "zoho_recruit",
    );
    expect(mockRunATSSync).toHaveBeenCalledWith({
      companyId: "company_1",
      connectionId: zohoConnection.id,
      now: expect.any(String),
    });
  });

  it("backfills and auto-processes existing Zoho demo applications when configuring defaults", async () => {
    vi.stubEnv("ZOHO_RECRUIT_ACCESS_TOKEN", "zoho-token");
    const state = await mockLoadRuntimeStoreState();
    state.atsConnections.push({
      id: "ats_conn_zoho",
      companyId: "company_1",
      provider: "zoho_recruit",
      status: "active",
      displayName: "Zoho Recruit demo",
      authMode: "env_token",
      secretRef: "env:ZOHO_RECRUIT_ACCESS_TOKEN",
      externalAccountId: "zoho_demo",
      lastSyncAt: "2026-05-19T10:00:00.000Z",
      lastError: null,
      createdAt: "2026-05-19T10:00:00.000Z",
      updatedAt: "2026-05-19T10:00:00.000Z",
    });
    state.atsExternalApplications = [
      {
        id: "ats_application_zoho",
        companyId: "company_1",
        connectionId: "ats_conn_zoho",
        provider: "zoho_recruit",
        externalId: "58431000000054321:58431000000012345",
        externalCandidateId: "58431000000054321",
        externalJobId: "58431000000012345",
        externalStageId: "Breathe Screen",
        externalUrl: null,
        internalCandidateId: null,
        internalApplicationId: null,
        internalJobId: null,
        candidateName: "Ana Martin",
        candidateEmail: "ana@example.com",
        candidatePhone: "+34600000000",
        jobTitle: "Store Associate",
        stageName: "Breathe Screen",
        stageCategory: "screening",
        status: "active",
        externalUpdatedAt: "2026-05-19T10:05:00.000Z",
        lastSeenAt: "2026-05-19T10:05:00.000Z",
        rawSnapshot: { Candidate_Status: "Breathe Screen" },
      },
    ];
    state.atsSyncEvents = [];
    state.atsWorkflowRequests = [];
    mockLoadRuntimeStoreState.mockResolvedValue(state);
    const { configureZohoDemoDefaultsAction } =
      await import("@/app/(recruiter)/settings/integrations/ats/actions");

    await configureZohoDemoDefaultsAction(new FormData());

    const savedState = mockSaveRuntimeStoreState.mock.calls[0][0];
    expect(savedState.atsWorkflowRequests).toHaveLength(1);
    expect(savedState.atsWorkflowRequests[0]).toMatchObject({
      connectionId: "ats_conn_zoho",
      provider: "zoho_recruit",
      externalApplicationId: "58431000000054321:58431000000012345",
      requestedActions: [
        "import_candidate",
        "prepare_interview",
        "queue_interview",
      ],
      requiresRecruiterApproval: false,
      status: "queued",
    });
    expect(mockProcessATSWorkflowRequest).toHaveBeenCalledWith({
      workflowRequestId: savedState.atsWorkflowRequests[0].id,
      now: expect.any(String),
      approved: true,
    });
  });

  it("does not auto-process Zoho demo backfills when credentials are missing", async () => {
    vi.stubEnv("ZOHO_RECRUIT_ACCESS_TOKEN", "");
    vi.stubEnv("ZOHO_RECRUIT_REFRESH_TOKEN", "");
    vi.stubEnv("ZOHO_RECRUIT_CLIENT_ID", "");
    vi.stubEnv("ZOHO_RECRUIT_CLIENT_SECRET", "");
    const state = await mockLoadRuntimeStoreState();
    state.atsConnections.push({
      id: "ats_conn_zoho",
      companyId: "company_1",
      provider: "zoho_recruit",
      status: "active",
      displayName: "Zoho Recruit demo",
      authMode: "env_token",
      secretRef: "env:ZOHO_RECRUIT_ACCESS_TOKEN",
      externalAccountId: "zoho_demo",
      lastSyncAt: "2026-05-19T10:00:00.000Z",
      lastError: null,
      createdAt: "2026-05-19T10:00:00.000Z",
      updatedAt: "2026-05-19T10:00:00.000Z",
    });
    state.atsExternalApplications = [
      {
        id: "ats_application_zoho",
        companyId: "company_1",
        connectionId: "ats_conn_zoho",
        provider: "zoho_recruit",
        externalId: "58431000000054321:58431000000012345",
        externalCandidateId: "58431000000054321",
        externalJobId: "58431000000012345",
        externalStageId: "Breathe Screen",
        externalUrl: null,
        internalCandidateId: null,
        internalApplicationId: null,
        internalJobId: null,
        candidateName: "Ana Martin",
        candidateEmail: "ana@example.com",
        candidatePhone: "+34600000000",
        jobTitle: "Store Associate",
        stageName: "Breathe Screen",
        stageCategory: "screening",
        status: "active",
        externalUpdatedAt: "2026-05-19T10:05:00.000Z",
        lastSeenAt: "2026-05-19T10:05:00.000Z",
        rawSnapshot: { Candidate_Status: "Breathe Screen" },
      },
    ];
    state.atsSyncEvents = [];
    state.atsWorkflowRequests = [];
    mockLoadRuntimeStoreState.mockResolvedValue(state);
    const { configureZohoDemoDefaultsAction } =
      await import("@/app/(recruiter)/settings/integrations/ats/actions");

    await configureZohoDemoDefaultsAction(new FormData());

    const savedState = mockSaveRuntimeStoreState.mock.calls[0][0];
    const zohoConnection = savedState.atsConnections.find(
      (connection: { id: string }) => connection.id === "ats_conn_zoho",
    );
    expect(zohoConnection).toMatchObject({
      status: "error",
      lastError:
        "Configure ZOHO_RECRUIT_ACCESS_TOKEN or refresh-token credentials before syncing Zoho Recruit.",
    });
    expect(savedState.atsWorkflowRequests).toHaveLength(1);
    expect(savedState.atsWorkflowRequests[0]).toMatchObject({
      connectionId: "ats_conn_zoho",
      provider: "zoho_recruit",
      requiresRecruiterApproval: false,
      status: "queued",
    });
    expect(mockRunATSSync).not.toHaveBeenCalled();
    expect(mockProcessATSWorkflowRequest).not.toHaveBeenCalled();
  });

  it("does not auto-process Zoho demo backfills when configured credentials fail validation", async () => {
    vi.stubEnv("ZOHO_RECRUIT_ACCESS_TOKEN", "bad-token");
    mockValidateConnection.mockRejectedValue(
      new Error("Zoho Recruit request failed with 401."),
    );
    const state = await mockLoadRuntimeStoreState();
    state.atsConnections.push({
      id: "ats_conn_zoho",
      companyId: "company_1",
      provider: "zoho_recruit",
      status: "active",
      displayName: "Zoho Recruit demo",
      authMode: "env_token",
      secretRef: "env:ZOHO_RECRUIT_ACCESS_TOKEN",
      externalAccountId: "zoho_demo",
      lastSyncAt: "2026-05-19T10:00:00.000Z",
      lastError: null,
      createdAt: "2026-05-19T10:00:00.000Z",
      updatedAt: "2026-05-19T10:00:00.000Z",
    });
    state.atsExternalApplications = [
      {
        id: "ats_application_zoho",
        companyId: "company_1",
        connectionId: "ats_conn_zoho",
        provider: "zoho_recruit",
        externalId: "58431000000054321:58431000000012345",
        externalCandidateId: "58431000000054321",
        externalJobId: "58431000000012345",
        externalStageId: "Breathe Screen",
        externalUrl: null,
        internalCandidateId: null,
        internalApplicationId: null,
        internalJobId: null,
        candidateName: "Ana Martin",
        candidateEmail: "ana@example.com",
        candidatePhone: "+34600000000",
        jobTitle: "Store Associate",
        stageName: "Breathe Screen",
        stageCategory: "screening",
        status: "active",
        externalUpdatedAt: "2026-05-19T10:05:00.000Z",
        lastSeenAt: "2026-05-19T10:05:00.000Z",
        rawSnapshot: { Candidate_Status: "Breathe Screen" },
      },
    ];
    state.atsSyncEvents = [];
    state.atsWorkflowRequests = [];
    mockLoadRuntimeStoreState.mockResolvedValue(state);
    const { configureZohoDemoDefaultsAction } =
      await import("@/app/(recruiter)/settings/integrations/ats/actions");

    await configureZohoDemoDefaultsAction(new FormData());

    const savedState = mockSaveRuntimeStoreState.mock.calls[0][0];
    const zohoConnection = savedState.atsConnections.find(
      (connection: { id: string }) => connection.id === "ats_conn_zoho",
    );
    expect(mockValidateConnection).toHaveBeenCalledWith({
      connection: expect.objectContaining({
        id: "ats_conn_zoho",
        provider: "zoho_recruit",
        status: "active",
      }),
    });
    expect(zohoConnection).toMatchObject({
      status: "error",
      lastError: "Zoho Recruit request failed with 401.",
      writebackPolicy: {
        reportMode: "candidate_note",
        moveToExternalStageId: "Interview Completed",
      },
    });
    expect(savedState.atsWorkflowRequests).toHaveLength(1);
    expect(savedState.atsWorkflowRequests[0]).toMatchObject({
      connectionId: "ats_conn_zoho",
      provider: "zoho_recruit",
      requiresRecruiterApproval: false,
      status: "queued",
    });
    expect(mockRunATSSync).not.toHaveBeenCalled();
    expect(mockProcessATSWorkflowRequest).not.toHaveBeenCalled();
    expect(mockAppendAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "ats.zoho_demo_configured",
        metadata: expect.objectContaining({
          credentialStatus: "invalid",
        }),
      }),
    );
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

  it("rejects trigger stages that are archived in the selected ATS connection", async () => {
    const state = await mockLoadRuntimeStoreState();
    state.atsExternalStages = [
      {
        id: "ats_stage_archived",
        companyId: "company_1",
        connectionId: "ats_conn_1",
        provider: "mock_ats",
        externalJobId: "mock_job_1",
        externalId: "mock_stage_archived",
        name: "Archived Screen",
        category: "screening",
        position: 1,
        status: "archived_external",
        lastSeenAt: "2026-05-19T10:00:00.000Z",
        rawSnapshot: {},
      },
    ];
    mockLoadRuntimeStoreState.mockResolvedValue(state);
    const { saveATSTriggerRuleAction } =
      await import("@/app/(recruiter)/settings/integrations/ats/actions");
    const formData = new FormData();
    formData.set("connectionId", "ats_conn_1");
    formData.set("externalStageId", "mock_stage_archived");
    formData.append("actions", "prepare_interview");

    await expect(saveATSTriggerRuleAction(formData)).rejects.toThrow(
      "Choose an active trigger stage from the selected ATS connection.",
    );
    expect(mockSaveRuntimeStoreState).not.toHaveBeenCalled();
  });

  it("backfills workflow requests for imported applications that already match a saved trigger", async () => {
    const state = await mockLoadRuntimeStoreState();
    state.atsWorkflowRequests = [];
    state.atsExternalStages = [
      {
        id: "ats_stage_screen",
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
    ];
    state.atsExternalJobs = [
      {
        id: "ats_job_1",
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
    ];
    state.atsExternalApplications = [
      {
        id: "ats_app_imported",
        companyId: "company_1",
        connectionId: "ats_conn_1",
        provider: "mock_ats",
        externalId: "mock_app_imported",
        externalCandidateId: "mock_candidate_ana",
        externalJobId: "mock_job_1",
        externalStageId: "mock_stage_screen",
        externalUrl: null,
        internalCandidateId: null,
        internalApplicationId: null,
        internalJobId: null,
        candidateName: "Ana Martin",
        candidateEmail: "ana@example.com",
        candidatePhone: "+34600000000",
        jobTitle: "Store Associate",
        stageName: "Screen",
        stageCategory: "screening",
        status: "active",
        externalUpdatedAt: "2026-05-19T10:00:00.000Z",
        lastSeenAt: "2026-05-19T10:00:00.000Z",
        rawSnapshot: {},
      },
    ];
    state.atsSyncEvents = [
      {
        id: "ats_evt_imported",
        companyId: "company_1",
        connectionId: "ats_conn_1",
        provider: "mock_ats",
        eventType: "application_seen",
        externalObjectType: "application",
        externalObjectId: "mock_app_imported",
        externalJobId: "mock_job_1",
        externalCandidateId: "mock_candidate_ana",
        externalStageId: "mock_stage_screen",
        occurredAt: "2026-05-19T10:00:00.000Z",
        processedAt: null,
        idempotencyKey: "existing_event",
        payload: {},
      },
    ];
    mockLoadRuntimeStoreState.mockResolvedValue(state);
    const { saveATSTriggerRuleAction } =
      await import("@/app/(recruiter)/settings/integrations/ats/actions");
    const formData = new FormData();
    formData.set("connectionId", "ats_conn_1");
    formData.set("externalStageId", "mock_stage_screen");
    formData.set("externalJobId", "mock_job_1");
    formData.append("actions", "import_candidate");
    formData.set("requiresRecruiterApproval", "on");

    await saveATSTriggerRuleAction(formData);

    const savedState = mockSaveRuntimeStoreState.mock.calls[0][0];
    expect(savedState.atsWorkflowRequests).toHaveLength(1);
    expect(savedState.atsWorkflowRequests[0]).toMatchObject({
      connectionId: "ats_conn_1",
      provider: "mock_ats",
      atsSyncEventId: "ats_evt_imported",
      externalApplicationId: "mock_app_imported",
      requestedActions: ["import_candidate"],
      requiresRecruiterApproval: true,
      status: "queued",
    });
  });

  it("auto-processes backfilled workflow requests when recruiter approval is disabled", async () => {
    const state = await mockLoadRuntimeStoreState();
    state.atsWorkflowRequests = [];
    state.atsExternalApplications = [
      {
        id: "ats_app_imported",
        companyId: "company_1",
        connectionId: "ats_conn_1",
        provider: "mock_ats",
        externalId: "mock_app_imported",
        externalCandidateId: "mock_candidate_ana",
        externalJobId: "mock_job_1",
        externalStageId: "mock_stage_screen",
        externalUrl: null,
        internalCandidateId: null,
        internalApplicationId: null,
        internalJobId: null,
        candidateName: "Ana Martin",
        candidateEmail: "ana@example.com",
        candidatePhone: "+34600000000",
        jobTitle: "Store Associate",
        stageName: "Screen",
        stageCategory: "screening",
        status: "active",
        externalUpdatedAt: "2026-05-19T10:00:00.000Z",
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
    formData.append("actions", "import_candidate");

    await saveATSTriggerRuleAction(formData);

    const savedState = mockSaveRuntimeStoreState.mock.calls[0][0];
    expect(savedState.atsWorkflowRequests).toHaveLength(1);
    expect(savedState.atsWorkflowRequests[0]).toMatchObject({
      requiresRecruiterApproval: false,
      status: "queued",
    });
    expect(mockProcessATSWorkflowRequest).toHaveBeenCalledWith({
      workflowRequestId: savedState.atsWorkflowRequests[0].id,
      now: expect.any(String),
      approved: true,
    });
  });

  it("does not auto-process backfilled workflow requests for inactive trigger connections", async () => {
    const state = await mockLoadRuntimeStoreState();
    state.atsConnections[0] = {
      ...state.atsConnections[0],
      status: "paused",
    };
    state.atsWorkflowRequests = [];
    state.atsExternalApplications = [
      {
        id: "ats_app_imported",
        companyId: "company_1",
        connectionId: "ats_conn_1",
        provider: "mock_ats",
        externalId: "mock_app_imported",
        externalCandidateId: "mock_candidate_ana",
        externalJobId: "mock_job_1",
        externalStageId: "mock_stage_screen",
        externalUrl: null,
        internalCandidateId: null,
        internalApplicationId: null,
        internalJobId: null,
        candidateName: "Ana Martin",
        candidateEmail: "ana@example.com",
        candidatePhone: "+34600000000",
        jobTitle: "Store Associate",
        stageName: "Screen",
        stageCategory: "screening",
        status: "active",
        externalUpdatedAt: "2026-05-19T10:00:00.000Z",
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
    formData.append("actions", "import_candidate");

    await saveATSTriggerRuleAction(formData);

    const savedState = mockSaveRuntimeStoreState.mock.calls[0][0];
    expect(savedState.atsWorkflowRequests).toHaveLength(1);
    expect(savedState.atsWorkflowRequests[0]).toMatchObject({
      requiresRecruiterApproval: false,
      status: "queued",
    });
    expect(mockProcessATSWorkflowRequest).not.toHaveBeenCalled();
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
      "Choose an active trigger stage from the selected ATS connection.",
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
      "Choose an active trigger job from the selected ATS connection.",
    );
    expect(mockSaveRuntimeStoreState).not.toHaveBeenCalled();
  });

  it("rejects trigger jobs that are archived in the selected ATS connection", async () => {
    const state = await mockLoadRuntimeStoreState();
    state.atsExternalJobs = [
      {
        id: "ats_job_archived",
        companyId: "company_1",
        connectionId: "ats_conn_1",
        provider: "mock_ats",
        externalId: "mock_job_archived",
        externalUrl: null,
        title: "Archived Store Associate",
        status: "archived_external",
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
    formData.set("externalJobId", "mock_job_archived");
    formData.append("actions", "queue_interview");

    await expect(saveATSTriggerRuleAction(formData)).rejects.toThrow(
      "Choose an active trigger job from the selected ATS connection.",
    );
    expect(mockSaveRuntimeStoreState).not.toHaveBeenCalled();
  });

  it("rejects trigger stages that do not belong to the selected external job", async () => {
    const state = await mockLoadRuntimeStoreState();
    state.atsExternalJobs = [
      {
        id: "ats_job_1",
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
        id: "ats_job_2",
        companyId: "company_1",
        connectionId: "ats_conn_1",
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
    state.atsExternalStages = [
      {
        id: "ats_stage_job_1_screen",
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
      "Choose a trigger stage that belongs to the selected ATS job.",
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

  it("saves the admin-selected trigger rule enabled status", async () => {
    const state = await mockLoadRuntimeStoreState();
    state.atsTriggerRules = [
      {
        id: "ats_rule_1",
        companyId: "company_1",
        connectionId: "ats_conn_1",
        provider: "mock_ats",
        name: "Run Breathe at Breathe Screen",
        enabled: true,
        externalJobId: null,
        externalStageId: "Breathe Screen",
        actions: ["import_candidate"],
        requiresRecruiterApproval: true,
        createdAt: "2026-05-19T10:00:00.000Z",
        updatedAt: "2026-05-19T10:00:00.000Z",
      },
    ];
    mockLoadRuntimeStoreState.mockResolvedValue(state);
    const { saveATSTriggerRuleStatusAction } =
      await import("@/app/(recruiter)/settings/integrations/ats/actions");
    const formData = new FormData();
    formData.set("triggerRuleId", "ats_rule_1");
    formData.set("enabled", "false");

    await saveATSTriggerRuleStatusAction(formData);

    const savedState = mockSaveRuntimeStoreState.mock.calls[0][0];
    expect(savedState.atsTriggerRules[0]).toMatchObject({
      id: "ats_rule_1",
      enabled: false,
      updatedAt: expect.any(String),
    });
    expect(mockAppendAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "ats.trigger_rule_status_saved",
        targetId: "ats_rule_1",
        metadata: expect.objectContaining({
          provider: "mock_ats",
          enabled: false,
        }),
      }),
    );
    expect(mockRevalidatePath).toHaveBeenCalledWith(
      "/settings/integrations/ats",
    );
  });

  it("deletes an admin-selected trigger rule and skips its queued workflow requests", async () => {
    const state = await mockLoadRuntimeStoreState();
    state.atsTriggerRules = [
      {
        id: "ats_rule_1",
        companyId: "company_1",
        connectionId: "ats_conn_1",
        provider: "mock_ats",
        name: "Run Breathe at Breathe Screen",
        enabled: true,
        externalJobId: null,
        externalStageId: "Breathe Screen",
        actions: ["import_candidate"],
        requiresRecruiterApproval: true,
        createdAt: "2026-05-19T10:00:00.000Z",
        updatedAt: "2026-05-19T10:00:00.000Z",
      },
      {
        id: "ats_rule_keep",
        companyId: "company_1",
        connectionId: "ats_conn_1",
        provider: "mock_ats",
        name: "Run Breathe at Shortlist",
        enabled: true,
        externalJobId: null,
        externalStageId: "Shortlist",
        actions: ["queue_interview"],
        requiresRecruiterApproval: true,
        createdAt: "2026-05-19T10:00:00.000Z",
        updatedAt: "2026-05-19T10:00:00.000Z",
      },
    ];
    state.atsWorkflowRequests = [
      {
        id: "ats_workflow_queued",
        companyId: "company_1",
        connectionId: "ats_conn_1",
        provider: "mock_ats",
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
      {
        id: "ats_workflow_completed",
        companyId: "company_1",
        connectionId: "ats_conn_1",
        provider: "mock_ats",
        atsSyncEventId: "ats_evt_2",
        atsTriggerRuleId: "ats_rule_1",
        externalApplicationId: "mock_app_2",
        internalCandidateId: "cand_2",
        internalApplicationId: "app_2",
        requestedActions: ["import_candidate"],
        requiresRecruiterApproval: true,
        status: "completed",
        createdAt: "2026-05-19T10:00:00.000Z",
        updatedAt: "2026-05-19T10:00:00.000Z",
      },
    ];
    mockLoadRuntimeStoreState.mockResolvedValue(state);
    const { deleteATSTriggerRuleAction } =
      await import("@/app/(recruiter)/settings/integrations/ats/actions");
    const formData = new FormData();
    formData.set("triggerRuleId", "ats_rule_1");

    await deleteATSTriggerRuleAction(formData);

    const savedState = mockSaveRuntimeStoreState.mock.calls[0][0];
    expect(savedState.atsTriggerRules).toEqual([
      expect.objectContaining({ id: "ats_rule_keep" }),
    ]);
    expect(savedState.atsWorkflowRequests).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "ats_workflow_queued",
          status: "skipped",
          updatedAt: expect.any(String),
        }),
        expect.objectContaining({
          id: "ats_workflow_completed",
          status: "completed",
        }),
      ]),
    );
    expect(mockAppendAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "ats.trigger_rule_deleted",
        targetId: "ats_rule_1",
        metadata: expect.objectContaining({
          provider: "mock_ats",
          skippedWorkflowRequests: "1",
        }),
      }),
    );
    expect(mockRevalidatePath).toHaveBeenCalledWith(
      "/settings/integrations/ats",
    );
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
        metadata: expect.objectContaining({
          processingMode: "manual_recruiter_review",
          connectionId: "ats_conn_1",
          actionType: "candidate_note",
          sourceObjectType: "evaluation",
          sourceObjectId: "eval_1",
          targetExternalCandidateId: "mock_candidate_ana",
          targetExternalApplicationId: "mock_app_1",
          targetExternalStageId: null,
        }),
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

  it("saves the admin-selected connection status", async () => {
    const { saveATSConnectionStatusAction } =
      await import("@/app/(recruiter)/settings/integrations/ats/actions");
    const formData = new FormData();
    formData.set("connectionId", "ats_conn_1");
    formData.set("status", "paused");

    await saveATSConnectionStatusAction(formData);

    const savedState = mockSaveRuntimeStoreState.mock.calls[0][0];
    expect(savedState.atsConnections[0]).toMatchObject({
      id: "ats_conn_1",
      status: "paused",
    });
    expect(mockAppendAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "ats.connection_status_saved",
        targetId: "ats_conn_1",
        metadata: expect.objectContaining({
          provider: "mock_ats",
          status: "paused",
        }),
      }),
    );
    expect(mockRevalidatePath).toHaveBeenCalledWith(
      "/settings/integrations/ats",
    );
  });

  it("requires testing an errored connection before reactivating it", async () => {
    const state = await mockLoadRuntimeStoreState();
    state.atsConnections[0].status = "error";
    state.atsConnections[0].lastError =
      "ZOHO_RECRUIT_ACCESS_TOKEN is required.";
    mockLoadRuntimeStoreState.mockResolvedValue(state);
    const { saveATSConnectionStatusAction } =
      await import("@/app/(recruiter)/settings/integrations/ats/actions");
    const formData = new FormData();
    formData.set("connectionId", "ats_conn_1");
    formData.set("status", "active");

    await expect(saveATSConnectionStatusAction(formData)).rejects.toThrow(
      "Test the ATS connection before reactivating an errored connection.",
    );
    expect(mockSaveRuntimeStoreState).not.toHaveBeenCalled();
    expect(mockAppendAuditEvent).not.toHaveBeenCalled();
    expect(mockRevalidatePath).not.toHaveBeenCalled();
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

  it("saves manual stage writeback mappings from admin", async () => {
    const state = await mockLoadRuntimeStoreState();
    state.atsExternalStages = [
      {
        id: "ats_stage_interviewed",
        companyId: "company_1",
        connectionId: "ats_conn_1",
        provider: "mock_ats",
        externalJobId: null,
        externalId: "mock_stage_interviewed",
        name: "Interviewed",
        category: "interview",
        position: 2,
        status: "active",
        lastSeenAt: "2026-05-19T10:00:00.000Z",
        rawSnapshot: {},
      },
      {
        id: "ats_stage_rejected",
        companyId: "company_1",
        connectionId: "ats_conn_1",
        provider: "mock_ats",
        externalJobId: null,
        externalId: "mock_stage_rejected",
        name: "Rejected",
        category: "rejected",
        position: 5,
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
    formData.set("stageMoveMapping:interviewed", "mock_stage_interviewed");
    formData.set("stageMoveMapping:rejected", "mock_stage_rejected");
    formData.set("stageMoveMapping:hired", "");

    await saveATSWritebackPolicyAction(formData);

    const savedState = mockSaveRuntimeStoreState.mock.calls[0][0];
    expect(savedState.atsConnections[0].writebackPolicy).toMatchObject({
      stageMoveMappings: {
        interviewed: "mock_stage_interviewed",
        rejected: "mock_stage_rejected",
      },
    });
    expect(
      savedState.atsConnections[0].writebackPolicy.stageMoveMappings.hired,
    ).toBeUndefined();
    expect(mockAppendAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "ats.writeback_policy_saved",
        metadata: expect.objectContaining({
          stageMoveMappings: "interviewed,rejected",
        }),
      }),
    );
  });

  it("saves job-scoped manual stage mappings from admin", async () => {
    const state = await mockLoadRuntimeStoreState();
    state.atsExternalStages = [
      {
        id: "ats_stage_job_1_rejected",
        companyId: "company_1",
        connectionId: "ats_conn_1",
        provider: "mock_ats",
        externalJobId: "job_1",
        externalId: "rejected",
        name: "Rejected",
        category: "rejected",
        position: 5,
        status: "active",
        lastSeenAt: "2026-05-19T10:00:00.000Z",
        rawSnapshot: {},
      },
      {
        id: "ats_stage_job_2_rejected",
        companyId: "company_1",
        connectionId: "ats_conn_1",
        provider: "mock_ats",
        externalJobId: "job_2",
        externalId: "rejected",
        name: "Rejected",
        category: "rejected",
        position: 5,
        status: "active",
        lastSeenAt: "2026-05-19T10:00:00.000Z",
        rawSnapshot: {},
      },
    ];
    mockLoadRuntimeStoreState.mockResolvedValue(state);
    const { saveATSWritebackPolicyAction } =
      await import("@/app/(recruiter)/settings/integrations/ats/actions");
    const formData = new FormData();
    const scopedRejectedStage = stageMappingValueForExternalStage({
      externalJobId: "job_1",
      externalStageId: "rejected",
    });
    formData.set("connectionId", "ats_conn_1");
    formData.set("reportMode", "candidate_note");
    formData.set("stageMoveMapping:rejected", scopedRejectedStage);

    await saveATSWritebackPolicyAction(formData);

    const savedState = mockSaveRuntimeStoreState.mock.calls[0][0];
    expect(savedState.atsConnections[0].writebackPolicy).toMatchObject({
      stageMoveMappings: {
        rejected: scopedRejectedStage,
      },
    });
  });

  it("saves status comment writeback policy without forcing a target stage move", async () => {
    const { saveATSWritebackPolicyAction } =
      await import("@/app/(recruiter)/settings/integrations/ats/actions");
    const formData = new FormData();
    formData.set("connectionId", "ats_conn_1");
    formData.set("reportMode", "status_comment");

    await saveATSWritebackPolicyAction(formData);

    const savedState = mockSaveRuntimeStoreState.mock.calls[0][0];
    expect(savedState.atsConnections[0].writebackPolicy).toEqual({
      reportMode: "status_comment",
      moveToExternalStageId: null,
      requiresRecruiterReview: false,
    });
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
      "Choose an active writeback target stage from the selected ATS connection.",
    );
    expect(mockSaveRuntimeStoreState).not.toHaveBeenCalled();
  });

  it("rejects archived writeback target stages from the selected ATS connection", async () => {
    const state = await mockLoadRuntimeStoreState();
    state.atsExternalStages = [
      {
        id: "ats_stage_archived",
        companyId: "company_1",
        connectionId: "ats_conn_1",
        provider: "mock_ats",
        externalJobId: "mock_job_1",
        externalId: "mock_stage_archived",
        name: "Archived Shortlist",
        category: "evaluation",
        position: 3,
        status: "archived_external",
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
    formData.set("moveToExternalStageId", "mock_stage_archived");

    await expect(saveATSWritebackPolicyAction(formData)).rejects.toThrow(
      "Choose an active writeback target stage from the selected ATS connection.",
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

  it("rejects status comment writeback policy when the adapter does not support comments", async () => {
    mockAdapterCapabilities = {
      ...mockAdapterCapabilities,
      supportsStatusComments: false,
    };
    const { saveATSWritebackPolicyAction } =
      await import("@/app/(recruiter)/settings/integrations/ats/actions");
    const formData = new FormData();
    formData.set("connectionId", "ats_conn_1");
    formData.set("reportMode", "status_comment");

    await expect(saveATSWritebackPolicyAction(formData)).rejects.toThrow(
      "Selected ATS provider does not support status comment writebacks.",
    );
    expect(mockSaveRuntimeStoreState).not.toHaveBeenCalled();
  });

  it("allows status comment mode as a stage move comment when the adapter supports stage moves", async () => {
    mockAdapterCapabilities = {
      ...mockAdapterCapabilities,
      supportsStatusComments: false,
      supportsStageMove: true,
    };
    const { saveATSWritebackPolicyAction } =
      await import("@/app/(recruiter)/settings/integrations/ats/actions");
    const formData = new FormData();
    formData.set("connectionId", "ats_conn_1");
    formData.set("reportMode", "status_comment");
    formData.set("moveToExternalStageId", "mock_stage_interview_completed");

    await saveATSWritebackPolicyAction(formData);

    const savedState = mockSaveRuntimeStoreState.mock.calls[0][0];
    expect(savedState.atsConnections[0].writebackPolicy).toEqual({
      reportMode: "status_comment",
      moveToExternalStageId: "mock_stage_interview_completed",
      requiresRecruiterReview: false,
    });
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
