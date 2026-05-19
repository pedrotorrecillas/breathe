import { describe, expect, it } from "vitest";

import {
  atsProviderKeys,
  isATSProviderKey,
  type ATSCanonicalApplication,
  type ATSConnection,
} from "@/domain/ats-integrations";

describe("ATS integration domain types", () => {
  it("recognizes supported provider keys", () => {
    expect(atsProviderKeys).toEqual([
      "mock_ats",
      "zoho_recruit",
      "recruitee",
      "ashby",
      "teamtailor",
      "greenhouse",
      "lever",
      "kombo",
    ]);
    expect(isATSProviderKey("zoho_recruit")).toBe(true);
    expect(isATSProviderKey("unknown")).toBe(false);
  });

  it("keeps canonical applications provider-neutral", () => {
    const connection: ATSConnection = {
      id: "ats_conn_1",
      companyId: "company_1",
      provider: "zoho_recruit",
      status: "active",
      displayName: "Zoho demo",
      authMode: "env_token",
      secretRef: "env:ZOHO_RECRUIT_ACCESS_TOKEN",
      externalAccountId: "zoho_org_1",
      lastSyncAt: null,
      lastError: null,
      createdAt: "2026-05-19T10:00:00.000Z",
      updatedAt: "2026-05-19T10:00:00.000Z",
    };

    const application: ATSCanonicalApplication = {
      id: "ats_app_1",
      companyId: connection.companyId,
      connectionId: connection.id,
      provider: connection.provider,
      externalId: "candidate_1:job_1",
      externalCandidateId: "candidate_1",
      externalJobId: "job_1",
      externalStageId: "Breathe Screen",
      externalUrl: null,
      internalCandidateId: null,
      internalApplicationId: null,
      internalJobId: null,
      candidateName: "Ana Martin",
      candidateEmail: "ana@example.com",
      candidatePhone: "+34600000000",
      jobTitle: "Store Associate",
      stageName: "Breathe Screen",
      stageCategory: "screening",
      status: "active",
      externalUpdatedAt: "2026-05-19T10:01:00.000Z",
      lastSeenAt: "2026-05-19T10:02:00.000Z",
      rawSnapshot: { providerRecordId: "candidate_1" },
    };

    expect(application.provider).toBe("zoho_recruit");
    expect(Object.keys(application.rawSnapshot)).not.toContain("Candidate_Status");
  });
});
