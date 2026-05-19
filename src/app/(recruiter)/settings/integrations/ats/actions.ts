"use server";

import { revalidatePath } from "next/cache";

import { appendAuditEvent } from "@/lib/audit/log";
import type {
  ATSConnectionStatus,
  ATSSyncMode,
  ATSTriggerAction,
  ATSTriggerRule,
  ATSInternalStageKey,
  ATSWorkflowRequest,
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
import { stageMappingValueMatchesExternalStage } from "@/lib/ats-integrations/stage-mappings";

const atsTriggerActions: ATSTriggerAction[] = [
  "import_candidate",
  "prepare_interview",
  "queue_interview",
  "dispatch_interview",
];

const atsSyncModes: ATSSyncMode[] = [
  "manual",
  "scheduled",
  "webhook_plus_polling",
];

const adminSettableConnectionStatuses: ATSConnectionStatus[] = [
  "active",
  "paused",
];

const atsInternalStageKeys: ATSInternalStageKey[] = [
  "applicant",
  "interviewed",
  "shortlisted",
  "hired",
  "rejected",
  "needs_human",
];

const zohoDemoTriggerStageId = "Breathe Screen";
const zohoDemoWritebackStageId = "Interview Completed";
const zohoDemoWritebackPolicy: ATSWritebackPolicy = {
  reportMode: "candidate_note",
  moveToExternalStageId: zohoDemoWritebackStageId,
  stageMoveMappings: {
    interviewed: "Interview Completed",
    shortlisted: "Shortlisted",
    hired: "Hired",
    rejected: "Rejected",
  },
  requiresRecruiterReview: false,
};

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

function backfillWorkflowRequestsForRule(input: {
  state: Awaited<ReturnType<typeof loadRuntimeStoreState>>;
  rule: ATSTriggerRule;
  now: string;
}) {
  input.state.atsWorkflowRequests = input.state.atsWorkflowRequests ?? [];
  input.state.atsSyncEvents = input.state.atsSyncEvents ?? [];
  const autoProcessWorkflowRequestIds: string[] = [];
  const matchingApplications = (
    input.state.atsExternalApplications ?? []
  ).filter(
    (application) =>
      application.companyId === input.rule.companyId &&
      application.connectionId === input.rule.connectionId &&
      application.externalStageId === input.rule.externalStageId &&
      (!input.rule.externalJobId ||
        application.externalJobId === input.rule.externalJobId) &&
      application.status === "active",
  );

  for (const application of matchingApplications) {
    const existingRequest = input.state.atsWorkflowRequests.some(
      (request) =>
        request.atsTriggerRuleId === input.rule.id &&
        request.connectionId === input.rule.connectionId &&
        request.externalApplicationId === application.externalId,
    );

    if (existingRequest) {
      continue;
    }

    let syncEvent = input.state.atsSyncEvents.find(
      (event) =>
        event.connectionId === application.connectionId &&
        event.externalObjectType === "application" &&
        event.externalObjectId === application.externalId &&
        event.externalStageId === application.externalStageId,
    );

    if (!syncEvent) {
      syncEvent = {
        id: `ats_evt_backfill_${sanitizeATSRulePart(input.rule.id)}_${sanitizeATSRulePart(
          application.externalId,
        )}`,
        companyId: application.companyId,
        connectionId: application.connectionId,
        provider: application.provider,
        eventType: "application_seen",
        externalObjectType: "application",
        externalObjectId: application.externalId,
        externalJobId: application.externalJobId,
        externalCandidateId: application.externalCandidateId,
        externalStageId: application.externalStageId,
        occurredAt: input.now,
        processedAt: input.now,
        idempotencyKey: `trigger_backfill:${input.rule.id}:${application.externalId}`,
        payload: application.rawSnapshot,
      };
      input.state.atsSyncEvents.push(syncEvent);
    } else {
      const syncEventId = syncEvent.id;
      input.state.atsSyncEvents = input.state.atsSyncEvents.map((event) =>
        event.id === syncEventId
          ? {
              ...event,
              processedAt: event.processedAt ?? input.now,
            }
          : event,
      );
    }

    const workflowRequest: ATSWorkflowRequest = {
      id: `ats_workflow_${syncEvent.id}_${input.rule.id}`,
      companyId: input.rule.companyId,
      connectionId: input.rule.connectionId,
      provider: input.rule.provider,
      atsSyncEventId: syncEvent.id,
      atsTriggerRuleId: input.rule.id,
      externalApplicationId: application.externalId,
      internalCandidateId: application.internalCandidateId,
      internalApplicationId: application.internalApplicationId,
      requestedActions: input.rule.actions,
      requiresRecruiterApproval: input.rule.requiresRecruiterApproval,
      status: "queued",
      createdAt: input.now,
      updatedAt: input.now,
    };

    input.state.atsWorkflowRequests.push(workflowRequest);
    if (!workflowRequest.requiresRecruiterApproval) {
      autoProcessWorkflowRequestIds.push(workflowRequest.id);
    }
  }

  return autoProcessWorkflowRequestIds;
}

function parseStageMoveMappings(
  formData: FormData,
): Partial<Record<ATSInternalStageKey, string>> {
  const mappings: Partial<Record<ATSInternalStageKey, string>> = {};

  for (const stage of atsInternalStageKeys) {
    const externalStageId = String(
      formData.get(`stageMoveMapping:${stage}`) ?? "",
    ).trim();

    if (externalStageId) {
      mappings[stage] = externalStageId;
    }
  }

  return mappings;
}

function stageMappingValues(
  mappings: Partial<Record<ATSInternalStageKey, string>>,
) {
  return atsInternalStageKeys
    .map((stage) => mappings[stage])
    .filter((value): value is string => Boolean(value));
}

function stageMappingValueExistsInStages(input: {
  mappingValue: string;
  stages: Array<{
    externalJobId: string | null;
    externalId: string;
  }>;
}) {
  return input.stages.some((stage) =>
    stageMappingValueMatchesExternalStage({
      mappingValue: input.mappingValue,
      externalJobId: stage.externalJobId,
      externalStageId: stage.externalId,
    }),
  );
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
    const defaultConnection = buildDefaultMockATSConnection({
      companyId: recruiter.company.id,
      now: new Date().toISOString(),
    });
    const existingConnection =
      state.atsConnections.find(
        (connection) =>
          connection.companyId === recruiter.company.id &&
          connection.provider === "mock_ats",
      ) ?? null;
    const connection = existingConnection
      ? {
          ...existingConnection,
          status: defaultConnection.status,
          syncMode: existingConnection.syncMode ?? defaultConnection.syncMode,
          secretRef: defaultConnection.secretRef,
          externalAccountId: defaultConnection.externalAccountId,
          lastError: null,
          updatedAt: defaultConnection.updatedAt,
        }
      : defaultConnection;
    const existingIndex = state.atsConnections.findIndex(
      (item) => item.id === connection.id,
    );

    if (existingIndex >= 0) {
      state.atsConnections[existingIndex] = connection;
    } else {
      state.atsConnections.push(connection);
    }
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
    const defaultConnection = buildDefaultZohoDemoConnection({
      companyId: recruiter.company.id,
      now: new Date().toISOString(),
    });
    const existingConnection =
      state.atsConnections.find(
        (connection) =>
          connection.companyId === recruiter.company.id &&
          connection.provider === "zoho_recruit",
      ) ?? null;
    let connection = existingConnection
      ? {
          ...existingConnection,
          status: defaultConnection.status,
          syncMode: existingConnection.syncMode ?? defaultConnection.syncMode,
          secretRef: defaultConnection.secretRef,
          lastError: defaultConnection.lastError,
          updatedAt: defaultConnection.updatedAt,
        }
      : defaultConnection;

    if (connection.status === "active") {
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

      connection = {
        ...connection,
        status: check.ok ? "active" : "error",
        externalAccountId:
          check.externalAccountId ?? connection.externalAccountId,
        lastError: check.ok ? null : check.message,
      };
    }

    const existingIndex = state.atsConnections.findIndex(
      (item) => item.id === connection.id,
    );
    const credentialStatus =
      defaultConnection.status === "active"
        ? connection.status === "active"
          ? "validated"
          : "invalid"
        : "missing";

    if (existingIndex >= 0) {
      state.atsConnections[existingIndex] = connection;
    } else {
      state.atsConnections.push(connection);
    }
    appendAuditEvent({
      state,
      recruiter,
      action: "ats.connection_created",
      targetType: "ats_connection",
      targetId: connection.id,
      summary: "Created Zoho Recruit integration connection.",
      metadata: {
        provider: connection.provider,
        credentialStatus,
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

export async function configureZohoDemoDefaultsAction(
  formData: FormData,
): Promise<void> {
  void formData;

  try {
    const recruiter = await requireAuthenticatedRecruiter();
    requireATSAdmin(recruiterCanManageTeams(recruiter));
    const state = await loadRuntimeStoreState();
    const now = new Date().toISOString();
    const existingConnection =
      state.atsConnections.find(
        (connection) =>
          connection.companyId === recruiter.company.id &&
          connection.provider === "zoho_recruit",
      ) ?? null;
    const defaultConnection = buildDefaultZohoDemoConnection({
      companyId: recruiter.company.id,
      now,
    });
    const connection = existingConnection
      ? {
          ...existingConnection,
          status: defaultConnection.status,
          syncMode: "manual" as const,
          secretRef: defaultConnection.secretRef,
          lastError: defaultConnection.lastError,
          writebackPolicy: zohoDemoWritebackPolicy,
          updatedAt: now,
        }
      : {
          ...defaultConnection,
          writebackPolicy: zohoDemoWritebackPolicy,
        };
    const rule = {
      id: buildTriggerRuleId({
        connectionId: connection.id,
        externalJobId: null,
        externalStageId: zohoDemoTriggerStageId,
      }),
      companyId: recruiter.company.id,
      connectionId: connection.id,
      provider: "zoho_recruit" as const,
      name: `Run Breathe at ${zohoDemoTriggerStageId}`,
      enabled: true,
      externalJobId: null,
      externalStageId: zohoDemoTriggerStageId,
      actions: [
        "import_candidate",
        "prepare_interview",
        "queue_interview",
      ] satisfies ATSTriggerAction[],
      requiresRecruiterApproval: false,
      createdAt: now,
      updatedAt: now,
    };
    const existingConnectionIndex = state.atsConnections.findIndex(
      (item) => item.id === connection.id,
    );

    if (existingConnectionIndex >= 0) {
      state.atsConnections[existingConnectionIndex] = connection;
    } else {
      state.atsConnections.push(connection);
    }

    const existingRuleIndex = state.atsTriggerRules.findIndex(
      (item) =>
        item.id === rule.id ||
        (item.companyId === rule.companyId &&
          item.connectionId === rule.connectionId &&
          item.externalJobId === rule.externalJobId &&
          item.externalStageId === rule.externalStageId),
    );

    if (existingRuleIndex >= 0) {
      state.atsTriggerRules[existingRuleIndex] = {
        ...state.atsTriggerRules[existingRuleIndex],
        ...rule,
        createdAt: state.atsTriggerRules[existingRuleIndex].createdAt,
      };
    } else {
      state.atsTriggerRules.push(rule);
    }

    const autoProcessWorkflowRequestIds = backfillWorkflowRequestsForRule({
      state,
      rule,
      now,
    });

    appendAuditEvent({
      state,
      recruiter,
      action: "ats.zoho_demo_configured",
      targetType: "ats_connection",
      targetId: connection.id,
      summary: "Configured Zoho Recruit demo ATS defaults.",
      metadata: {
        provider: connection.provider,
        credentialStatus: connection.status === "active" ? "present" : "missing",
        triggerStage: zohoDemoTriggerStageId,
        writebackStage: zohoDemoWritebackStageId,
      },
    });
    await saveRuntimeStoreState(state);
    if (connection.status === "active") {
      for (const workflowRequestId of autoProcessWorkflowRequestIds) {
        await processATSWorkflowRequest({
          workflowRequestId,
          now,
          approved: true,
        });
      }
    }
    revalidatePath("/settings/integrations/ats");
  } catch (error) {
    throw new Error(
      error instanceof Error
        ? error.message
        : "Could not configure Zoho demo defaults.",
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

export async function saveATSSyncModeAction(
  formData: FormData,
): Promise<void> {
  try {
    const recruiter = await requireAuthenticatedRecruiter();
    requireATSAdmin(recruiterCanManageTeams(recruiter));
    const connectionId = String(formData.get("connectionId") ?? "");
    const syncModeValue = String(formData.get("syncMode") ?? "");

    if (!connectionId) {
      throw new Error("Choose an ATS connection for sync mode.");
    }

    if (!atsSyncModes.includes(syncModeValue as ATSSyncMode)) {
      throw new Error("Choose a supported ATS sync mode.");
    }

    const syncMode = syncModeValue as ATSSyncMode;
    const state = await loadRuntimeStoreState();
    const connection = state.atsConnections.find(
      (item) =>
        item.id === connectionId && item.companyId === recruiter.company.id,
    );

    if (!connection) {
      throw new Error("ATS connection not found.");
    }

    const adapter = getATSAdapter(connection.provider);
    if (syncMode === "scheduled" && !adapter.capabilities.supportsPolling) {
      throw new Error("Selected ATS provider does not support polling sync.");
    }

    if (
      syncMode === "webhook_plus_polling" &&
      !adapter.capabilities.supportsWebhooks
    ) {
      throw new Error("Selected ATS provider does not support webhook sync.");
    }

    state.atsConnections = state.atsConnections.map((item) =>
      item.id === connection.id
        ? {
            ...item,
            syncMode,
            updatedAt: new Date().toISOString(),
          }
        : item,
    );

    appendAuditEvent({
      state,
      recruiter,
      action: "ats.sync_mode_saved",
      targetType: "ats_connection",
      targetId: connection.id,
      summary: "Saved ATS sync mode.",
      metadata: {
        provider: connection.provider,
        syncMode,
      },
    });
    await saveRuntimeStoreState(state);
    revalidatePath("/settings/integrations/ats");
  } catch (error) {
    throw new Error(
      error instanceof Error ? error.message : "Could not save ATS sync mode.",
    );
  }
}

export async function saveATSConnectionStatusAction(
  formData: FormData,
): Promise<void> {
  try {
    const recruiter = await requireAuthenticatedRecruiter();
    requireATSAdmin(recruiterCanManageTeams(recruiter));
    const connectionId = String(formData.get("connectionId") ?? "");
    const statusValue = String(formData.get("status") ?? "");

    if (!connectionId) {
      throw new Error("Choose an ATS connection for status change.");
    }

    if (
      !adminSettableConnectionStatuses.includes(
        statusValue as ATSConnectionStatus,
      )
    ) {
      throw new Error("Choose a supported ATS connection status.");
    }

    const status = statusValue as ATSConnectionStatus;
    const state = await loadRuntimeStoreState();
    const connection = state.atsConnections.find(
      (item) =>
        item.id === connectionId && item.companyId === recruiter.company.id,
    );

    if (!connection) {
      throw new Error("ATS connection not found.");
    }

    if (
      status === "active" &&
      connection.status !== "paused" &&
      connection.status !== "active"
    ) {
      throw new Error(
        "Test the ATS connection before reactivating an errored connection.",
      );
    }

    state.atsConnections = state.atsConnections.map((item) =>
      item.id === connection.id
        ? {
            ...item,
            status,
            lastError: status === "paused" ? null : item.lastError,
            updatedAt: new Date().toISOString(),
          }
        : item,
    );

    appendAuditEvent({
      state,
      recruiter,
      action: "ats.connection_status_saved",
      targetType: "ats_connection",
      targetId: connection.id,
      summary: "Saved ATS connection status.",
      metadata: {
        provider: connection.provider,
        status,
      },
    });
    await saveRuntimeStoreState(state);
    revalidatePath("/settings/integrations/ats");
  } catch (error) {
    throw new Error(
      error instanceof Error
        ? error.message
        : "Could not save ATS connection status.",
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
    const activeConnectionStages = connectionStages.filter(
      (stage) => stage.status === "active",
    );
    const connectionJobs = (state.atsExternalJobs ?? []).filter(
      (job) =>
        job.companyId === recruiter.company.id &&
        job.connectionId === connection.id,
    );
    const activeConnectionJobs = connectionJobs.filter(
      (job) => job.status === "active",
    );

    if (
      connectionStages.length > 0 &&
      !activeConnectionStages.some(
        (stage) => stage.externalId === externalStageId,
      )
    ) {
      throw new Error(
        "Choose an active trigger stage from the selected ATS connection.",
      );
    }

    if (
      externalJobId &&
      connectionStages.length > 0 &&
      !activeConnectionStages.some(
        (stage) =>
          stage.externalId === externalStageId &&
          (!stage.externalJobId || stage.externalJobId === externalJobId),
      )
    ) {
      throw new Error(
        "Choose a trigger stage that belongs to the selected ATS job.",
      );
    }

    if (
      externalJobId &&
      connectionJobs.length > 0 &&
      !activeConnectionJobs.some((job) => job.externalId === externalJobId)
    ) {
      throw new Error(
        "Choose an active trigger job from the selected ATS connection.",
      );
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

    state.atsWorkflowRequests = state.atsWorkflowRequests ?? [];
    state.atsSyncEvents = state.atsSyncEvents ?? [];
    const autoProcessWorkflowRequestIds: string[] = [];

    const matchingApplications = (state.atsExternalApplications ?? []).filter(
      (application) =>
        application.companyId === rule.companyId &&
        application.connectionId === rule.connectionId &&
        application.externalStageId === rule.externalStageId &&
        (!rule.externalJobId ||
          application.externalJobId === rule.externalJobId) &&
        application.status === "active",
    );

    for (const application of matchingApplications) {
      const existingRequest = state.atsWorkflowRequests.some(
        (request) =>
          request.atsTriggerRuleId === rule.id &&
          request.connectionId === rule.connectionId &&
          request.externalApplicationId === application.externalId,
      );

      if (existingRequest) {
        continue;
      }

      let syncEvent = state.atsSyncEvents.find(
        (event) =>
          event.connectionId === application.connectionId &&
          event.externalObjectType === "application" &&
          event.externalObjectId === application.externalId &&
          event.externalStageId === application.externalStageId,
      );

      if (!syncEvent) {
        syncEvent = {
          id: `ats_evt_backfill_${sanitizeATSRulePart(rule.id)}_${sanitizeATSRulePart(
            application.externalId,
          )}`,
          companyId: application.companyId,
          connectionId: application.connectionId,
          provider: application.provider,
          eventType: "application_seen",
          externalObjectType: "application",
          externalObjectId: application.externalId,
          externalJobId: application.externalJobId,
          externalCandidateId: application.externalCandidateId,
          externalStageId: application.externalStageId,
          occurredAt: now,
          processedAt: now,
          idempotencyKey: `trigger_backfill:${rule.id}:${application.externalId}`,
          payload: application.rawSnapshot,
        };
        state.atsSyncEvents.push(syncEvent);
      } else {
        const syncEventId = syncEvent.id;
        state.atsSyncEvents = state.atsSyncEvents.map((event) =>
          event.id === syncEventId
            ? {
                ...event,
                processedAt: event.processedAt ?? now,
              }
            : event,
        );
      }

      const workflowRequest: ATSWorkflowRequest = {
        id: `ats_workflow_${syncEvent.id}_${rule.id}`,
        companyId: rule.companyId,
        connectionId: rule.connectionId,
        provider: rule.provider,
        atsSyncEventId: syncEvent.id,
        atsTriggerRuleId: rule.id,
        externalApplicationId: application.externalId,
        internalCandidateId: application.internalCandidateId,
        internalApplicationId: application.internalApplicationId,
        requestedActions: rule.actions,
        requiresRecruiterApproval: rule.requiresRecruiterApproval,
        status: "queued",
        createdAt: now,
        updatedAt: now,
      };

      state.atsWorkflowRequests.push(workflowRequest);
      if (!workflowRequest.requiresRecruiterApproval) {
        autoProcessWorkflowRequestIds.push(workflowRequest.id);
      }
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
    if (connection.status === "active") {
      for (const workflowRequestId of autoProcessWorkflowRequestIds) {
        await processATSWorkflowRequest({
          workflowRequestId,
          now,
          approved: true,
        });
      }
    }
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
        processingMode: "manual_recruiter_review",
        connectionId: processed.action.connectionId,
        actionType: processed.action.actionType,
        sourceObjectType: processed.action.sourceObjectType,
        sourceObjectId: processed.action.sourceObjectId,
        targetExternalCandidateId: processed.action.targetExternalCandidateId,
        targetExternalApplicationId:
          processed.action.targetExternalApplicationId,
        targetExternalStageId: processed.action.targetExternalStageId,
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
    const stageMoveMappings = parseStageMoveMappings(formData);
    const mappedExternalStageIds = stageMappingValues(stageMoveMappings);
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

    const adapter = getATSAdapter(connection.provider);
    if (
      reportMode === "candidate_note" &&
      !adapter.capabilities.supportsCandidateNotes
    ) {
      throw new Error(
        "Selected ATS provider does not support candidate note writebacks.",
      );
    }

    if (
      reportMode === "status_comment" &&
      !moveToExternalStageId &&
      !adapter.capabilities.supportsStatusComments
    ) {
      throw new Error(
        "Selected ATS provider does not support status comment writebacks.",
      );
    }

    if (
      (moveToExternalStageId || mappedExternalStageIds.length > 0) &&
      !adapter.capabilities.supportsStageMove
    ) {
      throw new Error(
        "Selected ATS provider does not support stage move writebacks.",
      );
    }

    const connectionStages = (state.atsExternalStages ?? []).filter(
      (stage) =>
        stage.companyId === recruiter.company.id &&
        stage.connectionId === connection.id,
    );
    const activeConnectionStages = connectionStages.filter(
      (stage) => stage.status === "active",
    );

    if (
      moveToExternalStageId &&
      connectionStages.length > 0 &&
      !stageMappingValueExistsInStages({
        mappingValue: moveToExternalStageId,
        stages: activeConnectionStages,
      })
    ) {
      throw new Error(
        "Choose an active writeback target stage from the selected ATS connection.",
      );
    }

    if (
      mappedExternalStageIds.length > 0 &&
      connectionStages.length > 0 &&
      !mappedExternalStageIds.every((mappingValue) =>
        stageMappingValueExistsInStages({
          mappingValue,
          stages: activeConnectionStages,
        }),
      )
    ) {
      throw new Error(
        "Choose active manual stage mappings from the selected ATS connection.",
      );
    }

    const policy: ATSWritebackPolicy = {
      reportMode,
      moveToExternalStageId,
      ...(mappedExternalStageIds.length > 0 ? { stageMoveMappings } : {}),
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
        stageMoveMappings: Object.keys(stageMoveMappings).join(","),
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
