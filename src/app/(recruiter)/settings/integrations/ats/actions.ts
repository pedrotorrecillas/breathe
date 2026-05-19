"use server";

import { revalidatePath } from "next/cache";

import { appendAuditEvent } from "@/lib/audit/log";
import { requireAuthenticatedRecruiter } from "@/lib/auth/server";
import {
  buildDefaultMockATSConnection,
  buildDefaultZohoDemoConnection,
} from "@/lib/ats-integrations/connections";
import { runATSSync } from "@/lib/ats-integrations/sync";
import {
  loadRuntimeStoreState,
  saveRuntimeStoreState,
} from "@/lib/db/runtime-store";
import { recruiterCanManageTeams } from "@/lib/team-access";

type ATSSettingsActionState = {
  status: "idle" | "success" | "error";
  message: string | null;
};

export const idleATSSettingsActionState: ATSSettingsActionState = {
  status: "idle",
  message: null,
};

function requireATSAdmin(canManage: boolean) {
  if (!canManage) {
    throw new Error("Only admins and owners can manage ATS integrations.");
  }
}

export async function createMockATSConnectionAction(): Promise<ATSSettingsActionState> {
  try {
    const recruiter = await requireAuthenticatedRecruiter();
    requireATSAdmin(recruiterCanManageTeams(recruiter));
    const state = await loadRuntimeStoreState();
    const connection = buildDefaultMockATSConnection({
      companyId: recruiter.company.id,
      now: new Date().toISOString(),
    });

    state.atsConnections.push(connection);
    appendAuditEvent({
      state,
      recruiter,
      action: "ats.connection_created",
      targetType: "ats_connection",
      targetId: connection.id,
      summary: "Created Mock ATS integration connection.",
      metadata: {
        provider: connection.provider,
      },
    });
    await saveRuntimeStoreState(state);
    revalidatePath("/settings/integrations/ats");

    return { status: "success", message: "Mock ATS connection created." };
  } catch (error) {
    return {
      status: "error",
      message:
        error instanceof Error ? error.message : "Could not create ATS connection.",
    };
  }
}

export async function createZohoEnvConnectionAction(): Promise<ATSSettingsActionState> {
  try {
    const recruiter = await requireAuthenticatedRecruiter();
    requireATSAdmin(recruiterCanManageTeams(recruiter));
    const state = await loadRuntimeStoreState();
    const connection = buildDefaultZohoDemoConnection({
      companyId: recruiter.company.id,
      now: new Date().toISOString(),
    });

    state.atsConnections.push(connection);
    appendAuditEvent({
      state,
      recruiter,
      action: "ats.connection_created",
      targetType: "ats_connection",
      targetId: connection.id,
      summary: "Created Zoho Recruit integration connection.",
      metadata: {
        provider: connection.provider,
      },
    });
    await saveRuntimeStoreState(state);
    revalidatePath("/settings/integrations/ats");

    return { status: "success", message: "Zoho Recruit connection created." };
  } catch (error) {
    return {
      status: "error",
      message:
        error instanceof Error ? error.message : "Could not create ATS connection.",
    };
  }
}

export async function runManualATSSyncAction(
  connectionId: string,
): Promise<ATSSettingsActionState> {
  try {
    const recruiter = await requireAuthenticatedRecruiter();
    requireATSAdmin(recruiterCanManageTeams(recruiter));
    const result = await runATSSync({
      companyId: recruiter.company.id,
      connectionId,
      now: new Date().toISOString(),
    });
    const state = await loadRuntimeStoreState();
    appendAuditEvent({
      state,
      recruiter,
      action: "ats.manual_sync",
      targetType: "ats_connection",
      targetId: connectionId,
      summary: "Ran manual ATS sync.",
      metadata: {
        importedApplications: String(result.importedApplications),
        createdEvents: String(result.createdEvents),
      },
    });
    await saveRuntimeStoreState(state);
    revalidatePath("/settings/integrations/ats");

    return { status: "success", message: "ATS sync completed." };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Could not sync ATS.",
    };
  }
}
