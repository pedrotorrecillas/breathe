import { afterEach, describe, expect, it } from "vitest";

import { updateCandidateApplicationStage } from "@/lib/candidate-applications";
import { getJobPipelineSnapshot } from "@/lib/job-pipeline-server";
import { publicApplyTermsVersion } from "@/lib/public-apply";
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
