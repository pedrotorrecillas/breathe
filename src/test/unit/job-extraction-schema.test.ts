import { describe, expect, it } from "vitest";

import { parseJobExtractionDraft } from "@/domain/jobs/configuration";

describe("job extraction schema", () => {
  it("accepts a normalized extraction draft", () => {
    const result = parseJobExtractionDraft({
      jobConditions: [
        {
          id: "cond_salary",
          code: "salary",
          label: "Salary",
          value: "EUR 22,000 gross yearly",
          state: "complete",
          details: "Night shift allowance included",
        },
        {
          id: "cond_schedule",
          code: "schedule",
          label: "Schedule",
          value: "",
          state: "missing",
          details: "Job description does not specify days or shift pattern",
        },
      ],
      essentialRequirements: [
        {
          id: "req_1",
          label: "Can lift boxes up to 20kg",
          importance: "MANDATORY",
        },
      ],
      technicalSkills: [
        {
          id: "req_2",
          label: "Warehouse scanning systems",
          importance: "OPTIONAL",
        },
      ],
      interpersonalSkills: [],
    });

    expect(result.success).toBe(true);
    if (!result.success) {
      return;
    }

    expect(result.data.jobConditions).toHaveLength(2);
    expect(result.data.interpersonalSkills).toEqual([]);
  });

  it("rejects malformed extraction output", () => {
    const result = parseJobExtractionDraft({
      jobConditions: [
        {
          id: "",
          code: "unknown",
          label: "",
          value: "",
          state: "bad",
          details: "",
        },
      ],
      essentialRequirements: [{ id: "req_1", label: "", importance: "HIGH" }],
      technicalSkills: "invalid",
      interpersonalSkills: [],
    });

    expect(result.success).toBe(false);
    if (result.success) {
      return;
    }

    expect(result.errors.length).toBeGreaterThan(0);
  });
});
