import { describe, expect, it } from "vitest";

import { POST } from "@/app/api/ats/webhooks/[provider]/route";

describe("ATS webhook route", () => {
  it("rejects unsupported providers", async () => {
    const response = await POST(
      new Request("http://test.local/api/ats/webhooks/unknown", {
        method: "POST",
        body: JSON.stringify({ id: "evt_1" }),
      }),
      { params: Promise.resolve({ provider: "unknown" }) },
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: "Unsupported ATS provider.",
    });
  });

  it("accepts known providers as a stored no-op scaffold", async () => {
    const response = await POST(
      new Request("http://test.local/api/ats/webhooks/mock_ats", {
        method: "POST",
        body: JSON.stringify({ id: "evt_1" }),
      }),
      { params: Promise.resolve({ provider: "mock_ats" }) },
    );

    expect(response.status).toBe(202);
  });
});
