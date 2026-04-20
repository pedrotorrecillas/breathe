import { describe, expect, it, vi } from "vitest";

import { publicApplyTermsVersion } from "@/lib/public-apply";
import { resetPublicApplySubmissionStore } from "@/lib/public-apply-submissions";

describe("public apply api route", () => {
  it("rejects inactive jobs even when the route is called directly", async () => {
    vi.resetModules();

    const { POST } = await import("@/app/api/public-apply/route");

    const response = await POST(
      new Request("http://localhost:3000/api/public-apply", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          jobId: "job_retail_barcelona",
          fullName: "Lucia Torres",
          phone: "+34 600 123 456",
          email: "lucia@example.com",
          language: "es",
          profileSource: {
            linkedinUrl: "https://linkedin.com/in/lucia-torres",
            cvAssetRef: null,
            cvFileName: null,
          },
          legalAcceptance: {
            acceptedAt: "2026-03-25T12:00:00.000Z",
            termsVersion: publicApplyTermsVersion,
          },
        }),
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      success: false,
      error: "Application intake is closed for this job.",
    });

    await resetPublicApplySubmissionStore();
  });

  it("returns structured json when submission throws unexpectedly", async () => {
    vi.resetModules();
    vi.doMock("@/lib/public-apply-submissions", () => ({
      submitPublicApplication: vi.fn(async () => {
        throw new Error("Failed to save runtime state to Postgres. connection dropped");
      }),
    }));

    const { POST } = await import("@/app/api/public-apply/route");

    const response = await POST(
      new Request("http://localhost:3000/api/public-apply", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          jobId: "job_product-manager",
        }),
      }),
    );

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      success: false,
      error: "Failed to save runtime state to Postgres. connection dropped",
    });
  });
});
