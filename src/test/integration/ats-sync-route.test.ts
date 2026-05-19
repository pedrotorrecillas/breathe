import { afterEach, describe, expect, it, vi } from "vitest";

const mockRunConfiguredATSSyncs = vi.fn();

vi.mock("@/lib/ats-integrations/scheduled-sync", () => ({
  runConfiguredATSSyncs: (...args: unknown[]) =>
    mockRunConfiguredATSSyncs(...args),
}));

import { POST } from "@/app/api/ats/sync/route";

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
});
