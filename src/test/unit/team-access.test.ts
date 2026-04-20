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
});
