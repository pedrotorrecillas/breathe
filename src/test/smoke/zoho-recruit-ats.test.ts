import { describe, expect, it } from "vitest";

import type { ATSConnection } from "@/domain/ats-integrations/types";
import { zohoRecruitAdapter } from "@/lib/ats-integrations/adapters/zoho-recruit";
import { createZohoRecruitClient } from "@/lib/ats-integrations/zoho/client";

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
const createLiveFixture =
  process.env.ZOHO_RECRUIT_SMOKE_CREATE_FIXTURE === "true";

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

type ZohoSmokeWriteResponse = {
  data?: unknown[];
};

function flattenZohoDataEntries(value: unknown): Array<Record<string, unknown>> {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((item) => {
    if (Array.isArray(item)) {
      return flattenZohoDataEntries(item);
    }

    return item && typeof item === "object"
      ? [item as Record<string, unknown>]
      : [];
  });
}

function successfulZohoRecordId(response: ZohoSmokeWriteResponse) {
  const success = flattenZohoDataEntries(response.data).find((entry) => {
    const status = typeof entry.status === "string" ? entry.status : null;
    const code = typeof entry.code === "string" ? entry.code : null;

    return (
      status?.toLowerCase() === "success" ||
      code?.toUpperCase() === "SUCCESS"
    );
  });
  const details =
    success?.details && typeof success.details === "object"
      ? (success.details as Record<string, unknown>)
      : null;
  const id = details?.id;

  return typeof id === "string" ? id : null;
}

async function createSmokeCandidate() {
  const client = createZohoRecruitClient(connection);
  const uniqueSuffix = Date.now();
  const response = await client.request<ZohoSmokeWriteResponse>(
    "/recruit/v2/Candidates",
    {
      method: "POST",
      body: JSON.stringify({
        data: [
          {
            First_Name: "Breathe",
            Last_Name: `ATS Smoke ${uniqueSuffix}`,
            Email: `breathe-ats-smoke-${uniqueSuffix}@example.com`,
            Candidate_Status: "New",
            Source: "Breathe ATS smoke",
          },
        ],
      }),
    },
  );
  const candidateId = successfulZohoRecordId(response);

  if (!candidateId) {
    throw new Error(
      `Zoho smoke candidate creation did not return a record id: ${JSON.stringify(
        response,
      )}`,
    );
  }

  return candidateId;
}

async function deleteSmokeCandidate(candidateId: string) {
  const client = createZohoRecruitClient(connection);

  try {
    await client.request<ZohoSmokeWriteResponse>(
      `/recruit/v2/Candidates/${candidateId}`,
      { method: "DELETE" },
    );
  } catch {
    // Best-effort cleanup only. The writeback assertions above are the signal.
  }
}

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

  it.skipIf(
    !hasZohoCredentials ||
      !allowLiveWriteback ||
      (!writebackCandidateId && !createLiveFixture),
  )(
    "creates or uses a Zoho smoke candidate, writes a note, and moves status",
    async () => {
      const candidateId = writebackCandidateId ?? (await createSmokeCandidate());
      const shouldDeleteCandidate = !writebackCandidateId;

      try {
        const noteResult = await zohoRecruitAdapter.writeback({
          connection,
          action: {
            id: "ats_writeback_zoho_smoke_fixture_note",
            companyId: connection.companyId,
            connectionId: connection.id,
            provider: "zoho_recruit",
            actionType: "candidate_note",
            targetExternalCandidateId: candidateId,
            targetExternalApplicationId: candidateId,
            targetExternalJobId: writebackJobId,
            targetExternalStageId: null,
            sourceObjectType: "manual_admin_action",
            sourceObjectId: "zoho_smoke_fixture_note",
            status: "queued",
            idempotencyKey: `zoho_smoke_fixture_note:${candidateId}`,
            payload: {
              body: `Breathe Zoho fixture note ${new Date().toISOString()}`,
            },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        });
        const stageResult = await zohoRecruitAdapter.writeback({
          connection,
          action: {
            id: "ats_writeback_zoho_smoke_fixture_stage",
            companyId: connection.companyId,
            connectionId: connection.id,
            provider: "zoho_recruit",
            actionType: "application_stage_move",
            targetExternalCandidateId: candidateId,
            targetExternalApplicationId: writebackJobId
              ? `${candidateId}:${writebackJobId}`
              : candidateId,
            targetExternalJobId: writebackJobId,
            targetExternalStageId: writebackTargetStatus ?? "New",
            sourceObjectType: "manual_admin_action",
            sourceObjectId: "zoho_smoke_fixture_stage",
            status: "queued",
            idempotencyKey: `zoho_smoke_fixture_stage:${candidateId}:${writebackJobId ?? "no_job"}:${writebackTargetStatus ?? "New"}`,
            payload: {
              summary: `Breathe Zoho fixture status move ${new Date().toISOString()}`,
            },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        });

        expect(noteResult.status).toBe("succeeded");
        expect(noteResult.errorMessage).toBeNull();
        expect(stageResult.status).toBe("succeeded");
        expect(stageResult.errorMessage).toBeNull();
      } finally {
        if (shouldDeleteCandidate) {
          await deleteSmokeCandidate(candidateId);
        }
      }
    },
  );
});
