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
});
