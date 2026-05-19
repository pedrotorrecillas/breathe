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
});
