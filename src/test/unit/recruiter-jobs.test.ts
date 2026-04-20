import { afterEach, describe, expect, it } from "vitest";

import { resetRuntimeStoreState } from "@/lib/db/runtime-store";
import { publishRecruiterJob } from "@/lib/recruiter-jobs";

const draft = {
  jobConditions: [
    {
      id: "cond_schedule",
      code: "schedule" as const,
      label: "Schedule",
      value: "Night shift",
      state: "complete" as const,
      details: "",
    },
  ],
  essentialRequirements: [
    {
      id: "req_warehouse",
      label: "Warehouse experience",
      importance: "MANDATORY" as const,
    },
  ],
  technicalSkills: [],
  interpersonalSkills: [],
};

describe("recruiter jobs", () => {
  afterEach(async () => {
    await resetRuntimeStoreState();
  });

  it("generates unique ids and slugs for duplicate job titles", async () => {
    const firstJob = await publishRecruiterJob({
      companyId: "company_alpha",
      title: "Warehouse Associate",
      language: "en",
      description: "Warehouse Associate role for the first company.",
      draft,
      interviewLimits: {
        maxInterviews: null,
        outstandingCap: null,
        greatCap: null,
      },
    });

    const secondJob = await publishRecruiterJob({
      companyId: "company_beta",
      title: "Warehouse Associate",
      language: "en",
      description: "Warehouse Associate role for the second company.",
      draft,
      interviewLimits: {
        maxInterviews: null,
        outstandingCap: null,
        greatCap: null,
      },
    });

    expect(firstJob.id).toBe("job_warehouse-associate");
    expect(firstJob.recruiterSlug).toBe("warehouse-associate");
    expect(firstJob.publicApplyPath).toBe("/apply/warehouse-associate");

    expect(secondJob.id).toBe("job_warehouse-associate-2");
    expect(secondJob.recruiterSlug).toBe("warehouse-associate-2");
    expect(secondJob.publicApplyPath).toBe("/apply/warehouse-associate-2");
  });
});
