import { describe, expect, it } from "vitest";

import { evaluateATSTriggerRules } from "@/lib/ats-integrations/triggers";

describe("ATS trigger rules", () => {
  it("matches enabled rules by connection, job, and stage", () => {
    const result = evaluateATSTriggerRules({
      rules: [
        {
          id: "rule_1",
          companyId: "company_1",
          connectionId: "ats_conn_1",
          provider: "mock_ats",
          name: "Screen candidates",
          enabled: true,
          externalJobId: "mock_job_store_associate",
          externalStageId: "mock_stage_breathe_screen",
          actions: ["import_candidate", "prepare_interview", "queue_interview"],
          requiresRecruiterApproval: true,
          createdAt: "2026-05-19T10:00:00.000Z",
          updatedAt: "2026-05-19T10:00:00.000Z",
        },
      ],
      event: {
        id: "ats_evt_1",
        companyId: "company_1",
        connectionId: "ats_conn_1",
        provider: "mock_ats",
        eventType: "application_seen",
        externalObjectType: "application",
        externalObjectId: "mock_app_1",
        externalJobId: "mock_job_store_associate",
        externalCandidateId: "mock_candidate_ana",
        externalStageId: "mock_stage_breathe_screen",
        occurredAt: "2026-05-19T10:05:00.000Z",
        processedAt: null,
        idempotencyKey: "key",
        payload: {},
      },
    });

    expect(result).toEqual([
      {
        ruleId: "rule_1",
        actions: ["import_candidate", "prepare_interview", "queue_interview"],
        requiresRecruiterApproval: true,
      },
    ]);
  });
});
