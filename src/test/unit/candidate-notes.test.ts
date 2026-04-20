import { afterEach, describe, expect, it } from "vitest";

import {
  createCandidateNote,
  listCandidateNotesByCandidateIdForJob,
} from "@/lib/candidate-notes";
import { publicApplyTermsVersion } from "@/lib/public-apply";
import {
  resetPublicApplySubmissionStore,
  submitPublicApplication,
} from "@/lib/public-apply-submissions";

describe("candidate notes", () => {
  afterEach(async () => {
    await resetPublicApplySubmissionStore();
  });

  it("stores recruiter notes against the candidate application and lists them chronologically", async () => {
    await submitPublicApplication({
      jobId: "job_warehouse_madrid",
      fullName: "Lucia Torres",
      phone: "+34 600 123 456",
      email: "lucia@example.com",
      language: "en",
      profileSource: {
        linkedinUrl: null,
        cvAssetRef: null,
        cvFileName: null,
      },
      legalAcceptance: {
        acceptedAt: "2026-03-25T12:00:00.000Z",
        termsVersion: publicApplyTermsVersion,
      },
    });

    const firstResult = await createCandidateNote({
      candidateId: "cand_1",
      applicationId: "app_1",
      jobId: "job_warehouse_madrid",
      body: "Strong logistics background.",
      author: {
        userId: "user_1",
        name: "Recruiter Admin",
      },
    });
    const secondResult = await createCandidateNote({
      candidateId: "cand_1",
      applicationId: "app_1",
      jobId: "job_warehouse_madrid",
      body: "Confirm Saturday availability.",
      author: {
        userId: "user_2",
        name: "Hiring Lead",
      },
    });

    expect(firstResult.success).toBe(true);
    expect(secondResult.success).toBe(true);

    const notesByCandidateId = await listCandidateNotesByCandidateIdForJob(
      "job_warehouse_madrid",
      ["cand_1"],
    );

    expect(notesByCandidateId.cand_1).toMatchObject({
      applicationId: "app_1",
      jobId: "job_warehouse_madrid",
    });
    expect(notesByCandidateId.cand_1?.notes).toHaveLength(2);
    expect(notesByCandidateId.cand_1?.notes.map((note) => note.body)).toEqual([
      "Strong logistics background.",
      "Confirm Saturday availability.",
    ]);
    expect(notesByCandidateId.cand_1?.notes.map((note) => note.authorName)).toEqual([
      "Recruiter Admin",
      "Hiring Lead",
    ]);
  });

  it("rejects notes for a candidate application mismatch", async () => {
    const result = await createCandidateNote({
      candidateId: "cand_missing",
      applicationId: "app_missing",
      jobId: "job_warehouse_madrid",
      body: "Should fail.",
      author: {
        userId: "user_1",
        name: "Recruiter Admin",
      },
    });

    expect(result).toEqual({
      success: false,
      error: "Candidate could not be found.",
    });
  });
});
