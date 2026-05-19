import { beforeEach, describe, expect, it } from "vitest";

import { getATSAdminSnapshot } from "@/lib/ats-integrations/connections";
import {
  loadRuntimeStoreState,
  resetRuntimeStoreState,
  saveRuntimeStoreState,
} from "@/lib/db/runtime-store";

const recruiter = {
  company: {
    id: "company_1",
  },
} as Parameters<typeof getATSAdminSnapshot>[0];

describe("ATS admin snapshot", () => {
  beforeEach(async () => {
    await resetRuntimeStoreState();
  });

  it("includes imported jobs and stages for admin trigger configuration", async () => {
    const state = await loadRuntimeStoreState();
    state.atsExternalJobs.push(
      {
        id: "ats_job_1",
        companyId: "company_1",
        connectionId: "ats_conn_1",
        provider: "mock_ats",
        externalId: "mock_job_store_associate",
        externalUrl: null,
        title: "Store Associate",
        status: "active",
        externalUpdatedAt: "2026-05-19T10:00:00.000Z",
        lastSeenAt: "2026-05-19T10:01:00.000Z",
        rawSnapshot: {},
      },
      {
        id: "ats_job_other_company",
        companyId: "company_2",
        connectionId: "ats_conn_2",
        provider: "mock_ats",
        externalId: "mock_job_other",
        externalUrl: null,
        title: "Other Company Job",
        status: "active",
        externalUpdatedAt: null,
        lastSeenAt: "2026-05-19T10:01:00.000Z",
        rawSnapshot: {},
      },
    );
    state.atsExternalStages.push(
      {
        id: "ats_stage_1",
        companyId: "company_1",
        connectionId: "ats_conn_1",
        provider: "mock_ats",
        externalJobId: "mock_job_store_associate",
        externalId: "mock_stage_breathe_screen",
        name: "Breathe Screen",
        category: "screening",
        position: 1,
        status: "active",
        lastSeenAt: "2026-05-19T10:01:00.000Z",
        rawSnapshot: {},
      },
      {
        id: "ats_stage_other_company",
        companyId: "company_2",
        connectionId: "ats_conn_2",
        provider: "mock_ats",
        externalJobId: "mock_job_other",
        externalId: "mock_stage_other",
        name: "Other Company Stage",
        category: "screening",
        position: 1,
        status: "active",
        lastSeenAt: "2026-05-19T10:01:00.000Z",
        rawSnapshot: {},
      },
    );
    await saveRuntimeStoreState(state);

    const snapshot = await getATSAdminSnapshot(recruiter);

    expect(snapshot.externalJobs).toHaveLength(1);
    expect(snapshot.externalJobs[0]).toMatchObject({
      externalId: "mock_job_store_associate",
      title: "Store Associate",
    });
    expect(snapshot.externalStages).toHaveLength(1);
    expect(snapshot.externalStages[0]).toMatchObject({
      externalId: "mock_stage_breathe_screen",
      name: "Breathe Screen",
    });
  });
});
