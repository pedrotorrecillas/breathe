import { describe, expect, it, vi } from "vitest";

describe("candidate stage route", () => {
  it("persists a recruiter stage action on success", async () => {
    vi.resetModules();

    const updateCandidateApplicationStage = vi.fn(async () => ({
      success: true as const,
      data: {
        id: "app_1",
        companyId: "company_seed_demo",
        candidateId: "cand_1",
        jobId: "job_warehouse_madrid",
        source: "public_apply_link" as const,
        stage: "rejected" as const,
        submittedAt: "2026-03-25T12:00:00.000Z",
        needsHumanReviewAt: null,
        recruiterOutcomeNote: "Rejected from applicants",
        legalAcceptance: null,
      },
    }));

    vi.doMock("@/lib/auth/server", () => ({
      requireAuthenticatedApiRequest: vi.fn(async () => ({
        user: {
          id: "user_1",
          displayName: "Recruiter Admin",
        },
      })),
    }));
    vi.doMock("@/lib/team-access", () => ({
      recruiterCanAccessJobId: vi.fn(async () => true),
    }));
    vi.doMock("@/lib/candidate-applications", () => ({
      updateCandidateApplicationStage,
    }));

    const { POST } = await import(
      "@/app/api/recruiter/candidates/[candidateId]/stage/route"
    );

    const response = await POST(
      new Request("http://localhost:3000/api/recruiter/candidates/cand_1/stage", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          action: "reject",
          jobId: "job_warehouse_madrid",
        }),
      }),
      {
        params: Promise.resolve({
          candidateId: "cand_1",
        }),
      },
    );

    expect(updateCandidateApplicationStage).toHaveBeenCalledWith({
      candidateId: "cand_1",
      jobId: "job_warehouse_madrid",
      action: "reject",
    });
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      success: true,
      data: {
        id: "app_1",
        stage: "rejected",
      },
    });
  });

  it("rejects invalid stage action payloads", async () => {
    vi.resetModules();
    vi.doMock("@/lib/auth/server", () => ({
      requireAuthenticatedApiRequest: vi.fn(async () => ({
        user: {
          id: "user_1",
          displayName: "Recruiter Admin",
        },
      })),
    }));
    vi.doMock("@/lib/team-access", () => ({
      recruiterCanAccessJobId: vi.fn(async () => true),
    }));
    vi.doMock("@/lib/candidate-applications", () => ({
      updateCandidateApplicationStage: vi.fn(),
    }));

    const { POST } = await import(
      "@/app/api/recruiter/candidates/[candidateId]/stage/route"
    );

    const response = await POST(
      new Request("http://localhost:3000/api/recruiter/candidates/cand_1/stage", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          action: "not-a-real-action",
          jobId: "job_warehouse_madrid",
        }),
      }),
      {
        params: Promise.resolve({
          candidateId: "cand_1",
        }),
      },
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      success: false,
      error: "Missing stage action fields.",
    });
  });
});
