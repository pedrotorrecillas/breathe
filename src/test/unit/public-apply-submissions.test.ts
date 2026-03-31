import { afterEach, describe, expect, it } from "vitest";

import { publicApplyTermsVersion } from "@/lib/public-apply";
import {
  getPublicApplySubmissionSnapshot,
  resetPublicApplySubmissionStore,
  submitPublicApplication,
} from "@/lib/public-apply-submissions";

describe("public apply submissions", () => {
  afterEach(() => {
    resetPublicApplySubmissionStore();
  });

  it("creates linked candidate, application, and interview run records", () => {
    const result = submitPublicApplication({
      jobId: "job_warehouse_madrid",
      fullName: "Lucia Torres",
      phone: "+34 600 123 456",
      email: "lucia@example.com",
      language: "en",
      profileSource: {
        linkedinUrl: "https://linkedin.com/in/lucia-torres",
        cvAssetRef: null,
        cvFileName: null,
      },
      legalAcceptance: {
        acceptedAt: "2026-03-25T12:00:00.000Z",
        termsVersion: publicApplyTermsVersion,
      },
    });

    expect(result.success).toBe(true);

    if (!result.success) {
      return;
    }

    expect(result.data.application.candidateId).toBe(result.data.candidate.id);
    expect(result.data.interviewRun.candidateId).toBe(result.data.candidate.id);
    expect(result.data.interviewRun.applicationId).toBe(
      result.data.application.id,
    );
    expect(result.data.interviewRun.status).toBe("queued");
    expect(result.data.interviewRun.interviewPreparationId).toBe(
      result.data.interviewPackage.id,
    );
    expect(result.data.callRequest.interviewPackageId).toBe(
      result.data.interviewPackage.id,
    );
    expect(result.data.dispatchResponse.success).toBe(true);
    expect(result.data.interviewRun.dispatch.providerCallId).toBe(
      "hr_call_run_1",
    );
  });

  it("does not persist partial state when a staged failure happens", () => {
    const result = submitPublicApplication(
      {
        jobId: "job_warehouse_madrid",
        fullName: "Lucia Torres",
        phone: "+34 600 123 456",
        email: "lucia@example.com",
        language: "en",
        profileSource: {
          linkedinUrl: "https://linkedin.com/in/lucia-torres",
          cvAssetRef: null,
          cvFileName: null,
        },
        legalAcceptance: {
          acceptedAt: "2026-03-25T12:00:00.000Z",
          termsVersion: publicApplyTermsVersion,
        },
      },
      {
        failureMode: "application",
      },
    );

    expect(result).toEqual({
      success: false,
      error: "Application creation failed before persistence.",
    });
    expect(getPublicApplySubmissionSnapshot()).toEqual({
      candidates: [],
      applications: [],
      interviewRuns: [],
      interviewPreparationPackages: [],
      dispatchRequests: [],
      dispatchPayloads: [],
      dispatchResponses: [],
    });
  });
});
