import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const requiredATSEnvironmentKeys = [
  "ATS_SYNC_SECRET",
  "ATS_WEBHOOK_SECRET",
  "CRON_SECRET",
  "ZOHO_RECRUIT_ACCESS_TOKEN",
  "ZOHO_RECRUIT_REFRESH_TOKEN",
  "ZOHO_RECRUIT_CLIENT_ID",
  "ZOHO_RECRUIT_CLIENT_SECRET",
  "ZOHO_RECRUIT_REDIRECT_URI",
  "ZOHO_RECRUIT_ACCOUNTS_BASE_URL",
  "ZOHO_RECRUIT_API_BASE_URL",
  "ZOHO_RECRUIT_SMOKE_ENABLE_WRITEBACK",
  "ZOHO_RECRUIT_SMOKE_CANDIDATE_ID",
  "ZOHO_RECRUIT_SMOKE_JOB_ID",
  "ZOHO_RECRUIT_SMOKE_TARGET_STATUS",
] as const;

describe("ATS environment example", () => {
  it("documents every operational ATS and Zoho demo environment key", () => {
    const envExample = readFileSync(resolve(".env.example"), "utf8");
    const documentedKeys = new Set(
      envExample
        .split("\n")
        .map((line) => line.split("=", 1)[0]?.trim())
        .filter((key): key is string => Boolean(key)),
    );

    expect([...documentedKeys]).toEqual(
      expect.arrayContaining([...requiredATSEnvironmentKeys]),
    );
  });
});
