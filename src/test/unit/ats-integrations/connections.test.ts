import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  buildDefaultZohoDemoConnection,
  getATSAdminSnapshot,
} from "@/lib/ats-integrations/connections";
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
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  beforeEach(async () => {
    await resetRuntimeStoreState();
  });

  it("points Zoho demo connections at the configured credential source", () => {
    vi.stubEnv("ZOHO_RECRUIT_ACCESS_TOKEN", "");
    vi.stubEnv("ZOHO_RECRUIT_REFRESH_TOKEN", "refresh_token");
    vi.stubEnv("ZOHO_RECRUIT_CLIENT_ID", "client_id");
    vi.stubEnv("ZOHO_RECRUIT_CLIENT_SECRET", "client_secret");

    const connection = buildDefaultZohoDemoConnection({
      companyId: "company_1",
      now: "2026-05-19T10:00:00.000Z",
    });

    expect(connection).toMatchObject({
      provider: "zoho_recruit",
      status: "active",
      secretRef: "env:ZOHO_RECRUIT_REFRESH_TOKEN",
      lastError: null,
    });
  });

  it("exposes a Zoho OAuth authorization URL for admin setup when redirect settings are configured", async () => {
    vi.stubEnv("ZOHO_RECRUIT_CLIENT_ID", "client_id");
    vi.stubEnv("ZOHO_RECRUIT_CLIENT_SECRET", "client_secret");
    vi.stubEnv(
      "ZOHO_RECRUIT_REDIRECT_URI",
      "https://nacar.test/oauth/zoho/callback",
    );
    vi.stubEnv("ZOHO_RECRUIT_ACCOUNTS_BASE_URL", "https://accounts.zoho.eu");

    const snapshot = await getATSAdminSnapshot(recruiter);

    expect(snapshot.zohoDemoSetup.authorizationUrl).not.toContain(
      "client_secret",
    );

    const url = new URL(snapshot.zohoDemoSetup.authorizationUrl ?? "");
    expect(url.origin).toBe("https://accounts.zoho.eu");
    expect(url.pathname).toBe("/oauth/v2/auth");
    expect(url.searchParams.get("client_id")).toBe("client_id");
    expect(url.searchParams.get("scope")).toBe("ZohoRecruit.modules.ALL");
    expect(url.searchParams.get("access_type")).toBe("offline");
    expect(url.searchParams.get("redirect_uri")).toBe(
      "https://nacar.test/oauth/zoho/callback",
    );
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
    state.atsExternalApplications.push(
      {
        id: "ats_app_1",
        companyId: "company_1",
        connectionId: "ats_conn_1",
        provider: "mock_ats",
        externalId: "mock_app_ana",
        externalCandidateId: "mock_candidate_ana",
        externalJobId: "mock_job_store_associate",
        externalStageId: "mock_stage_breathe_screen",
        externalUrl: null,
        internalCandidateId: "candidate_1",
        internalApplicationId: "application_1",
        internalJobId: "job_1",
        candidateName: "Ana Gomez",
        candidateEmail: "ana@example.com",
        candidatePhone: null,
        jobTitle: "Store Associate",
        stageName: "Breathe Screen",
        stageCategory: "screening",
        status: "active",
        externalUpdatedAt: null,
        lastSeenAt: "2026-05-19T10:01:00.000Z",
        rawSnapshot: {},
      },
      {
        id: "ats_app_other_company",
        companyId: "company_2",
        connectionId: "ats_conn_2",
        provider: "mock_ats",
        externalId: "mock_app_other",
        externalCandidateId: "mock_candidate_other",
        externalJobId: "mock_job_other",
        externalStageId: "mock_stage_other",
        externalUrl: null,
        internalCandidateId: null,
        internalApplicationId: null,
        internalJobId: null,
        candidateName: "Other Candidate",
        candidateEmail: null,
        candidatePhone: null,
        jobTitle: "Other Company Job",
        stageName: "Other Company Stage",
        stageCategory: "screening",
        status: "active",
        externalUpdatedAt: null,
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
    expect(snapshot.externalApplications).toHaveLength(1);
    expect(snapshot.externalApplications[0]).toMatchObject({
      externalId: "mock_app_ana",
      candidateName: "Ana Gomez",
      jobTitle: "Store Associate",
      stageName: "Breathe Screen",
      internalCandidateId: "candidate_1",
    });
  });
});
