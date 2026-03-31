import { afterEach, describe, expect, it, vi } from "vitest";

import { extractJobConfiguration } from "@/lib/job-extraction";

describe("job extraction", () => {
  const originalAnthropicKey = process.env.ANTHROPIC_API_KEY;

  afterEach(() => {
    vi.unstubAllGlobals();
    process.env.ANTHROPIC_API_KEY = originalAnthropicKey;
  });

  it("returns a schema-valid extraction draft from Claude output", async () => {
    process.env.ANTHROPIC_API_KEY = "test-key";
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          content: [
            {
              type: "text",
              text: JSON.stringify({
                jobConditions: [
                  {
                    id: "cond_location",
                    code: "location",
                    label: "Location",
                    value: "Madrid",
                    state: "complete",
                    details: "",
                  },
                ],
                essentialRequirements: [
                  {
                    id: "essential_warehouse_experience",
                    label:
                      "Have previous warehouse experience in outbound operations.",
                    importance: "MANDATORY",
                  },
                ],
                technicalSkills: [
                  {
                    id: "technical_scanner_use",
                    label:
                      "Use barcode scanners and inventory systems accurately during each shift.",
                    importance: "MANDATORY",
                  },
                ],
                interpersonalSkills: [
                  {
                    id: "interpersonal_teamwork",
                    label:
                      "Coordinate clearly with teammates during handovers and peak-volume periods.",
                    importance: "MANDATORY",
                  },
                ],
              }),
            },
          ],
        }),
      }),
    );

    const result = await extractJobConfiguration({
      title: "Warehouse Associate",
      description:
        "Warehouse Associate role based in Madrid for a night shift operation. Candidates must have previous warehouse experience, be able to lift up to 20kg, and work weekends when needed. Forklift experience, barcode scanner use, and inventory handling are valuable. Strong communication, teamwork, and attention to detail are important. Salary starts at EUR 22,000 gross yearly on a full-time contract.",
      language: "en",
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

  it("returns a usable error for weak input instead of partial invalid state", async () => {
    const result = await extractJobConfiguration({
      title: "Cashier",
      description: "Cashier needed.",
      language: "en",
    });

    expect(result.success).toBe(false);
    if (result.success) {
      return;
    }

    expect(result.error).toMatch(/too short/i);
  });

  it("falls back to the local extractor when the Claude request fails", async () => {
    process.env.ANTHROPIC_API_KEY = "test-key";
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        text: async () => "provider unavailable",
      }),
    );

    const result = await extractJobConfiguration({
      title: "Warehouse Associate",
      description:
        "Warehouse Associate role based in Madrid for a night shift operation. Candidates must have previous warehouse experience, be able to lift up to 20kg, and work weekends when needed. Forklift experience, barcode scanner use, and inventory handling are valuable. Strong communication, teamwork, and attention to detail are important. Salary starts at EUR 22,000 gross yearly on a full-time contract.",
      language: "en",
    });

    expect(result.success).toBe(true);
    if (!result.success) {
      return;
    }

    expect(result.warnings.join(" ")).toMatch(/falling back/i);
  });
});
