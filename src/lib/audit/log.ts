import { randomUUID } from "node:crypto";

import type { AuthenticatedRecruiter } from "@/lib/auth/types";
import type { AuditAction, AuditEvent } from "@/lib/audit/types";
import type { RuntimeStoreState } from "@/lib/db/runtime-store";

export function appendAuditEvent(params: {
  state: RuntimeStoreState;
  recruiter: AuthenticatedRecruiter;
  action: AuditAction;
  targetType: AuditEvent["targetType"];
  targetId: string;
  summary: string;
  metadata?: AuditEvent["metadata"];
}) {
  const event: AuditEvent = {
    id: `audit_${randomUUID()}`,
    companyId: params.recruiter.company.id,
    actor: {
      userId: params.recruiter.user.id,
      email: params.recruiter.user.email,
      name: params.recruiter.user.displayName,
    },
    action: params.action,
    occurredAt: new Date().toISOString(),
    targetType: params.targetType,
    targetId: params.targetId,
    summary: params.summary,
    metadata: params.metadata ?? {},
  };

  params.state.auditEvents.push(event);
  return event;
}
