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

export type TeamActionState = {
  status: "idle" | "success" | "error";
  message: string | null;
};

export const idleTeamActionState: TeamActionState = {
  status: "idle",
  message: null,
};

export async function createTeamAction(
  _previousState: TeamActionState,
  formData: FormData,
): Promise<TeamActionState> {
  try {
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

    return {
      status: "success",
      message: `Team "${name.trim()}" created.`,
    };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Could not create team.",
    };
  }
}

export async function addTeamMemberAction(
  _previousState: TeamActionState,
  formData: FormData,
): Promise<TeamActionState> {
  try {
    const recruiter = await requireAuthenticatedRecruiter();
    const teamId = String(formData.get("teamId") ?? "");
    const email = String(formData.get("email") ?? "");

    await addTeamMemberByEmail({
      recruiter,
      teamId,
      email,
    });

    revalidatePath("/teams");

    return {
      status: "success",
      message: `${email.trim()} added to the team.`,
    };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Could not add team member.",
    };
  }
}

export async function removeTeamMemberAction(
  _previousState: TeamActionState,
  formData: FormData,
): Promise<TeamActionState> {
  try {
    const recruiter = await requireAuthenticatedRecruiter();
    const teamId = String(formData.get("teamId") ?? "");
    const userId = String(formData.get("userId") ?? "");

    const removed = await removeTeamMember({
      recruiter,
      teamId,
      userId,
    });

    revalidatePath("/teams");

    return {
      status: removed ? "success" : "error",
      message: removed ? "Member removed from team." : "Member was not in this team.",
    };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Could not remove team member.",
    };
  }
}

export async function toggleTeamJobAccessAction(
  _previousState: TeamActionState,
  formData: FormData,
): Promise<TeamActionState> {
  try {
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

    return {
      status: "success",
      message: enabled ? "Opportunity access revoked." : "Opportunity access granted.",
    };
  } catch (error) {
    return {
      status: "error",
      message:
        error instanceof Error ? error.message : "Could not change opportunity access.",
    };
  }
}
