import { describe, expect, it } from "vitest";

import {
  mapZohoCandidateToProviderApplication,
  mapZohoCandidateToProviderCandidate,
  mapZohoJobOpeningToProviderJob,
} from "@/lib/ats-integrations/zoho/mappers";

describe("Zoho Recruit mappers", () => {
  it("maps job openings into provider jobs", () => {
    expect(
      mapZohoJobOpeningToProviderJob({
        id: "58431000000012345",
        Posting_Title: "Store Associate",
        Job_Opening_Status: "In-progress",
        Modified_Time: "2026-05-19T10:00:00+02:00",
      }),
    ).toMatchObject({
      externalId: "58431000000012345",
      title: "Store Associate",
      status: "active",
    });
  });

  it("maps candidates into provider candidates and applications", () => {
    const zohoCandidate = {
      id: "58431000000054321",
      Full_Name: "Ana Martin",
      Email: "ana@example.com",
      Mobile: "+34600000000",
      Candidate_Status: "Breathe Screen",
      Associated_Tags: [],
      Modified_Time: "2026-05-19T10:05:00+02:00",
    };

    expect(mapZohoCandidateToProviderCandidate(zohoCandidate)).toMatchObject({
      externalId: "58431000000054321",
      fullName: "Ana Martin",
      email: "ana@example.com",
    });

    expect(
      mapZohoCandidateToProviderApplication({
        candidate: zohoCandidate,
        fallbackJobId: "zoho_job_unknown",
        fallbackJobTitle: "Unknown Zoho Job",
      }),
    ).toMatchObject({
      externalCandidateId: "58431000000054321",
      externalStageId: "Breathe Screen",
      stageName: "Breathe Screen",
      stageCategory: "screening",
    });
  });
});
