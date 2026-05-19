import { randomUUID } from "node:crypto";

import type {
  ATSConnection,
  ATSProviderKey,
  ATSTriggerRule,
  ATSWorkflowRequest,
} from "@/domain/ats-integrations/types";
import type { AuthenticatedRecruiter } from "@/lib/auth/types";
import { loadRuntimeStoreState } from "@/lib/db/runtime-store";

export type ATSAvailableProvider = {
  provider: ATSProviderKey;
  label: string;
  implemented: boolean;
};

export type ATSAdminSnapshot = {
  connections: ATSConnection[];
  triggerRules: ATSTriggerRule[];
  workflowRequests: ATSWorkflowRequest[];
  availableProviders: ATSAvailableProvider[];
};

export function listATSAvailableProviders(): ATSAvailableProvider[] {
  return [
    { provider: "mock_ats", label: "Mock ATS", implemented: true },
    { provider: "zoho_recruit", label: "Zoho Recruit", implemented: true },
    { provider: "recruitee", label: "Recruitee", implemented: false },
    { provider: "ashby", label: "Ashby", implemented: false },
    { provider: "teamtailor", label: "Teamtailor", implemented: false },
    { provider: "greenhouse", label: "Greenhouse", implemented: false },
    { provider: "lever", label: "Lever", implemented: false },
    { provider: "kombo", label: "Kombo", implemented: false },
  ];
}

export async function getATSAdminSnapshot(
  recruiter: AuthenticatedRecruiter,
): Promise<ATSAdminSnapshot> {
  const state = await loadRuntimeStoreState();
  const companyId = recruiter.company.id;

  return {
    connections: state.atsConnections.filter(
      (connection) => connection.companyId === companyId,
    ),
    triggerRules: state.atsTriggerRules.filter(
      (rule) => rule.companyId === companyId,
    ),
    workflowRequests: state.atsWorkflowRequests.filter(
      (request) => request.companyId === companyId,
    ),
    availableProviders: listATSAvailableProviders(),
  };
}

export function buildDefaultMockATSConnection(input: {
  companyId: string;
  now: string;
}): ATSConnection {
  return {
    id: `ats_conn_${randomUUID()}`,
    companyId: input.companyId,
    provider: "mock_ats",
    status: "active",
    displayName: "Mock ATS",
    authMode: "mock",
    secretRef: null,
    externalAccountId: "mock_account",
    lastSyncAt: null,
    lastError: null,
    createdAt: input.now,
    updatedAt: input.now,
  };
}

export function buildDefaultZohoDemoConnection(input: {
  companyId: string;
  now: string;
}): ATSConnection {
  return {
    id: `ats_conn_${randomUUID()}`,
    companyId: input.companyId,
    provider: "zoho_recruit",
    status: "active",
    displayName: "Zoho Recruit demo",
    authMode: "env_token",
    secretRef: "env:ZOHO_RECRUIT_ACCESS_TOKEN",
    externalAccountId: null,
    lastSyncAt: null,
    lastError: null,
    createdAt: input.now,
    updatedAt: input.now,
  };
}
