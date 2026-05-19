import { describe, expect, it } from "vitest";

import type { ATSConnection } from "@/domain/ats-integrations/types";
import { zohoRecruitAdapter } from "@/lib/ats-integrations/adapters/zoho-recruit";

const hasZohoCredentials =
  Boolean(process.env.ZOHO_RECRUIT_ACCESS_TOKEN?.trim()) ||
  Boolean(
    process.env.ZOHO_RECRUIT_REFRESH_TOKEN?.trim() &&
    process.env.ZOHO_RECRUIT_CLIENT_ID?.trim() &&
    process.env.ZOHO_RECRUIT_CLIENT_SECRET?.trim(),
  );

const allowLiveWriteback =
  process.env.ZOHO_RECRUIT_SMOKE_ENABLE_WRITEBACK === "true";
const writebackCandidateId =
  process.env.ZOHO_RECRUIT_SMOKE_CANDIDATE_ID?.trim() || null;
const writebackJobId = process.env.ZOHO_RECRUIT_SMOKE_JOB_ID?.trim() || null;
const writebackTargetStatus =
  process.env.ZOHO_RECRUIT_SMOKE_TARGET_STATUS?.trim() || null;

const connection: ATSConnection = {
  id: "ats_conn_zoho_smoke",
  companyId: "company_smoke",
  provider: "zoho_recruit",
  status: "active",
  displayName: "Zoho Recruit Smoke",
  authMode: "env_token",
  secretRef: process.env.ZOHO_RECRUIT_ACCESS_TOKEN
    ? "env:ZOHO_RECRUIT_ACCESS_TOKEN"
    : "env:ZOHO_RECRUIT_REFRESH_TOKEN",
  externalAccountId: "zoho_smoke",
  lastSyncAt: null,
  lastError: null,
  createdAt: "2026-05-19T00:00:00.000Z",
  updatedAt: "2026-05-19T00:00:00.000Z",
};

describe("Zoho Recruit ATS smoke", () => {
  it.skipIf(!hasZohoCredentials)(
    "validates the connection and reads canonical demo objects without writeback",
    async () => {
      const connectionCheck = await zohoRecruitAdapter.validateConnection({
        connection,
      });
      expect(connectionCheck.ok).toBe(true);

      const jobs = await zohoRecruitAdapter.listJobs({
        connection,
        cursor: null,
        limit: 5,
      });
      expect(Array.isArray(jobs.records)).toBe(true);

      const applications = await zohoRecruitAdapter.listApplications({
        connection,
        cursor: null,
        limit: 5,
      });
      expect(Array.isArray(applications.records)).toBe(true);
    },
  );

  it.skipIf(!hasZohoCredentials || !allowLiveWriteback || !writebackCandidateId)(
    "writes a Breathe smoke note to a configured Zoho candidate",
    async () => {
      const result = await zohoRecruitAdapter.writeback({
        connection,
        action: {
          id: "ats_writeback_zoho_smoke_note",
          companyId: connection.companyId,
          connectionId: connection.id,
          provider: "zoho_recruit",
          actionType: "candidate_note",
          targetExternalCandidateId: writebackCandidateId,
          targetExternalApplicationId: writebackCandidateId,
          targetExternalJobId: writebackJobId,
          targetExternalStageId: null,
          sourceObjectType: "manual_admin_action",
          sourceObjectId: "zoho_smoke_note",
          status: "queued",
          idempotencyKey: `zoho_smoke_note:${writebackCandidateId}`,
          payload: {
            body: `Breathe Zoho smoke note ${new Date().toISOString()}`,
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      });

      expect(result.status).toBe("succeeded");
      expect(result.errorMessage).toBeNull();
    },
  );

  it.skipIf(
    !hasZohoCredentials ||
      !allowLiveWriteback ||
      !writebackCandidateId ||
      !writebackTargetStatus,
  )(
    "moves a configured Zoho candidate to a configured demo status",
    async () => {
      const result = await zohoRecruitAdapter.writeback({
        connection,
        action: {
          id: "ats_writeback_zoho_smoke_stage",
          companyId: connection.companyId,
          connectionId: connection.id,
          provider: "zoho_recruit",
          actionType: "application_stage_move",
          targetExternalCandidateId: writebackCandidateId,
          targetExternalApplicationId: writebackJobId
            ? `${writebackCandidateId}:${writebackJobId}`
            : writebackCandidateId,
          targetExternalJobId: writebackJobId,
          targetExternalStageId: writebackTargetStatus,
          sourceObjectType: "manual_admin_action",
          sourceObjectId: "zoho_smoke_stage",
          status: "queued",
          idempotencyKey: `zoho_smoke_stage:${writebackCandidateId}:${writebackJobId ?? "no_job"}:${writebackTargetStatus}`,
          payload: {
            summary: `Breathe Zoho smoke status move ${new Date().toISOString()}`,
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      });

      expect(result.status).toBe("succeeded");
      expect(result.errorMessage).toBeNull();
    },
  );
});
