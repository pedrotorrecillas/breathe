export type AuditAction =
  | "team.created"
  | "team.member_added"
  | "team.member_removed"
  | "job_access.granted"
  | "job_access.revoked"
  | "profile.updated"
  | "company.updated";

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
  targetType: "team" | "team_membership" | "job_access" | "user" | "company";
  targetId: string;
  summary: string;
  metadata: Record<string, string | boolean | null>;
};
