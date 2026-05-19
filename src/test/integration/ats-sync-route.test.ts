import { afterEach, describe, expect, it, vi } from "vitest";

const mockRunConfiguredATSSyncs = vi.fn();

vi.mock("@/lib/ats-integrations/scheduled-sync", () => ({
  runConfiguredATSSyncs: (...args: unknown[]) =>
    mockRunConfiguredATSSyncs(...args),
}));

import { GET, POST } from "@/app/api/ats/sync/route";

describe("ATS sync route", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
  });

  it("rejects requests without the configured sync secret", async () => {
    vi.stubEnv("ATS_SYNC_SECRET", "secret-token");

    const response = await POST(
      new Request("http://test.local/api/ats/sync", {
        method: "POST",
      }),
    );

    expect(response.status).toBe(401);
    expect(mockRunConfiguredATSSyncs).not.toHaveBeenCalled();
  });

  it("runs configured ATS syncs for authorized internal requests", async () => {
    vi.stubEnv("ATS_SYNC_SECRET", "secret-token");
    mockRunConfiguredATSSyncs.mockResolvedValue({
      scannedConnections: 2,
      attemptedConnections: 1,
      succeededConnections: 1,
      failedConnections: 0,
      results: [],
    });

    const response = await POST(
      new Request("http://test.local/api/ats/sync", {
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
        attemptedConnections: 1,
        succeededConnections: 1,
      },
    });
    expect(mockRunConfiguredATSSyncs).toHaveBeenCalledWith({
      now: expect.any(String),
    });
  });

  it("supports authorized GET requests for cron-style schedulers", async () => {
    vi.stubEnv("ATS_SYNC_SECRET", "secret-token");
    mockRunConfiguredATSSyncs.mockResolvedValue({
      scannedConnections: 1,
      attemptedConnections: 1,
      succeededConnections: 1,
      failedConnections: 0,
      results: [],
    });

    const response = await GET(
      new Request("http://test.local/api/ats/sync", {
        method: "GET",
        headers: {
          "x-ats-sync-secret": "secret-token",
        },
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      success: true,
      result: {
        scannedConnections: 1,
        attemptedConnections: 1,
      },
    });
    expect(mockRunConfiguredATSSyncs).toHaveBeenCalledWith({
      now: expect.any(String),
    });
  });

  it("accepts CRON_SECRET as the scheduler secret fallback", async () => {
    vi.stubEnv("ATS_SYNC_SECRET", "");
    vi.stubEnv("CRON_SECRET", "cron-secret");
    mockRunConfiguredATSSyncs.mockResolvedValue({
      scannedConnections: 1,
      attemptedConnections: 1,
      succeededConnections: 1,
      failedConnections: 0,
      results: [],
    });

    const response = await GET(
      new Request("http://test.local/api/ats/sync", {
        method: "GET",
        headers: {
          authorization: "Bearer cron-secret",
        },
      }),
    );

    expect(response.status).toBe(200);
    expect(mockRunConfiguredATSSyncs).toHaveBeenCalledWith({
      now: expect.any(String),
    });
  });

  it("returns a failing status when any configured ATS sync fails", async () => {
    vi.stubEnv("ATS_SYNC_SECRET", "secret-token");
    mockRunConfiguredATSSyncs.mockResolvedValue({
      scannedConnections: 2,
      attemptedConnections: 2,
      succeededConnections: 1,
      failedConnections: 1,
      results: [
        {
          connectionId: "ats_conn_ok",
          companyId: "company_1",
          provider: "mock_ats",
          status: "succeeded",
          result: {
            importedJobs: 1,
            importedCandidates: 1,
            importedApplications: 1,
            importedStages: 1,
            createdEvents: 1,
            createdWorkflowRequests: 0,
          },
          errorMessage: null,
        },
        {
          connectionId: "ats_conn_failed",
          companyId: "company_1",
          provider: "zoho_recruit",
          status: "failed",
          result: null,
          errorMessage: "Zoho Recruit request failed with 401.",
        },
      ],
    });

    const response = await POST(
      new Request("http://test.local/api/ats/sync", {
        method: "POST",
        headers: {
          authorization: "Bearer secret-token",
        },
      }),
    );

    expect(response.status).toBe(502);
    await expect(response.json()).resolves.toMatchObject({
      success: false,
      error: "One or more ATS syncs failed.",
      result: {
        attemptedConnections: 2,
        succeededConnections: 1,
        failedConnections: 1,
      },
    });
  });
});
