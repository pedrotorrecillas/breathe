"use server";

import { revalidatePath } from "next/cache";

import { appendAuditEvent } from "@/lib/audit/log";
import type {
  ATSTriggerAction,
  ATSWritebackPolicy,
} from "@/domain/ats-integrations/types";
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
import { processATSWorkflowRequest } from "@/lib/ats-integrations/workflow-requests";
import { processATSWritebackAction } from "@/lib/ats-integrations/writeback";
import { getATSAdapter } from "@/lib/ats-integrations/registry";

const atsTriggerActions: ATSTriggerAction[] = [
  "import_candidate",
  "prepare_interview",
  "queue_interview",
  "dispatch_interview",
];

function requireATSAdmin(canManage: boolean) {
  if (!canManage) {
    throw new Error("Only admins and owners can manage ATS integrations.");
  }
}

function parseTriggerActions(formData: FormData): ATSTriggerAction[] {
  const selectedActions = formData
    .getAll("actions")
    .filter((value): value is ATSTriggerAction =>
      atsTriggerActions.includes(value as ATSTriggerAction),
    );

  return Array.from(new Set(selectedActions));
}

function sanitizeATSRulePart(value: string) {
  return value.replace(/[^a-zA-Z0-9_]+/g, "_").replace(/^_+|_+$/g, "");
}

function buildTriggerRuleId(input: {
  connectionId: string;
  externalJobId: string | null;
  externalStageId: string;
}) {
  return `ats_rule_${sanitizeATSRulePart(input.connectionId)}_${sanitizeATSRulePart(
    input.externalJobId ?? "any_job",
  )}_${sanitizeATSRulePart(input.externalStageId)}`;
}

async function requireOwnedWorkflowRequest(input: {
  workflowRequestId: string;
  companyId: string;
}) {
  const state = await loadRuntimeStoreState();
  const request = state.atsWorkflowRequests.find(
    (item) =>
      item.id === input.workflowRequestId &&
      item.companyId === input.companyId,
  );

  if (!request) {
    throw new Error("ATS workflow request not found.");
  }
}

async function requireOwnedWritebackAction(input: {
  writebackActionId: string;
  companyId: string;
}) {
  const state = await loadRuntimeStoreState();
  const action = state.atsWritebackActions.find(
    (item) =>
      item.id === input.writebackActionId &&
      item.companyId === input.companyId,
  );

  if (!action) {
    throw new Error("ATS writeback action not found.");
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
      error instanceof Error
        ? error.message
        : "Could not create ATS connection.",
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
      error instanceof Error
        ? error.message
        : "Could not create ATS connection.",
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
        createdWorkflowRequests: String(result.createdWorkflowRequests),
      },
    });
    await saveRuntimeStoreState(state);
    revalidatePath("/settings/integrations/ats");
  } catch (error) {
    throw new Error(
      error instanceof Error ? error.message : "Could not sync ATS.",
    );
  }
}

export async function testATSConnectionAction(
  formData: FormData,
): Promise<void> {
  try {
    const recruiter = await requireAuthenticatedRecruiter();
    requireATSAdmin(recruiterCanManageTeams(recruiter));
    const connectionId = String(formData.get("connectionId") ?? "");

    if (!connectionId) {
      throw new Error("Choose an ATS connection to test.");
    }

    const state = await loadRuntimeStoreState();
    const connection = state.atsConnections.find(
      (item) =>
        item.id === connectionId && item.companyId === recruiter.company.id,
    );

    if (!connection) {
      throw new Error("ATS connection not found.");
    }

    const adapter = getATSAdapter(connection.provider);
    const check = await adapter
      .validateConnection({ connection })
      .catch((error: unknown) => ({
        ok: false,
        externalAccountId: null,
        message:
          error instanceof Error
            ? error.message
            : "ATS provider validation failed.",
      }));
    const now = new Date().toISOString();

    state.atsConnections = state.atsConnections.map((item) =>
      item.id === connection.id
        ? {
            ...item,
            status: check.ok ? "active" : "error",
            externalAccountId:
              check.externalAccountId ?? item.externalAccountId,
            lastError: check.ok ? null : check.message,
            updatedAt: now,
          }
        : item,
    );

    appendAuditEvent({
      state,
      recruiter,
      action: "ats.connection_tested",
      targetType: "ats_connection",
      targetId: connection.id,
      summary: "Tested ATS integration connection.",
      metadata: {
        provider: connection.provider,
        ok: check.ok,
        message: check.message,
      },
    });
    await saveRuntimeStoreState(state);
    revalidatePath("/settings/integrations/ats");
  } catch (error) {
    throw new Error(
      error instanceof Error ? error.message : "Could not test ATS connection.",
    );
  }
}

export async function saveATSTriggerRuleAction(
  formData: FormData,
): Promise<void> {
  try {
    const recruiter = await requireAuthenticatedRecruiter();
    requireATSAdmin(recruiterCanManageTeams(recruiter));
    const connectionId = String(formData.get("connectionId") ?? "");
    const externalStageId = String(
      formData.get("externalStageId") ?? "",
    ).trim();
    const externalJobId =
      String(formData.get("externalJobId") ?? "").trim() || null;
    const actions = parseTriggerActions(formData);
    const requiresRecruiterApproval =
      formData.get("requiresRecruiterApproval") === "on";

    if (!connectionId || !externalStageId) {
      throw new Error("Choose a connection and external stage.");
    }

    if (actions.length === 0) {
      throw new Error(
        "Choose at least one Breathe action for the ATS trigger.",
      );
    }

    const state = await loadRuntimeStoreState();
    const connection = state.atsConnections.find(
      (item) =>
        item.id === connectionId && item.companyId === recruiter.company.id,
    );

    if (!connection) {
      throw new Error("ATS connection not found.");
    }

    const connectionStages = (state.atsExternalStages ?? []).filter(
      (stage) =>
        stage.companyId === recruiter.company.id &&
        stage.connectionId === connection.id,
    );
    const connectionJobs = (state.atsExternalJobs ?? []).filter(
      (job) =>
        job.companyId === recruiter.company.id &&
        job.connectionId === connection.id,
    );

    if (
      connectionStages.length > 0 &&
      !connectionStages.some((stage) => stage.externalId === externalStageId)
    ) {
      throw new Error(
        "Choose a trigger stage from the selected ATS connection.",
      );
    }

    if (
      externalJobId &&
      connectionJobs.length > 0 &&
      !connectionJobs.some((job) => job.externalId === externalJobId)
    ) {
      throw new Error("Choose a trigger job from the selected ATS connection.");
    }

    const now = new Date().toISOString();
    const rule = {
      id: buildTriggerRuleId({
        connectionId,
        externalJobId,
        externalStageId,
      }),
      companyId: recruiter.company.id,
      connectionId,
      provider: connection.provider,
      name: `Run Breathe at ${externalStageId}`,
      enabled: true,
      externalJobId,
      externalStageId,
      actions,
      requiresRecruiterApproval,
      createdAt: now,
      updatedAt: now,
    };
    const existingIndex = state.atsTriggerRules.findIndex(
      (item) =>
        item.id === rule.id ||
        (item.companyId === rule.companyId &&
          item.connectionId === rule.connectionId &&
          item.externalJobId === rule.externalJobId &&
          item.externalStageId === rule.externalStageId),
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

export async function approveATSWorkflowRequestAction(
  formData: FormData,
): Promise<void> {
  try {
    const recruiter = await requireAuthenticatedRecruiter();
    requireATSAdmin(recruiterCanManageTeams(recruiter));
    const workflowRequestId = String(formData.get("workflowRequestId") ?? "");

    if (!workflowRequestId) {
      throw new Error("Choose an ATS workflow request to approve.");
    }

    await requireOwnedWorkflowRequest({
      workflowRequestId,
      companyId: recruiter.company.id,
    });

    const processed = await processATSWorkflowRequest({
      workflowRequestId,
      now: new Date().toISOString(),
      approved: true,
    });
    const state = await loadRuntimeStoreState();

    appendAuditEvent({
      state,
      recruiter,
      action: "ats.workflow_request_processed",
      targetType: "ats_workflow_request",
      targetId: workflowRequestId,
      summary: "Approved and processed ATS workflow request.",
      metadata: {
        status: processed.status,
        candidateId: processed.candidateId,
        applicationId: processed.applicationId,
      },
    });
    await saveRuntimeStoreState(state);
    revalidatePath("/settings/integrations/ats");
  } catch (error) {
    throw new Error(
      error instanceof Error
        ? error.message
        : "Could not process ATS workflow request.",
    );
  }
}

export async function processATSWritebackActionAction(
  formData: FormData,
): Promise<void> {
  try {
    const recruiter = await requireAuthenticatedRecruiter();
    requireATSAdmin(recruiterCanManageTeams(recruiter));
    const writebackActionId = String(formData.get("writebackActionId") ?? "");

    if (!writebackActionId) {
      throw new Error("Choose an ATS writeback action to process.");
    }

    await requireOwnedWritebackAction({
      writebackActionId,
      companyId: recruiter.company.id,
    });

    const processed = await processATSWritebackAction({
      writebackActionId,
      now: new Date().toISOString(),
    });
    const state = await loadRuntimeStoreState();

    appendAuditEvent({
      state,
      recruiter,
      action: "ats.writeback_action_processed",
      targetType: "ats_writeback_action",
      targetId: writebackActionId,
      summary: "Processed ATS writeback action.",
      metadata: {
        status: processed.action.status,
        attemptId: processed.attempt.id,
        attemptStatus: processed.attempt.status,
      },
    });
    await saveRuntimeStoreState(state);
    revalidatePath("/settings/integrations/ats");
  } catch (error) {
    throw new Error(
      error instanceof Error
        ? error.message
        : "Could not process ATS writeback action.",
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
    const requiresRecruiterReview =
      formData.get("requiresRecruiterReview") === "on";
    const reportMode: ATSWritebackPolicy["reportMode"] =
      reportModeValue === "status_comment" || reportModeValue === "disabled"
        ? reportModeValue
        : "candidate_note";

    if (!connectionId) {
      throw new Error("Choose an ATS connection for writeback policy.");
    }

    const state = await loadRuntimeStoreState();
    const connection = state.atsConnections.find(
      (item) =>
        item.id === connectionId && item.companyId === recruiter.company.id,
    );

    if (!connection) {
      throw new Error("ATS connection not found.");
    }

    const connectionStages = (state.atsExternalStages ?? []).filter(
      (stage) =>
        stage.companyId === recruiter.company.id &&
        stage.connectionId === connection.id,
    );

    if (
      moveToExternalStageId &&
      connectionStages.length > 0 &&
      !connectionStages.some(
        (stage) => stage.externalId === moveToExternalStageId,
      )
    ) {
      throw new Error(
        "Choose a writeback target stage from the selected ATS connection.",
      );
    }

    const policy: ATSWritebackPolicy = {
      reportMode,
      moveToExternalStageId,
      requiresRecruiterReview,
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
        requiresRecruiterReview,
      },
    });
    await saveRuntimeStoreState(state);
    revalidatePath("/settings/integrations/ats");
  } catch (error) {
    throw new Error(
      error instanceof Error
        ? error.message
        : "Could not save writeback policy.",
    );
  }
}
