import { describe, expect, it } from "vitest";

import { getATSAdapter } from "@/lib/ats-integrations/registry";

describe("mock ATS adapter", () => {
  it("lists deterministic jobs, stages, applications, and candidates", async () => {
    const adapter = getATSAdapter("mock_ats");
    const connection = {
      id: "ats_conn_1",
      companyId: "company_1",
      provider: "mock_ats" as const,
      status: "active" as const,
      displayName: "Mock ATS",
      authMode: "mock" as const,
      secretRef: null,
      externalAccountId: "mock_account",
      lastSyncAt: null,
      lastError: null,
      createdAt: "2026-05-19T10:00:00.000Z",
      updatedAt: "2026-05-19T10:00:00.000Z",
    };

    await expect(adapter.validateConnection({ connection })).resolves.toMatchObject({
      ok: true,
    });

    const jobs = await adapter.listJobs({ connection, cursor: null, limit: 50 });
    expect(jobs.records[0]).toMatchObject({
      externalId: "mock_job_store_associate",
      title: "Store Associate",
    });

    const stages = await adapter.listStages({
      connection,
      externalJobId: "mock_job_store_associate",
    });
    expect(stages.map((stage) => stage.name)).toContain("Breathe Screen");

    const apps = await adapter.listApplications({
      connection,
      cursor: null,
      limit: 50,
    });
    expect(apps.records[0]).toMatchObject({
      externalCandidateId: "mock_candidate_ana",
      externalStageId: "mock_stage_breathe_screen",
    });

    await expect(
      adapter.getCandidate({
        connection,
        externalCandidateId: "mock_candidate_ana",
      }),
    ).resolves.toMatchObject({
      externalId: "mock_candidate_ana",
      fullName: "Ana Martin",
    });
  });
});
