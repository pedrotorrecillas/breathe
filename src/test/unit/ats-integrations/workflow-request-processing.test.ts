import { beforeEach, describe, expect, it } from "vitest";

import { processATSWorkflowRequest } from "@/lib/ats-integrations/workflow-requests";
import {
  loadRuntimeStoreState,
  resetRuntimeStoreState,
  saveRuntimeStoreState,
} from "@/lib/db/runtime-store";

describe("ATS workflow request processing", () => {
  beforeEach(async () => {
    await resetRuntimeStoreState();
    const state = await loadRuntimeStoreState();

    state.jobs.push({
      id: "job_1",
      companyId: "company_1",
      title: "Store Associate",
      summary: "Retail role",
      location: "Madrid",
      status: "active",
      interviewLanguage: "es",
      createdAt: "2026-05-19T09:00:00.000Z",
      publishedAt: "2026-05-19T09:00:00.000Z",
      expiresAt: null,
      publicApplyPath: "/apply/job_1",
      pipeline: {
        applicants: 0,
        interviewed: 0,
        shortlisted: 0,
        hired: 0,
        rejected: 0,
      },
      requirements: [],
      interviewLimits: {
        maxInterviews: null,
        outstandingCap: null,
        greatCap: null,
      },
    });
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
      createdAt: "2026-05-19T09:00:00.000Z",
      updatedAt: "2026-05-19T09:00:00.000Z",
    });
    state.atsExternalApplications.push({
      id: "ats_app_1",
      companyId: "company_1",
      connectionId: "ats_conn_1",
      provider: "mock_ats",
      externalId: "mock_app_ana_store_associate",
      externalCandidateId: "mock_candidate_ana",
      externalJobId: "mock_job_store_associate",
      externalStageId: "mock_stage_breathe_screen",
      externalUrl: null,
      internalCandidateId: null,
      internalApplicationId: null,
      internalJobId: "job_1",
      candidateName: "Ana Martin",
      candidateEmail: "ANA@EXAMPLE.COM",
      candidatePhone: "+34 600 000 000",
      jobTitle: "Store Associate",
      stageName: "Breathe Screen",
      stageCategory: "screening",
      status: "active",
      externalUpdatedAt: "2026-05-19T10:00:00.000Z",
      lastSeenAt: "2026-05-19T10:00:00.000Z",
      rawSnapshot: {},
    });
    state.atsWorkflowRequests.push({
      id: "ats_workflow_1",
      companyId: "company_1",
      atsSyncEventId: "ats_evt_1",
      atsTriggerRuleId: "ats_rule_1",
      externalApplicationId: "mock_app_ana_store_associate",
      internalCandidateId: null,
      internalApplicationId: null,
      requestedActions: ["import_candidate"],
      requiresRecruiterApproval: true,
      status: "queued",
      createdAt: "2026-05-19T10:01:00.000Z",
      updatedAt: "2026-05-19T10:01:00.000Z",
    });

    await saveRuntimeStoreState(state);
  });

  it("does not mutate an approval-gated request until it is approved", async () => {
    const result = await processATSWorkflowRequest({
      workflowRequestId: "ats_workflow_1",
      now: "2026-05-19T10:02:00.000Z",
    });

    expect(result.status).toBe("waiting_for_approval");
    const state = await loadRuntimeStoreState();
    expect(state.candidates).toHaveLength(0);
    expect(state.applications).toHaveLength(0);
    expect(state.atsWorkflowRequests[0].status).toBe("queued");
  });

  it("does not process workflow requests that already reached a terminal status", async () => {
    const state = await loadRuntimeStoreState();
    state.atsWorkflowRequests[0] = {
      ...state.atsWorkflowRequests[0],
      status: "completed",
      internalCandidateId: "candidate_existing",
      internalApplicationId: "application_existing",
      updatedAt: "2026-05-19T10:02:00.000Z",
    };
    await saveRuntimeStoreState(state);

    await expect(
      processATSWorkflowRequest({
        workflowRequestId: "ats_workflow_1",
        now: "2026-05-19T10:03:00.000Z",
        approved: true,
      }),
    ).rejects.toThrow("ATS workflow request is not queued for processing.");

    const after = await loadRuntimeStoreState();
    expect(after.candidates).toHaveLength(0);
    expect(after.applications).toHaveLength(0);
    expect(after.atsWorkflowRequests[0]).toMatchObject({
      status: "completed",
      internalCandidateId: "candidate_existing",
      internalApplicationId: "application_existing",
      updatedAt: "2026-05-19T10:02:00.000Z",
    });
  });

  it("imports and links the canonical ATS application after approval", async () => {
    const result = await processATSWorkflowRequest({
      workflowRequestId: "ats_workflow_1",
      now: "2026-05-19T10:03:00.000Z",
      approved: true,
    });

    expect(result.status).toBe("completed");
    const state = await loadRuntimeStoreState();
    expect(state.candidates).toHaveLength(1);
    expect(state.candidates[0]).toMatchObject({
      fullName: "Ana Martin",
      normalizedEmail: "ana@example.com",
      source: "ats",
    });
    expect(state.applications).toHaveLength(1);
    expect(state.applications[0]).toMatchObject({
      candidateId: state.candidates[0].id,
      jobId: "job_1",
      source: "ats",
      stage: "applicant",
    });
    expect(state.atsExternalApplications[0]).toMatchObject({
      internalCandidateId: state.candidates[0].id,
      internalApplicationId: state.applications[0].id,
    });
    expect(state.atsWorkflowRequests[0]).toMatchObject({
      internalCandidateId: state.candidates[0].id,
      internalApplicationId: state.applications[0].id,
      status: "completed",
    });
  });

  it("does not process approved workflow requests when the ATS connection is paused", async () => {
    const state = await loadRuntimeStoreState();
    state.atsConnections[0] = {
      ...state.atsConnections[0],
      status: "paused",
      updatedAt: "2026-05-19T10:02:00.000Z",
    };
    await saveRuntimeStoreState(state);

    await expect(
      processATSWorkflowRequest({
        workflowRequestId: "ats_workflow_1",
        now: "2026-05-19T10:03:00.000Z",
        approved: true,
      }),
    ).rejects.toThrow("ATS connection is not active for workflow request.");

    const after = await loadRuntimeStoreState();
    expect(after.candidates).toHaveLength(0);
    expect(after.applications).toHaveLength(0);
    expect(after.interviewPreparationPackages).toHaveLength(0);
    expect(after.interviewRuns).toHaveLength(0);
    expect(after.atsWorkflowRequests[0]).toMatchObject({
      status: "queued",
      internalCandidateId: null,
      internalApplicationId: null,
      updatedAt: "2026-05-19T10:01:00.000Z",
    });
  });

  it("does not process approved workflow requests when the ATS connection is missing", async () => {
    const state = await loadRuntimeStoreState();
    state.atsConnections = [];
    await saveRuntimeStoreState(state);

    await expect(
      processATSWorkflowRequest({
        workflowRequestId: "ats_workflow_1",
        now: "2026-05-19T10:03:00.000Z",
        approved: true,
      }),
    ).rejects.toThrow("ATS connection not found for workflow request.");

    const after = await loadRuntimeStoreState();
    expect(after.candidates).toHaveLength(0);
    expect(after.applications).toHaveLength(0);
    expect(after.interviewPreparationPackages).toHaveLength(0);
    expect(after.interviewRuns).toHaveLength(0);
    expect(after.atsWorkflowRequests[0]).toMatchObject({
      status: "queued",
      internalCandidateId: null,
      internalApplicationId: null,
      updatedAt: "2026-05-19T10:01:00.000Z",
    });
  });

  it("skips approved workflow requests when the ATS application was archived before processing", async () => {
    const state = await loadRuntimeStoreState();
    state.atsExternalApplications[0] = {
      ...state.atsExternalApplications[0],
      status: "archived_external",
    };
    state.atsWorkflowRequests[0] = {
      ...state.atsWorkflowRequests[0],
      requestedActions: [
        "import_candidate",
        "prepare_interview",
        "queue_interview",
      ],
    };
    await saveRuntimeStoreState(state);

    const result = await processATSWorkflowRequest({
      workflowRequestId: "ats_workflow_1",
      now: "2026-05-19T10:03:00.000Z",
      approved: true,
    });

    expect(result).toMatchObject({
      status: "skipped",
      candidateId: null,
      applicationId: null,
    });
    const after = await loadRuntimeStoreState();
    expect(after.atsWorkflowRequests[0]).toMatchObject({
      status: "skipped",
      internalCandidateId: null,
      internalApplicationId: null,
      updatedAt: "2026-05-19T10:03:00.000Z",
    });
    expect(after.candidates).toHaveLength(0);
    expect(after.applications).toHaveLength(0);
    expect(after.interviewPreparationPackages).toHaveLength(0);
    expect(after.interviewRuns).toHaveLength(0);
  });

  it("uses admin stage mappings when importing the linked Breathe application", async () => {
    const state = await loadRuntimeStoreState();
    state.atsConnections[0] = {
      ...state.atsConnections[0],
      writebackPolicy: {
        reportMode: "candidate_note",
        moveToExternalStageId: null,
        stageMoveMappings: {
          interviewed: "mock_stage_breathe_screen",
          rejected: "mock_stage_rejected",
        },
        requiresRecruiterReview: false,
      },
    };
    await saveRuntimeStoreState(state);

    const result = await processATSWorkflowRequest({
      workflowRequestId: "ats_workflow_1",
      now: "2026-05-19T10:03:00.000Z",
      approved: true,
    });

    expect(result.status).toBe("completed");
    const after = await loadRuntimeStoreState();
    expect(after.applications[0]).toMatchObject({
      stage: "interviewed",
    });
  });

  it("imports the ATS application from the connection that produced the sync event", async () => {
    const state = await loadRuntimeStoreState();
    state.atsExternalApplications.unshift({
      ...state.atsExternalApplications[0],
      id: "ats_app_other_connection",
      connectionId: "ats_conn_other",
      externalCandidateId: "mock_candidate_wrong",
      candidateName: "Wrong Candidate",
      candidateEmail: "wrong@example.com",
      candidatePhone: "+34 611 111 111",
    });
    state.atsSyncEvents.push({
      id: "ats_evt_1",
      companyId: "company_1",
      connectionId: "ats_conn_1",
      provider: "mock_ats",
      eventType: "application_seen",
      externalObjectType: "application",
      externalObjectId: "mock_app_ana_store_associate",
      externalJobId: "mock_job_store_associate",
      externalCandidateId: "mock_candidate_ana",
      externalStageId: "mock_stage_breathe_screen",
      occurredAt: "2026-05-19T10:01:00.000Z",
      processedAt: "2026-05-19T10:01:00.000Z",
      idempotencyKey:
        "ats_conn_1:application_seen:mock_app_ana_store_associate",
      payload: {},
    });
    await saveRuntimeStoreState(state);

    const result = await processATSWorkflowRequest({
      workflowRequestId: "ats_workflow_1",
      now: "2026-05-19T10:03:00.000Z",
      approved: true,
    });

    expect(result.status).toBe("completed");
    const after = await loadRuntimeStoreState();
    expect(after.candidates).toHaveLength(1);
    expect(after.candidates[0]).toMatchObject({
      fullName: "Ana Martin",
      normalizedEmail: "ana@example.com",
    });
    expect(
      after.atsExternalApplications.find((item) => item.id === "ats_app_1"),
    ).toMatchObject({
      internalCandidateId: after.candidates[0].id,
      internalApplicationId: after.applications[0].id,
    });
    expect(
      after.atsExternalApplications.find(
        (item) => item.id === "ats_app_other_connection",
      ),
    ).toMatchObject({
      internalCandidateId: null,
      internalApplicationId: null,
    });
  });

  it("prepares and queues an interview when requested by the ATS trigger", async () => {
    const state = await loadRuntimeStoreState();
    state.atsWorkflowRequests[0] = {
      ...state.atsWorkflowRequests[0],
      requestedActions: [
        "import_candidate",
        "prepare_interview",
        "queue_interview",
      ],
    };
    await saveRuntimeStoreState(state);

    await processATSWorkflowRequest({
      workflowRequestId: "ats_workflow_1",
      now: "2026-05-19T10:04:00.000Z",
      approved: true,
    });

    const after = await loadRuntimeStoreState();
    expect(after.interviewPreparationPackages).toHaveLength(1);
    expect(after.interviewPreparationPackages[0]).toMatchObject({
      jobId: "job_1",
      candidateId: after.candidates[0].id,
      language: "es",
    });
    expect(after.interviewRuns).toHaveLength(1);
    expect(after.interviewRuns[0]).toMatchObject({
      candidateId: after.candidates[0].id,
      applicationId: after.applications[0].id,
      jobId: "job_1",
      interviewPreparationId: after.interviewPreparationPackages[0].id,
      status: "queued",
      pipelineStage: "applicant",
    });
  });

  it("dispatches an interview when requested by the ATS trigger", async () => {
    const state = await loadRuntimeStoreState();
    state.atsWorkflowRequests[0] = {
      ...state.atsWorkflowRequests[0],
      requestedActions: ["dispatch_interview"],
      requiresRecruiterApproval: false,
    };
    await saveRuntimeStoreState(state);

    await processATSWorkflowRequest({
      workflowRequestId: "ats_workflow_1",
      now: "2026-05-19T10:05:00.000Z",
    });

    const after = await loadRuntimeStoreState();
    expect(after.interviewPreparationPackages).toHaveLength(1);
    expect(after.dispatchRequests).toHaveLength(1);
    expect(after.dispatchPayloads).toHaveLength(1);
    expect(after.dispatchResponses).toHaveLength(1);
    expect(after.interviewRuns).toHaveLength(1);
    expect(after.interviewRuns[0]).toMatchObject({
      provider: "happyrobot",
      status: "queued",
      dispatch: {
        dispatchedAt: "2026-05-19T10:05:00.000Z",
        providerCallId: `hr_call_${after.interviewRuns[0].id}`,
        providerAgentId: "gala-v1",
      },
    });
    expect(after.dispatchRequests[0]).toMatchObject({
      interviewRunId: after.interviewRuns[0].id,
      candidateId: after.candidates[0].id,
      applicationId: after.applications[0].id,
    });
    expect(after.dispatchResponses[0]).toMatchObject({
      interviewRunId: after.interviewRuns[0].id,
      success: true,
    });
  });
});
