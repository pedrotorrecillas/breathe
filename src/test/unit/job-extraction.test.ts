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
                    id: "cond_schedule",
                    code: "schedule",
                    label: "Schedule",
                    value: "Hybrid and occasional in-office work in Madrid",
                    state: "complete",
                    details: "",
                  },
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
                    id: "essential_pm_experience",
                    label: "5+ years of Product Management experience in B2B SaaS environments.",
                    importance: "MANDATORY",
                  },
                  {
                    id: "essential_recruiter_copy",
                    label:
                      "We are looking for a Product Manager with strong experience in B2B SaaS, capable of driving complex, technical products from concept to scale, with a deep understanding of IT management workflows and user needs",
                    importance: "OPTIONAL",
                  },
                ],
                technicalSkills: [
                  {
                    id: "technical_pm_prioritization",
                    label:
                      "Prioritizing and delivering core product capabilities such as device inventory, monitoring, patch visibility, ticket insights, and filtering",
                    importance: "MANDATORY",
                  },
                ],
                interpersonalSkills: [
                  {
                    id: "interpersonal_collaboration",
                    label:
                      "Collaboration will be essential",
                    importance: "OPTIONAL",
                  },
                  {
                    id: "interpersonal_work_closely",
                    label:
                      "You’ll work closely with Engineering, Infrastructure, AI, Frontend, and UX teams to design telemetry pipelines, alerting systems, automation policies, and unified product experiences",
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
    expect(
      result.data.essentialRequirements.some((item) =>
        /we are looking for|relevant experience and expected outcomes/i.test(
          item.label,
        ),
      ),
    ).toBe(false);
    expect(
      result.data.interpersonalSkills.some((item) =>
        /collaboration will be essential/i.test(item.label),
      ),
    ).toBe(false);
    expect(
      result.data.interpersonalSkills.some((item) =>
        /collaborate effectively with/i.test(item.label),
      ),
    ).toBe(true);
    expect(
      result.data.technicalSkills.some((item) =>
        /^Prioritize and deliver core product capabilities/i.test(item.label),
      ),
    ).toBe(true);
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
