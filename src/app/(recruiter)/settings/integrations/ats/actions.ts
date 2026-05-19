"use server";

import { revalidatePath } from "next/cache";

import { appendAuditEvent } from "@/lib/audit/log";
import type { ATSTriggerAction, ATSWritebackPolicy } from "@/domain/ats-integrations/types";
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

function requireATSAdmin(canManage: boolean) {
  if (!canManage) {
    throw new Error("Only admins and owners can manage ATS integrations.");
  }
}

export async function createMockATSConnectionAction(
  formData: FormData,
): Promise<void> {
  void formData;

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
  } catch (error) {
    throw new Error(
      error instanceof Error ? error.message : "Could not create ATS connection.",
    );
  }
}

export async function createZohoEnvConnectionAction(
  formData: FormData,
): Promise<void> {
  void formData;

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
  } catch (error) {
    throw new Error(
      error instanceof Error ? error.message : "Could not create ATS connection.",
    );
  }
}

export async function runManualATSSyncAction(
  formData: FormData,
): Promise<void> {
  try {
    const recruiter = await requireAuthenticatedRecruiter();
    requireATSAdmin(recruiterCanManageTeams(recruiter));
    const connectionId = String(formData.get("connectionId") ?? "");

    if (!connectionId) {
      throw new Error("Choose an ATS connection to sync.");
    }

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
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : "Could not sync ATS.");
  }
}

export async function saveATSTriggerRuleAction(
  formData: FormData,
): Promise<void> {
  try {
    const recruiter = await requireAuthenticatedRecruiter();
    requireATSAdmin(recruiterCanManageTeams(recruiter));
    const connectionId = String(formData.get("connectionId") ?? "");
    const externalStageId = String(formData.get("externalStageId") ?? "").trim();
    const externalJobId = String(formData.get("externalJobId") ?? "").trim() || null;

    if (!connectionId || !externalStageId) {
      throw new Error("Choose a connection and external stage.");
    }

    const state = await loadRuntimeStoreState();
    const connection = state.atsConnections.find(
      (item) => item.id === connectionId && item.companyId === recruiter.company.id,
    );

    if (!connection) {
      throw new Error("ATS connection not found.");
    }

    const now = new Date().toISOString();
    const actions: ATSTriggerAction[] = [
      "import_candidate",
      "prepare_interview",
      "queue_interview",
    ];
    const rule = {
      id: `ats_rule_${connectionId}_${externalStageId}`.replace(
        /[^a-zA-Z0-9_]+/g,
        "_",
      ),
      companyId: recruiter.company.id,
      connectionId,
      provider: connection.provider,
      name: `Run Breathe at ${externalStageId}`,
      enabled: true,
      externalJobId,
      externalStageId,
      actions,
      requiresRecruiterApproval: true,
      createdAt: now,
      updatedAt: now,
    };
    const existingIndex = state.atsTriggerRules.findIndex(
      (item) => item.id === rule.id,
    );

    if (existingIndex >= 0) {
      state.atsTriggerRules[existingIndex] = {
        ...state.atsTriggerRules[existingIndex],
        ...rule,
        createdAt: state.atsTriggerRules[existingIndex].createdAt,
      };
    } else {
      state.atsTriggerRules.push(rule);
    }

    appendAuditEvent({
      state,
      recruiter,
      action: "ats.trigger_rule_saved",
      targetType: "ats_trigger_rule",
      targetId: rule.id,
      summary: "Saved ATS stage trigger rule.",
      metadata: {
        provider: connection.provider,
        externalStageId,
      },
    });
    await saveRuntimeStoreState(state);
    revalidatePath("/settings/integrations/ats");
  } catch (error) {
    throw new Error(
      error instanceof Error ? error.message : "Could not save trigger rule.",
    );
  }
}

export async function saveATSWritebackPolicyAction(
  formData: FormData,
): Promise<void> {
  try {
    const recruiter = await requireAuthenticatedRecruiter();
    requireATSAdmin(recruiterCanManageTeams(recruiter));
    const connectionId = String(formData.get("connectionId") ?? "");
    const reportModeValue = String(formData.get("reportMode") ?? "");
    const moveToExternalStageId =
      String(formData.get("moveToExternalStageId") ?? "").trim() || null;
    const reportMode: ATSWritebackPolicy["reportMode"] =
      reportModeValue === "status_comment" || reportModeValue === "disabled"
        ? reportModeValue
        : "candidate_note";

    if (!connectionId) {
      throw new Error("Choose an ATS connection for writeback policy.");
    }

    const state = await loadRuntimeStoreState();
    const connection = state.atsConnections.find(
      (item) => item.id === connectionId && item.companyId === recruiter.company.id,
    );

    if (!connection) {
      throw new Error("ATS connection not found.");
    }

    const policy: ATSWritebackPolicy = {
      reportMode,
      moveToExternalStageId,
      requiresRecruiterReview: true,
    };

    state.atsConnections = state.atsConnections.map((item) =>
      item.id === connection.id
        ? {
            ...item,
            writebackPolicy: policy,
            updatedAt: new Date().toISOString(),
          }
        : item,
    );

    appendAuditEvent({
      state,
      recruiter,
      action: "ats.writeback_policy_saved",
      targetType: "ats_connection",
      targetId: connection.id,
      summary: "Saved ATS writeback policy.",
      metadata: {
        provider: connection.provider,
        reportMode,
        moveToExternalStageId,
      },
    });
    await saveRuntimeStoreState(state);
    revalidatePath("/settings/integrations/ats");
  } catch (error) {
    throw new Error(
      error instanceof Error ? error.message : "Could not save writeback policy.",
    );
  }
}
