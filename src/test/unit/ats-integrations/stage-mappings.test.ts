import { describe, expect, it } from "vitest";

import type { ATSConnection } from "@/domain/ats-integrations/types";
import {
  externalStageIdForStageMappingValue,
  internalStageForExternalStage,
  stageMappingValueForExternalStage,
} from "@/lib/ats-integrations/stage-mappings";

const connection: ATSConnection = {
  id: "ats_conn_1",
  companyId: "company_1",
  provider: "mock_ats",
  status: "active",
  displayName: "Mock ATS",
  authMode: "mock",
  secretRef: null,
  externalAccountId: "mock_account",
  lastSyncAt: null,
  lastError: null,
  createdAt: "2026-05-19T10:00:00.000Z",
  updatedAt: "2026-05-19T10:00:00.000Z",
};

describe("ATS stage mappings", () => {
  it("matches scoped external stages only for the mapped external job", () => {
    const scopedStage = stageMappingValueForExternalStage({
      externalJobId: "job_1",
      externalStageId: "shared_rejected",
    });

    const scopedConnection: ATSConnection = {
      ...connection,
      writebackPolicy: {
        reportMode: "candidate_note",
        moveToExternalStageId: null,
        requiresRecruiterReview: false,
        stageMoveMappings: {
          rejected: scopedStage,
        },
      },
    };

    expect(
      internalStageForExternalStage({
        connection: scopedConnection,
        externalJobId: "job_1",
        externalStageId: "shared_rejected",
      }),
    ).toBe("rejected");
    expect(
      internalStageForExternalStage({
        connection: scopedConnection,
        externalJobId: "job_2",
        externalStageId: "shared_rejected",
      }),
    ).toBeNull();
    expect(externalStageIdForStageMappingValue(scopedStage)).toBe(
      "shared_rejected",
    );
  });

  it("keeps legacy unscoped mappings compatible", () => {
    const legacyConnection: ATSConnection = {
      ...connection,
      writebackPolicy: {
        reportMode: "candidate_note",
        moveToExternalStageId: null,
        requiresRecruiterReview: false,
        stageMoveMappings: {
          shortlisted: "shared_shortlisted",
        },
      },
    };

    expect(
      internalStageForExternalStage({
        connection: legacyConnection,
        externalJobId: "job_2",
        externalStageId: "shared_shortlisted",
      }),
    ).toBe("shortlisted");
    expect(externalStageIdForStageMappingValue("shared_shortlisted")).toBe(
      "shared_shortlisted",
    );
  });
});
