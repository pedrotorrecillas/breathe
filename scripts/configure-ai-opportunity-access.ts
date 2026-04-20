import { loadNormalizedRuntimeState } from "@/lib/team-access";
import { saveRuntimeStoreState } from "@/lib/db/runtime-store";
import { randomUUID } from "node:crypto";

async function main() {
  const state = await loadNormalizedRuntimeState();
  const company = state.companies.find((item) => item.slug === "breathe-staging");

  if (!company) {
    throw new Error("Staging company was not found.");
  }

  const ownerUser = state.users.find((item) => item.email === "pedro@vernonteam.com");
  const googleUser = state.users.find((item) => item.email === "ptorrecillas@gmail.com");
  const aiJob = state.jobs.find(
    (item) => item.companyId === company.id && item.recruiterSlug === "ai-native-software-engineer",
  );
  const adminTeam = state.teams.find(
    (item) => item.companyId === company.id && item.slug === "company-admins",
  );

  if (!ownerUser || !googleUser || !aiJob || !adminTeam) {
    throw new Error("Missing owner, google user, AI job, or default team.");
  }

  const googleMembership = state.memberships.find(
    (item) => item.companyId === company.id && item.userId === googleUser.id,
  );

  if (!googleMembership) {
    throw new Error("Google user does not belong to the staging company.");
  }

  googleMembership.role = "recruiter";

  state.teamMemberships = state.teamMemberships.filter(
    (item) => !(item.teamId === adminTeam.id && item.userId === googleUser.id),
  );

  let aiTeam = state.teams.find(
    (item) => item.companyId === company.id && item.slug === "ai-opportunity",
  );

  if (!aiTeam) {
    const now = new Date().toISOString();
    aiTeam = {
      id: `team_${randomUUID()}`,
      companyId: company.id,
      slug: "ai-opportunity",
      name: "AI Opportunity",
      description: "Restricted team for the AI-native Software Engineer role.",
      isDefault: false,
      createdAt: now,
      updatedAt: now,
    };
    state.teams.push(aiTeam);
  }

  for (const user of [ownerUser, googleUser]) {
    const exists = state.teamMemberships.some(
      (item) => item.teamId === aiTeam.id && item.userId === user.id,
    );

    if (!exists) {
      const now = new Date().toISOString();
      state.teamMemberships.push({
        id: `team_membership_${randomUUID()}`,
        companyId: company.id,
        teamId: aiTeam.id,
        userId: user.id,
        createdAt: now,
        updatedAt: now,
      });
    }
  }

  const hasAiGrant = state.jobAccessGrants.some(
    (item) => item.teamId === aiTeam.id && item.jobId === aiJob.id,
  );

  if (!hasAiGrant) {
    const now = new Date().toISOString();
    state.jobAccessGrants.push({
      id: `job_access_${randomUUID()}`,
      companyId: company.id,
      teamId: aiTeam.id,
      jobId: aiJob.id,
      createdAt: now,
      updatedAt: now,
    });
  }

  state.jobAccessGrants = state.jobAccessGrants.filter(
    (item) => !(item.teamId === adminTeam.id && item.jobId === aiJob.id),
  );

  await saveRuntimeStoreState(state);

  console.log(
    JSON.stringify(
      {
        ok: true,
        companyId: company.id,
        aiJobId: aiJob.id,
        aiTeamId: aiTeam.id,
        googleUserId: googleUser.id,
      },
      null,
      2,
    ),
  );
}

void main();
