import { describe, expect, it, vi } from "vitest";

describe("public apply api route", () => {
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
