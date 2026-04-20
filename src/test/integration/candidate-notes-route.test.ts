import { describe, expect, it, vi } from "vitest";

describe("candidate notes route", () => {
  it("returns a recruiter-authored note payload on success", async () => {
    vi.resetModules();
    vi.doMock("@/lib/auth/server", () => ({
      requireAuthenticatedApiRequest: vi.fn(async () => ({
        user: {
          id: "user_1",
          displayName: "Recruiter Admin",
        },
      })),
    }));
    vi.doMock("@/lib/candidate-notes", () => ({
      createCandidateNote: vi.fn(async () => ({
        success: true,
        data: {
          id: "note_1",
          candidateId: "cand_1",
          applicationId: "app_1",
          jobId: "job_warehouse_madrid",
          body: "Internal context",
          createdAt: "2026-03-25T13:00:00.000Z",
          authorUserId: "user_1",
          authorName: "Recruiter Admin",
        },
      })),
    }));

    const { POST } = await import(
      "@/app/api/recruiter/candidates/[candidateId]/notes/route"
    );

    const response = await POST(
      new Request("http://localhost:3000/api/recruiter/candidates/cand_1/notes", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          applicationId: "app_1",
          jobId: "job_warehouse_madrid",
          body: "Internal context",
        }),
      }),
      {
        params: Promise.resolve({
          candidateId: "cand_1",
        }),
      },
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      success: true,
      data: {
        id: "note_1",
        candidateId: "cand_1",
        applicationId: "app_1",
        jobId: "job_warehouse_madrid",
        body: "Internal context",
        createdAt: "2026-03-25T13:00:00.000Z",
        authorUserId: "user_1",
        authorName: "Recruiter Admin",
      },
    });
  });
});
