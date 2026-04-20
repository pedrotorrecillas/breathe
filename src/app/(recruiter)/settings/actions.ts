"use server";

import { revalidatePath } from "next/cache";

import { appendAuditEvent } from "@/lib/audit/log";
import { requireAuthenticatedRecruiter } from "@/lib/auth/server";
import {
  updateAuthenticatedRecruiterProfile,
  updateCompanyProfile,
} from "@/lib/auth/store";
import { recruiterCanManageTeams } from "@/lib/team-access";
import { loadRuntimeStoreState, saveRuntimeStoreState } from "@/lib/db/runtime-store";

export type SettingsActionState = {
  status: "idle" | "success" | "error";
  message: string | null;
};

export const idleSettingsActionState: SettingsActionState = {
  status: "idle",
  message: null,
};

export async function updateProfileAction(
  _previousState: SettingsActionState,
  formData: FormData,
): Promise<SettingsActionState> {
  try {
    const recruiter = await requireAuthenticatedRecruiter();
    const displayName = String(formData.get("displayName") ?? "");

    await updateAuthenticatedRecruiterProfile({
      userId: recruiter.user.id,
      displayName,
    });

    const state = await loadRuntimeStoreState();
    appendAuditEvent({
      state,
      recruiter,
      action: "profile.updated",
      targetType: "user",
      targetId: recruiter.user.id,
      summary: "Updated recruiter profile basics.",
      metadata: {
        displayName,
      },
    });
    await saveRuntimeStoreState(state);

    revalidatePath("/settings");

    return {
      status: "success",
      message: "Profile updated.",
    };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Could not update profile.",
    };
  }
}

export async function updateCompanyAction(
  _previousState: SettingsActionState,
  formData: FormData,
): Promise<SettingsActionState> {
  try {
    const recruiter = await requireAuthenticatedRecruiter();

    if (!recruiterCanManageTeams(recruiter)) {
      throw new Error("Only admins can update company settings.");
    }

    const companyName = String(formData.get("companyName") ?? "");

    await updateCompanyProfile({
      companyId: recruiter.company.id,
      companyName,
    });

    const state = await loadRuntimeStoreState();
    appendAuditEvent({
      state,
      recruiter,
      action: "company.updated",
      targetType: "company",
      targetId: recruiter.company.id,
      summary: "Updated company settings basics.",
      metadata: {
        companyName,
      },
    });
    await saveRuntimeStoreState(state);

    revalidatePath("/settings");

    return {
      status: "success",
      message: "Company settings updated.",
    };
  } catch (error) {
    return {
      status: "error",
      message:
        error instanceof Error ? error.message : "Could not update company settings.",
    };
  }
}
