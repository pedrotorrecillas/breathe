"use server";

import { revalidatePath } from "next/cache";

import { requireAuthenticatedRecruiter } from "@/lib/auth/server";
import {
  addTeamMemberByEmail,
  createTeam,
  grantTeamAccessToJob,
  removeTeamMember,
  revokeTeamAccessToJob,
} from "@/lib/team-access";

export async function createTeamAction(formData: FormData) {
  const recruiter = await requireAuthenticatedRecruiter();
  const name = String(formData.get("name") ?? "");
  const description = String(formData.get("description") ?? "");

  await createTeam({
    recruiter,
    name,
    description,
  });

  revalidatePath("/teams");
  revalidatePath("/jobs");
}

export async function addTeamMemberAction(formData: FormData) {
  const recruiter = await requireAuthenticatedRecruiter();
  const teamId = String(formData.get("teamId") ?? "");
  const email = String(formData.get("email") ?? "");

  await addTeamMemberByEmail({
    recruiter,
    teamId,
    email,
  });

  revalidatePath("/teams");
}

export async function removeTeamMemberAction(formData: FormData) {
  const recruiter = await requireAuthenticatedRecruiter();
  const teamId = String(formData.get("teamId") ?? "");
  const userId = String(formData.get("userId") ?? "");

  await removeTeamMember({
    recruiter,
    teamId,
    userId,
  });

  revalidatePath("/teams");
}

export async function toggleTeamJobAccessAction(formData: FormData) {
  const recruiter = await requireAuthenticatedRecruiter();
  const teamId = String(formData.get("teamId") ?? "");
  const jobId = String(formData.get("jobId") ?? "");
  const enabled = String(formData.get("enabled") ?? "") === "true";

  if (enabled) {
    await revokeTeamAccessToJob({
      recruiter,
      teamId,
      jobId,
    });
  } else {
    await grantTeamAccessToJob({
      recruiter,
      teamId,
      jobId,
    });
  }

  revalidatePath("/teams");
  revalidatePath("/jobs");
}
