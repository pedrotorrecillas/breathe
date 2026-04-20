import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  authenticateUser,
  createAuthUser,
} from "@/lib/auth/store";
import { resetRuntimeStoreState } from "@/lib/db/runtime-store";
import {
  addTeamMemberByEmail,
  createTeam,
  listRecruiterScopedJobs,
  loadNormalizedRuntimeState,
  revokeTeamAccessToJob,
  grantTeamAccessToJob,
} from "@/lib/team-access";
import { saveStoredJob } from "@/lib/db/runtime-store";

describe("team access", () => {
  beforeEach(async () => {
    await resetRuntimeStoreState();
  });

  afterEach(async () => {
    await resetRuntimeStoreState();
  });

  it("creates a default admin team and scopes job visibility through team grants", async () => {
    await createAuthUser({
      companyName: "Breathe Recruiting",
      companySlug: "breathe-recruiting",
      displayName: "Owner",
      email: "owner@breathe.test",
      password: "secret-123",
      role: "owner",
    });

    await createAuthUser({
      companyName: "Breathe Recruiting",
      companySlug: "breathe-recruiting",
      displayName: "Recruiter",
      email: "recruiter@breathe.test",
      password: "secret-123",
      role: "recruiter",
    });

    const owner = await authenticateUser("owner@breathe.test", "secret-123");
    const recruiter = await authenticateUser(
      "recruiter@breathe.test",
      "secret-123",
    );

    expect(owner).not.toBeNull();
    expect(recruiter).not.toBeNull();

    const normalized = await loadNormalizedRuntimeState();
    const adminTeam = normalized.teams.find((team) => team.isDefault);
    const aiJob = normalized.jobs.find(
      (job) => job.recruiterSlug === "warehouse-associate-madrid",
    );

    expect(adminTeam).toBeDefined();
    expect(aiJob?.companyId).toBe(owner?.recruiter.company.id);

    const aiTeam = await createTeam({
      recruiter: owner!.recruiter,
      name: "AI Opportunity",
      description: "Restricted access for the AI opportunity.",
    });

    await addTeamMemberByEmail({
      recruiter: owner!.recruiter,
      teamId: aiTeam.id,
      email: "owner@breathe.test",
    });
    await addTeamMemberByEmail({
      recruiter: owner!.recruiter,
      teamId: aiTeam.id,
      email: "recruiter@breathe.test",
    });

    await grantTeamAccessToJob({
      recruiter: owner!.recruiter,
      teamId: aiTeam.id,
      jobId: aiJob!.id,
    });

    await revokeTeamAccessToJob({
      recruiter: owner!.recruiter,
      teamId: adminTeam!.id,
      jobId: aiJob!.id,
    });

    const ownerJobs = await listRecruiterScopedJobs(owner!.recruiter);
    const recruiterJobs = await listRecruiterScopedJobs(recruiter!.recruiter);

    expect(ownerJobs.some((job) => job.id === aiJob!.id)).toBe(true);
    expect(recruiterJobs.map((job) => job.id)).toEqual([aiJob!.id]);
  });

  it("does not reassign shared demo jobs to the last company in multi-company states", async () => {
    await createAuthUser({
      companyName: "Breathe Recruiting",
      companySlug: "breathe-recruiting",
      displayName: "Owner A",
      email: "owner-a@breathe.test",
      password: "secret-123",
      role: "owner",
    });

    await createAuthUser({
      companyName: "Second Company",
      companySlug: "second-company",
      displayName: "Owner B",
      email: "owner-b@breathe.test",
      password: "secret-123",
      role: "owner",
    });

    const ownerA = await authenticateUser("owner-a@breathe.test", "secret-123");
    const ownerB = await authenticateUser("owner-b@breathe.test", "secret-123");

    expect(ownerA).not.toBeNull();
    expect(ownerB).not.toBeNull();

    await saveStoredJob({
      id: "job_second_company_ops",
      companyId: ownerB!.recruiter.company.id,
      recruiterSlug: "second-company-ops",
      title: "Second Company Ops",
      summary: "Scoped job owned by the second company.",
      description: "A company-specific role used to verify normalization behavior.",
      location: "Madrid",
      salary: null,
      schedule: null,
      status: "active",
      interviewLanguage: "en",
      createdAt: "2026-03-25T10:00:00.000Z",
      publishedAt: "2026-03-25T10:00:00.000Z",
      expiresAt: null,
      publicApplyPath: "/apply/second-company-ops",
      pipeline: {
        applicants: 0,
        interviewed: 0,
        shortlisted: 0,
        hired: 0,
        rejected: 0,
      },
      requirements: [],
      interviewLimits: {
        maxInterviews: null,
        outstandingCap: null,
        greatCap: null,
      },
    });

    const normalized = await loadNormalizedRuntimeState();
    const sharedDemoJob = normalized.jobs.find(
      (job) => job.recruiterSlug === "warehouse-associate-madrid",
    );
    const secondCompanyJob = normalized.jobs.find(
      (job) => job.recruiterSlug === "second-company-ops",
    );

    expect(sharedDemoJob?.companyId).toBe("company_seed_demo");
    expect(secondCompanyJob?.companyId).toBe(ownerB!.recruiter.company.id);

    const ownerAJobs = await listRecruiterScopedJobs(ownerA!.recruiter);
    const ownerBJobs = await listRecruiterScopedJobs(ownerB!.recruiter);

    expect(ownerAJobs.some((job) => job.id === sharedDemoJob?.id)).toBe(false);
    expect(ownerBJobs.some((job) => job.id === sharedDemoJob?.id)).toBe(false);
    expect(ownerBJobs.map((job) => job.id)).toContain("job_second_company_ops");
  });
});
