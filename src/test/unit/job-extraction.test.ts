import { describe, expect, it } from "vitest";

import { extractJobConfiguration } from "@/lib/job-extraction";

describe("job extraction", () => {
  it("returns a schema-valid extraction draft from a rich description", () => {
    const result = extractJobConfiguration({
      title: "Warehouse Associate",
      description:
        "Warehouse Associate role based in Madrid for a night shift operation. Candidates must have previous warehouse experience, be able to lift up to 20kg, and work weekends when needed. Forklift experience, barcode scanner use, and inventory handling are valuable. Strong communication, teamwork, and attention to detail are important. Salary starts at EUR 22,000 gross yearly on a full-time contract.",
    });

    expect(result.success).toBe(true);
    if (!result.success) {
      return;
    }

    expect(result.data.jobConditions.length).toBeGreaterThan(0);
    expect(result.data.essentialRequirements.length).toBeGreaterThan(0);
    expect(result.data.technicalSkills.length).toBeGreaterThan(0);
    expect(result.data.interpersonalSkills.length).toBeGreaterThan(0);
  });

  it("returns a usable error for weak input instead of partial invalid state", () => {
    const result = extractJobConfiguration({
      title: "Cashier",
      description: "Cashier needed.",
    });

    expect(result.success).toBe(false);
    if (result.success) {
      return;
    }

    expect(result.error).toMatch(/too short/i);
  });
});
