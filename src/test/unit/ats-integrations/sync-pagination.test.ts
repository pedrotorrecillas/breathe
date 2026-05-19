import { beforeEach, describe, expect, it, vi } from "vitest";

import type { ATSAdapter } from "@/lib/ats-integrations/adapters/types";

const listJobs = vi.fn();
const listStages = vi.fn();
const listApplications = vi.fn();
const getCandidate = vi.fn();

vi.mock("@/lib/ats-integrations/registry", () => ({
  getATSAdapter: () =>
    ({
      provider: "mock_ats",
      capabilities: {
        supportsWebhooks: false,
        supportsPolling: true,
        supportsCandidateNotes: true,
        supportsReportLinks: false,
        supportsStageMove: true,
        supportsCustomFields: false,
        supportsAttachments: false,
      },
      validateConnection: vi.fn(),
      listJobs,
      listStages,
      listApplications,
      getCandidate,
      writeback: vi.fn(),
    }) satisfies ATSAdapter,
}));

import { runATSSync } from "@/lib/ats-integrations/sync";
import {
  loadRuntimeStoreState,
  resetRuntimeStoreState,
  saveRuntimeStoreState,
} from "@/lib/db/runtime-store";

describe("ATS sync pagination", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await resetRuntimeStoreState();
    const state = await loadRuntimeStoreState();
    state.atsConnections.push({
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
    });
    await saveRuntimeStoreState(state);
  });

  it("imports every job and application page exposed by the adapter", async () => {
    listJobs
      .mockResolvedValueOnce({
        records: [
          {
            externalId: "job_1",
            externalUrl: null,
            title: "Store Associate",
            status: "active",
            externalUpdatedAt: "2026-05-19T10:00:00.000Z",
            raw: {},
          },
        ],
        nextCursor: "jobs_page_2",
        hasMore: true,
      })
      .mockResolvedValueOnce({
        records: [
          {
            externalId: "job_2",
            externalUrl: null,
            title: "Warehouse Lead",
            status: "active",
            externalUpdatedAt: "2026-05-19T10:01:00.000Z",
            raw: {},
          },
        ],
        nextCursor: null,
        hasMore: false,
      });
    listStages.mockResolvedValue([]);
    listApplications
      .mockResolvedValueOnce({
        records: [
          {
            externalId: "app_1",
            externalCandidateId: "candidate_1",
            externalJobId: "job_1",
            externalStageId: "stage_screen",
            externalUrl: null,
            candidateName: "Ana Martin",
            candidateEmail: "ana@example.com",
            candidatePhone: null,
            jobTitle: "Store Associate",
            stageName: "Breathe Screen",
            stageCategory: "screening",
            status: "active",
            externalUpdatedAt: "2026-05-19T10:00:00.000Z",
            raw: {},
          },
        ],
        nextCursor: "applications_page_2",
        hasMore: true,
      })
      .mockResolvedValueOnce({
        records: [
          {
            externalId: "app_2",
            externalCandidateId: "candidate_2",
            externalJobId: "job_2",
            externalStageId: "stage_screen",
            externalUrl: null,
            candidateName: "Luis Vera",
            candidateEmail: "luis@example.com",
            candidatePhone: null,
            jobTitle: "Warehouse Lead",
            stageName: "Breathe Screen",
            stageCategory: "screening",
            status: "active",
            externalUpdatedAt: "2026-05-19T10:01:00.000Z",
            raw: {},
          },
        ],
        nextCursor: null,
        hasMore: false,
      });
    getCandidate.mockResolvedValue(null);

    const result = await runATSSync({
      companyId: "company_1",
      connectionId: "ats_conn_1",
      now: "2026-05-19T11:00:00.000Z",
    });

    expect(result.importedJobs).toBe(2);
    expect(result.importedApplications).toBe(2);
    expect(listJobs).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ cursor: "jobs_page_2" }),
    );
    expect(listApplications).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ cursor: "applications_page_2" }),
    );
    const state = await loadRuntimeStoreState();
    expect(state.atsExternalJobs.map((job) => job.externalId)).toEqual([
      "job_1",
      "job_2",
    ]);
    expect(
      state.atsExternalApplications.map(
        (application) => application.externalId,
      ),
    ).toEqual(["app_1", "app_2"]);
  });

  it("keeps job-scoped stages separate when providers reuse stage ids", async () => {
    listJobs.mockResolvedValue({
      records: [
        {
          externalId: "job_1",
          externalUrl: null,
          title: "Store Associate",
          status: "active",
          externalUpdatedAt: "2026-05-19T10:00:00.000Z",
          raw: {},
        },
        {
          externalId: "job_2",
          externalUrl: null,
          title: "Warehouse Lead",
          status: "active",
          externalUpdatedAt: "2026-05-19T10:01:00.000Z",
          raw: {},
        },
      ],
      nextCursor: null,
      hasMore: false,
    });
    listStages
      .mockResolvedValueOnce([
        {
          externalId: "screening",
          externalJobId: "job_1",
          name: "Screening",
          category: "screening",
          position: 1,
          raw: {},
        },
      ])
      .mockResolvedValueOnce([
        {
          externalId: "screening",
          externalJobId: "job_2",
          name: "Screening",
          category: "screening",
          position: 1,
          raw: {},
        },
      ]);
    listApplications.mockResolvedValue({
      records: [],
      nextCursor: null,
      hasMore: false,
    });

    const result = await runATSSync({
      companyId: "company_1",
      connectionId: "ats_conn_1",
      now: "2026-05-19T11:00:00.000Z",
    });

    expect(result.importedStages).toBe(2);
    const state = await loadRuntimeStoreState();
    expect(state.atsExternalStages).toHaveLength(2);
    expect(state.atsExternalStages).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          externalId: "screening",
          externalJobId: "job_1",
        }),
        expect.objectContaining({
          externalId: "screening",
          externalJobId: "job_2",
        }),
      ]),
    );
  });

  it("emits an archive event when a known application is archived by the ATS", async () => {
    const state = await loadRuntimeStoreState();
    state.atsExternalApplications.push({
      id: "ats_application_ats_conn_1_app_1",
      companyId: "company_1",
      connectionId: "ats_conn_1",
      provider: "mock_ats",
      externalId: "app_1",
      externalCandidateId: "candidate_1",
      externalJobId: "job_1",
      externalStageId: "stage_screen",
      externalUrl: null,
      internalCandidateId: "candidate_existing",
      internalApplicationId: "application_existing",
      internalJobId: "job_existing",
      candidateName: "Ana Martin",
      candidateEmail: "ana@example.com",
      candidatePhone: null,
      jobTitle: "Store Associate",
      stageName: "Screening",
      stageCategory: "screening",
      status: "active",
      externalUpdatedAt: "2026-05-19T10:00:00.000Z",
      lastSeenAt: "2026-05-19T10:00:00.000Z",
      rawSnapshot: {},
    });
    state.atsTriggerRules.push({
      id: "ats_rule_screen",
      companyId: "company_1",
      connectionId: "ats_conn_1",
      provider: "mock_ats",
      name: "Run screen",
      enabled: true,
      externalJobId: "job_1",
      externalStageId: "stage_screen",
      actions: ["import_candidate"],
      requiresRecruiterApproval: true,
      createdAt: "2026-05-19T10:00:00.000Z",
      updatedAt: "2026-05-19T10:00:00.000Z",
    });
    await saveRuntimeStoreState(state);

    listJobs.mockResolvedValue({
      records: [],
      nextCursor: null,
      hasMore: false,
    });
    listApplications.mockResolvedValue({
      records: [
        {
          externalId: "app_1",
          externalCandidateId: "candidate_1",
          externalJobId: "job_1",
          externalStageId: "stage_screen",
          externalUrl: null,
          candidateName: "Ana Martin",
          candidateEmail: "ana@example.com",
          candidatePhone: null,
          jobTitle: "Store Associate",
          stageName: "Screening",
          stageCategory: "screening",
          status: "archived_external",
          externalUpdatedAt: "2026-05-19T10:30:00.000Z",
          raw: { archived: true },
        },
      ],
      nextCursor: null,
      hasMore: false,
    });
    getCandidate.mockResolvedValue(null);

    const result = await runATSSync({
      companyId: "company_1",
      connectionId: "ats_conn_1",
      now: "2026-05-19T11:00:00.000Z",
    });

    expect(result.createdEvents).toBe(2);
    const afterSync = await loadRuntimeStoreState();
    expect(afterSync.atsExternalApplications[0]).toMatchObject({
      status: "archived_external",
      internalCandidateId: "candidate_existing",
      internalApplicationId: "application_existing",
      internalJobId: "job_existing",
    });
    expect(afterSync.atsSyncEvents).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          eventType: "external_record_archived",
          externalObjectType: "application",
          externalObjectId: "app_1",
          externalJobId: "job_1",
          externalCandidateId: "candidate_1",
          externalStageId: "stage_screen",
          payload: expect.objectContaining({
            previousStatus: "active",
            status: "archived_external",
          }),
        }),
      ]),
    );
    expect(afterSync.atsWorkflowRequests).toHaveLength(0);
  });

  it("creates workflow requests for reused external application ids on different connections", async () => {
    const state = await loadRuntimeStoreState();
    state.atsConnections.push({
      id: "ats_conn_2",
      companyId: "company_1",
      provider: "mock_ats",
      status: "active",
      displayName: "Second Mock ATS",
      authMode: "mock",
      secretRef: null,
      externalAccountId: "mock_account_2",
      lastSyncAt: null,
      lastError: null,
      createdAt: "2026-05-19T10:00:00.000Z",
      updatedAt: "2026-05-19T10:00:00.000Z",
    });
    state.atsTriggerRules.push(
      {
        id: "legacy_rule_shared",
        companyId: "company_1",
        connectionId: "ats_conn_1",
        provider: "mock_ats",
        name: "Shared legacy rule",
        enabled: true,
        externalJobId: "job_shared",
        externalStageId: "screening",
        actions: ["import_candidate"],
        requiresRecruiterApproval: true,
        createdAt: "2026-05-19T10:00:00.000Z",
        updatedAt: "2026-05-19T10:00:00.000Z",
      },
      {
        id: "legacy_rule_shared",
        companyId: "company_1",
        connectionId: "ats_conn_2",
        provider: "mock_ats",
        name: "Shared legacy rule",
        enabled: true,
        externalJobId: "job_shared",
        externalStageId: "screening",
        actions: ["import_candidate"],
        requiresRecruiterApproval: true,
        createdAt: "2026-05-19T10:00:00.000Z",
        updatedAt: "2026-05-19T10:00:00.000Z",
      },
    );
    await saveRuntimeStoreState(state);

    const syncPayload = {
      jobs: {
        records: [
          {
            externalId: "job_shared",
            externalUrl: null,
            title: "Shared Job",
            status: "active",
            externalUpdatedAt: "2026-05-19T10:00:00.000Z",
            raw: {},
          },
        ],
        nextCursor: null,
        hasMore: false,
      },
      applications: {
        records: [
          {
            externalId: "app_shared",
            externalCandidateId: "candidate_shared",
            externalJobId: "job_shared",
            externalStageId: "screening",
            externalUrl: null,
            candidateName: "Ana Martin",
            candidateEmail: "ana@example.com",
            candidatePhone: null,
            jobTitle: "Shared Job",
            stageName: "Screening",
            stageCategory: "screening",
            status: "active",
            externalUpdatedAt: "2026-05-19T10:00:00.000Z",
            raw: {},
          },
        ],
        nextCursor: null,
        hasMore: false,
      },
    };
    listStages.mockResolvedValue([]);
    getCandidate.mockResolvedValue(null);

    listJobs.mockResolvedValueOnce(syncPayload.jobs);
    listApplications.mockResolvedValueOnce(syncPayload.applications);
    const first = await runATSSync({
      companyId: "company_1",
      connectionId: "ats_conn_1",
      now: "2026-05-19T11:00:00.000Z",
    });

    listJobs.mockResolvedValueOnce(syncPayload.jobs);
    listApplications.mockResolvedValueOnce(syncPayload.applications);
    const second = await runATSSync({
      companyId: "company_1",
      connectionId: "ats_conn_2",
      now: "2026-05-19T11:01:00.000Z",
    });

    expect(first.createdWorkflowRequests).toBe(1);
    expect(second.createdWorkflowRequests).toBe(1);
    const afterSync = await loadRuntimeStoreState();
    expect(afterSync.atsWorkflowRequests).toHaveLength(2);
    expect(afterSync.atsWorkflowRequests).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          connectionId: "ats_conn_1",
          externalApplicationId: "app_shared",
        }),
        expect.objectContaining({
          connectionId: "ats_conn_2",
          externalApplicationId: "app_shared",
        }),
      ]),
    );
  });

  it("starts sync from persisted cursors and stores the next checkpoint", async () => {
    const state = await loadRuntimeStoreState();
    state.atsSyncCursors.push(
      {
        id: "ats_cursor_ats_conn_1_jobs",
        companyId: "company_1",
        connectionId: "ats_conn_1",
        provider: "mock_ats",
        resource: "jobs",
        cursor: "jobs_checkpoint_1",
        syncedUntil: "2026-05-19T10:00:00.000Z",
        updatedAt: "2026-05-19T10:00:00.000Z",
      },
      {
        id: "ats_cursor_ats_conn_1_applications",
        companyId: "company_1",
        connectionId: "ats_conn_1",
        provider: "mock_ats",
        resource: "applications",
        cursor: "applications_checkpoint_1",
        syncedUntil: "2026-05-19T10:00:00.000Z",
        updatedAt: "2026-05-19T10:00:00.000Z",
      },
    );
    await saveRuntimeStoreState(state);

    listJobs.mockResolvedValue({
      records: [],
      nextCursor: "jobs_checkpoint_2",
      hasMore: false,
    });
    listStages.mockResolvedValue([]);
    listApplications.mockResolvedValue({
      records: [],
      nextCursor: "applications_checkpoint_2",
      hasMore: false,
    });

    await runATSSync({
      companyId: "company_1",
      connectionId: "ats_conn_1",
      now: "2026-05-19T11:00:00.000Z",
    });

    expect(listJobs).toHaveBeenCalledWith(
      expect.objectContaining({ cursor: "jobs_checkpoint_1" }),
    );
    expect(listApplications).toHaveBeenCalledWith(
      expect.objectContaining({ cursor: "applications_checkpoint_1" }),
    );
    const afterSync = await loadRuntimeStoreState();
    expect(afterSync.atsSyncCursors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "ats_cursor_ats_conn_1_jobs",
          resource: "jobs",
          cursor: "jobs_checkpoint_2",
          syncedUntil: "2026-05-19T11:00:00.000Z",
          updatedAt: "2026-05-19T11:00:00.000Z",
        }),
        expect.objectContaining({
          id: "ats_cursor_ats_conn_1_applications",
          resource: "applications",
          cursor: "applications_checkpoint_2",
          syncedUntil: "2026-05-19T11:00:00.000Z",
          updatedAt: "2026-05-19T11:00:00.000Z",
        }),
      ]),
    );
  });
});
