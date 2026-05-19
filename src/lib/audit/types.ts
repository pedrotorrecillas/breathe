export type AuditAction =
  | "team.created"
  | "team.member_added"
  | "team.member_removed"
  | "job_access.granted"
  | "job_access.revoked"
  | "profile.updated"
  | "company.updated"
  | "ats.connection_created"
  | "ats.connection_tested"
  | "ats.zoho_demo_configured"
  | "ats.sync_mode_saved"
  | "ats.connection_status_saved"
  | "ats.manual_sync"
  | "ats.trigger_rule_saved"
  | "ats.trigger_rule_status_saved"
  | "ats.trigger_rule_deleted"
  | "ats.writeback_policy_saved"
  | "ats.workflow_request_processed"
  | "ats.writeback_action_processed";

export type AuditActor = {
  userId: string;
  email: string;
  name: string;
};

export type AuditEvent = {
  id: string;
  companyId: string;
  actor: AuditActor;
  action: AuditAction;
  occurredAt: string;
  targetType:
    | "team"
    | "team_membership"
    | "job_access"
    | "user"
    | "company"
    | "ats_connection"
    | "ats_trigger_rule"
    | "ats_workflow_request"
    | "ats_writeback_action";
  targetId: string;
  summary: string;
  metadata: Record<string, string | boolean | null>;
};
