import { afterEach, describe, expect, it } from "vitest";

import { updateCandidateApplicationStage } from "@/lib/candidate-applications";
import { getJobPipelineSnapshot } from "@/lib/job-pipeline-server";
import { publicApplyTermsVersion } from "@/lib/public-apply";
import {
  loadRuntimeStoreState,
  saveRuntimeStoreState,
} from "@/lib/db/runtime-store";
import {
  receiveHappyRobotWebhook,
  resetPublicApplySubmissionStore,
  submitPublicApplication,
} from "@/lib/public-apply-submissions";

describe("candidate applications", () => {
  afterEach(async () => {
    await resetPublicApplySubmissionStore();
  });

  it("persists recruiter rejections for live applicants", async () => {
    await submitPublicApplication({
      jobId: "job_warehouse_madrid",
      fullName: "Lucia Torres",
      phone: "+34 600 123 456",
      email: "lucia@example.com",
      language: "en",
      profileSource: {
        linkedinUrl: null,
        cvAssetRef: null,
        cvFileName: null,
      },
      legalAcceptance: {
        acceptedAt: "2026-03-25T12:00:00.000Z",
        termsVersion: publicApplyTermsVersion,
      },
    });

    const result = await updateCandidateApplicationStage({
      candidateId: "cand_1",
      jobId: "job_warehouse_madrid",
      action: "reject",
    });

    expect(result).toMatchObject({
      success: true,
      data: {
        id: "app_1",
        stage: "rejected",
        recruiterOutcomeNote: "Rejected from applicants",
      },
    });

    const snapshot = await getJobPipelineSnapshot("warehouse-associate-madrid");

    expect(snapshot?.candidates).toHaveLength(1);
    expect(snapshot?.candidates[0]).toMatchObject({
      id: "cand_1",
      stage: "Rejected",
      rejectedReason: "Rejected from applicants",
    });
  });

  it("queues an ATS stage move when a recruiter changes a linked application stage", async () => {
    const submission = await submitPublicApplication({
      jobId: "job_warehouse_madrid",
      fullName: "Lucia Torres",
      phone: "+34 600 123 456",
      email: "lucia@example.com",
      language: "en",
      profileSource: {
        linkedinUrl: null,
        cvAssetRef: null,
        cvFileName: null,
      },
      legalAcceptance: {
        acceptedAt: "2026-03-25T12:00:00.000Z",
        termsVersion: publicApplyTermsVersion,
      },
    });

    expect(submission.success).toBe(true);

    if (!submission.success) {
      return;
    }

    const seededState = await loadRuntimeStoreState();
    seededState.atsConnections.push({
      id: "ats_conn_1",
      companyId: "company_seed_demo",
      provider: "mock_ats",
      status: "active",
      displayName: "Mock ATS",
      authMode: "mock",
      secretRef: null,
      externalAccountId: "mock_account",
      lastSyncAt: null,
      lastError: null,
      createdAt: "2026-03-25T12:00:00.000Z",
      updatedAt: "2026-03-25T12:00:00.000Z",
      writebackPolicy: {
        reportMode: "candidate_note",
        moveToExternalStageId: null,
        requiresRecruiterReview: true,
        stageMoveMappings: {
          rejected: "mock_stage_rejected",
        },
      },
    });
    seededState.atsExternalStages.push({
      id: "ats_stage_rejected",
      companyId: "company_seed_demo",
      connectionId: "ats_conn_1",
      provider: "mock_ats",
      externalJobId: null,
      externalId: "mock_stage_rejected",
      name: "Rejected",
      category: "rejected",
      position: 4,
      status: "active",
      lastSeenAt: "2026-03-25T12:00:00.000Z",
      rawSnapshot: {},
    });
    seededState.atsExternalApplications.push({
      id: "ats_app_1",
      companyId: "company_seed_demo",
      connectionId: "ats_conn_1",
      provider: "mock_ats",
      externalId: "mock_app_lucia",
      externalCandidateId: "mock_candidate_lucia",
      externalJobId: "mock_job_warehouse",
      externalStageId: "mock_stage_screen",
      externalUrl: null,
      internalCandidateId: submission.data.candidate.id,
      internalApplicationId: submission.data.application.id,
      internalJobId: submission.data.application.jobId,
      candidateName: "Lucia Torres",
      candidateEmail: "lucia@example.com",
      candidatePhone: "+34600123456",
      jobTitle: "Warehouse Operator",
      stageName: "Screen",
      stageCategory: "screening",
      status: "active",
      externalUpdatedAt: "2026-03-25T12:00:00.000Z",
      lastSeenAt: "2026-03-25T12:00:00.000Z",
      rawSnapshot: {},
    });
    await saveRuntimeStoreState(seededState);

    const result = await updateCandidateApplicationStage({
      candidateId: submission.data.candidate.id,
      jobId: submission.data.application.jobId,
      action: "reject",
    });

    expect(result.success).toBe(true);
    const state = await loadRuntimeStoreState();
    expect(state.atsWritebackActions).toHaveLength(1);
    expect(state.atsWritebackActions[0]).toMatchObject({
      connectionId: "ats_conn_1",
      provider: "mock_ats",
      actionType: "application_stage_move",
      targetExternalCandidateId: "mock_candidate_lucia",
      targetExternalApplicationId: "mock_app_lucia",
      targetExternalJobId: "mock_job_warehouse",
      targetExternalStageId: "mock_stage_rejected",
      sourceObjectType: "manual_admin_action",
      sourceObjectId: expect.stringContaining("app_1:rejected:"),
      status: "queued",
    });
  });

  it("persists shortlist and hire actions after interview completion", async () => {
    await submitPublicApplication({
      jobId: "job_warehouse_madrid",
      fullName: "Bea Soto",
      phone: "+34 611 222 333",
      email: "bea@example.com",
      language: "en",
      profileSource: {
        linkedinUrl: null,
        cvAssetRef: null,
        cvFileName: null,
      },
      legalAcceptance: {
        acceptedAt: "2026-03-25T12:00:00.000Z",
        termsVersion: publicApplyTermsVersion,
      },
    });

    await receiveHappyRobotWebhook(
      {
        eventId: "evt_1",
        interviewRunId: "run_1",
        providerCallId: "hr_call_run_1",
        status: "completed",
        happenedAt: "2026-03-25T12:05:00.000Z",
        transcript: "Candidate completed the interview successfully.",
      },
      {
        receivedAt: new Date("2026-03-25T12:05:01.000Z"),
      },
    );

    const shortlistResult = await updateCandidateApplicationStage({
      candidateId: "cand_1",
      jobId: "job_warehouse_madrid",
      action: "shortlist",
    });
    const hireResult = await updateCandidateApplicationStage({
      candidateId: "cand_1",
      jobId: "job_warehouse_madrid",
      action: "hire",
    });

    expect(shortlistResult).toMatchObject({
      success: true,
      data: {
        stage: "shortlisted",
        recruiterOutcomeNote: null,
      },
    });
    expect(hireResult).toMatchObject({
      success: true,
      data: {
        stage: "hired",
        recruiterOutcomeNote: null,
      },
    });

    const snapshot = await getJobPipelineSnapshot("warehouse-associate-madrid");

    expect(snapshot?.candidates).toHaveLength(1);
    expect(snapshot?.candidates[0]).toMatchObject({
      id: "cand_1",
      stage: "Hired",
    });
  });
});
