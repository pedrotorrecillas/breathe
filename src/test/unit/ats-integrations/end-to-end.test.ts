import { beforeEach, describe, expect, it } from "vitest";

import { runATSSync } from "@/lib/ats-integrations/sync";
import {
  loadRuntimeStoreState,
  resetRuntimeStoreState,
  saveRuntimeStoreState,
} from "@/lib/db/runtime-store";
import { receiveHappyRobotWebhook } from "@/lib/public-apply-submissions";

describe("ATS integration end-to-end flow", () => {
  beforeEach(async () => {
    await resetRuntimeStoreState();
  });

  it("syncs an ATS application, triggers a Breathe interview, and writes the evaluation back", async () => {
    const state = await loadRuntimeStoreState();
    state.jobs.push({
      id: "job_store_associate",
      companyId: "company_1",
      title: "Store Associate",
      summary: "Retail role",
      location: "Madrid",
      status: "active",
      interviewLanguage: "es",
      createdAt: "2026-05-19T09:00:00.000Z",
      publishedAt: "2026-05-19T09:00:00.000Z",
      expiresAt: null,
      publicApplyPath: "/apply/store-associate",
      pipeline: {
        applicants: 0,
        interviewed: 0,
        shortlisted: 0,
        hired: 0,
        rejected: 0,
      },
      requirements: [
        {
          id: "req_warehouse_experience",
          label: "Warehouse experience",
          importance: "MANDATORY",
          category: "essential",
          evaluationHint:
            "Look for clear evidence of prior warehouse or store work.",
        },
      ],
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
      syncMode: "manual",
      displayName: "Mock ATS",
      authMode: "mock",
      secretRef: null,
      externalAccountId: "mock_account",
      lastSyncAt: null,
      lastError: null,
      createdAt: "2026-05-19T09:00:00.000Z",
      updatedAt: "2026-05-19T09:00:00.000Z",
      writebackPolicy: {
        reportMode: "candidate_note",
        moveToExternalStageId: "mock_stage_interview_completed",
        requiresRecruiterReview: false,
      },
    });
    state.atsTriggerRules.push({
      id: "ats_rule_breathe_screen",
      companyId: "company_1",
      connectionId: "ats_conn_1",
      provider: "mock_ats",
      name: "Run Breathe screen",
      enabled: true,
      externalJobId: "mock_job_store_associate",
      externalStageId: "mock_stage_breathe_screen",
      actions: ["import_candidate", "prepare_interview", "queue_interview"],
      requiresRecruiterApproval: false,
      createdAt: "2026-05-19T09:00:00.000Z",
      updatedAt: "2026-05-19T09:00:00.000Z",
    });
    await saveRuntimeStoreState(state);

    const syncResult = await runATSSync({
      companyId: "company_1",
      connectionId: "ats_conn_1",
      now: "2026-05-19T10:00:00.000Z",
    });

    expect(syncResult.createdWorkflowRequests).toBe(1);
    const afterSync = await loadRuntimeStoreState();
    expect(afterSync.atsWorkflowRequests[0]).toMatchObject({
      status: "completed",
      requestedActions: [
        "import_candidate",
        "prepare_interview",
        "queue_interview",
      ],
    });
    expect(afterSync.candidates).toHaveLength(1);
    expect(afterSync.applications).toHaveLength(1);
    expect(afterSync.interviewRuns).toHaveLength(1);
    expect(afterSync.atsExternalApplications[0]).toMatchObject({
      internalCandidateId: afterSync.candidates[0].id,
      internalApplicationId: afterSync.applications[0].id,
      internalJobId: "job_store_associate",
    });

    const interviewRun = afterSync.interviewRuns[0];
    const webhookResult = await receiveHappyRobotWebhook(
      {
        eventId: "evt_ats_end_to_end",
        interviewRunId: interviewRun.id,
        providerCallId: "hr_call_ats_end_to_end",
        status: "completed",
        happenedAt: "2026-05-19T10:15:00.000Z",
        transcript:
          "I worked in warehouse operations for four years and handled store inventory every week.",
      },
      {
        receivedAt: new Date("2026-05-19T10:15:01.000Z"),
      },
    );

    expect(webhookResult.success).toBe(true);
    const afterWebhook = await loadRuntimeStoreState();
    expect(afterWebhook.evaluations).toHaveLength(1);
    expect(afterWebhook.atsWritebackActions).toHaveLength(2);
    expect(afterWebhook.atsWritebackActions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          actionType: "candidate_note",
          status: "succeeded",
          targetExternalCandidateId: "mock_candidate_ana",
        }),
        expect.objectContaining({
          actionType: "application_stage_move",
          status: "succeeded",
          targetExternalApplicationId: "mock_app_ana_store_associate",
          targetExternalStageId: "mock_stage_interview_completed",
        }),
      ]),
    );
    expect(afterWebhook.atsWritebackAttempts).toHaveLength(2);
    expect(afterWebhook.atsExternalApplications[0]).toMatchObject({
      externalStageId: "mock_stage_interview_completed",
      stageName: "Interview Completed",
      stageCategory: "interview",
    });
  });
});
