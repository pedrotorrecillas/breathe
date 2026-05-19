import { afterEach, describe, expect, it, vi } from "vitest";

const mockRunAutoProcessableATSWritebacks = vi.fn();

vi.mock("@/lib/ats-integrations/scheduled-writebacks", () => ({
  runAutoProcessableATSWritebacks: (...args: unknown[]) =>
    mockRunAutoProcessableATSWritebacks(...args),
}));

import { GET, POST } from "@/app/api/ats/writebacks/process/route";

describe("ATS writebacks processing route", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
  });

  it("rejects requests without the configured sync secret", async () => {
    vi.stubEnv("ATS_SYNC_SECRET", "secret-token");

    const response = await POST(
      new Request("http://test.local/api/ats/writebacks/process", {
        method: "POST",
      }),
    );

    expect(response.status).toBe(401);
    expect(mockRunAutoProcessableATSWritebacks).not.toHaveBeenCalled();
  });

  it("processes auto-processable ATS writebacks for authorized requests", async () => {
    vi.stubEnv("ATS_SYNC_SECRET", "secret-token");
    mockRunAutoProcessableATSWritebacks.mockResolvedValue({
      scannedActions: 3,
      attemptedActions: 2,
      succeededActions: 2,
      failedActions: 0,
      results: [],
    });

    const response = await POST(
      new Request("http://test.local/api/ats/writebacks/process", {
        method: "POST",
        headers: {
          authorization: "Bearer secret-token",
        },
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      success: true,
      result: {
        attemptedActions: 2,
        succeededActions: 2,
      },
    });
    expect(mockRunAutoProcessableATSWritebacks).toHaveBeenCalledWith({
      now: expect.any(String),
    });
  });

  it("supports authorized GET requests with CRON_SECRET", async () => {
    vi.stubEnv("ATS_SYNC_SECRET", "");
    vi.stubEnv("CRON_SECRET", "cron-secret");
    mockRunAutoProcessableATSWritebacks.mockResolvedValue({
      scannedActions: 1,
      attemptedActions: 1,
      succeededActions: 1,
      failedActions: 0,
      results: [],
    });

    const response = await GET(
      new Request("http://test.local/api/ats/writebacks/process", {
        method: "GET",
        headers: {
          authorization: "Bearer cron-secret",
        },
      }),
    );

    expect(response.status).toBe(200);
    expect(mockRunAutoProcessableATSWritebacks).toHaveBeenCalledWith({
      now: expect.any(String),
    });
  });

  it("returns a failing status when any writeback processing fails", async () => {
    vi.stubEnv("ATS_SYNC_SECRET", "secret-token");
    mockRunAutoProcessableATSWritebacks.mockResolvedValue({
      scannedActions: 2,
      attemptedActions: 2,
      succeededActions: 1,
      failedActions: 1,
      results: [
        {
          writebackActionId: "ats_writeback_ok",
          companyId: "company_1",
          connectionId: "ats_conn_1",
          provider: "mock_ats",
          status: "succeeded",
          processed: null,
          errorMessage: null,
        },
        {
          writebackActionId: "ats_writeback_failed",
          companyId: "company_1",
          connectionId: "ats_conn_zoho",
          provider: "zoho_recruit",
          status: "failed",
          processed: null,
          errorMessage: "Zoho Recruit request failed with 429.",
        },
      ],
    });

    const response = await POST(
      new Request("http://test.local/api/ats/writebacks/process", {
        method: "POST",
        headers: {
          authorization: "Bearer secret-token",
        },
      }),
    );

    expect(response.status).toBe(502);
    await expect(response.json()).resolves.toMatchObject({
      success: false,
      error: "One or more ATS writebacks failed.",
      result: {
        attemptedActions: 2,
        succeededActions: 1,
        failedActions: 1,
      },
    });
  });
});
