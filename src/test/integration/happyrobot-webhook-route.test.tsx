import { afterEach, describe, expect, it } from "vitest";

import { POST } from "@/app/api/happyrobot/webhook/route";
import { publicApplyTermsVersion } from "@/lib/public-apply";
import {
  getInterviewEvaluation,
  resetPublicApplySubmissionStore,
  submitPublicApplication,
} from "@/lib/public-apply-submissions";

describe("happyrobot webhook route", () => {
  afterEach(async () => {
    await resetPublicApplySubmissionStore();
  });

  it("ingests a completed callback and stores an evaluation from transcript text", async () => {
    await submitPublicApplication({
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

    const response = await POST(
      new Request("http://localhost/api/happyrobot/webhook", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          eventId: "evt_1",
          interviewRunId: "run_1",
          providerCallId: "hr_call_run_1",
          status: "completed",
          happenedAt: "2026-03-25T12:05:00.000Z",
          recordingUrl: "https://example.com/recording.mp3",
          transcript: "I worked in a warehouse for four years and used handheld scanners daily.",
        }),
      }),
    );

    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.success).toBe(true);
    expect((await getInterviewEvaluation("run_1"))?.finalNumericScore).not.toBeNull();
  });
});
