import { afterEach, describe, expect, it } from "vitest";

import type { CandidateEvaluation } from "@/domain/evaluations/types";
import {
  buildEvaluationSummary,
} from "@/lib/evaluation-summary";
import { publicApplyTermsVersion } from "@/lib/public-apply";
import {
  getRecruiterCandidateSummary,
  resetPublicApplySubmissionStore,
  saveInterviewEvaluation,
  submitPublicApplication,
} from "@/lib/public-apply-submissions";

function buildEvaluation(
  overrides?: Partial<CandidateEvaluation>,
): CandidateEvaluation {
  return {
    id: "eval_1",
    interviewRunId: "run_1",
    generatedAt: "2026-03-25T12:15:00.000Z",
    finalNumericScore: 74,
    finalScoreState: "Good",
    blocks: [
      {
        category: "essential",
        label: "Essential requirements",
        numericScore: 84,
        scoreState: "Great",
        requirements: [
          {
            requirementId: "req_1",
            label: "Warehouse experience",
            importance: "MANDATORY",
            numericScore: 92,
            scoreState: "Great",
            explanation: "Direct evidence of prior warehouse work.",
            evidence: {
              highlightedQuote: "I worked in a warehouse for four years.",
              transcriptStartMs: 10000,
              transcriptEndMs: 18000,
            },
          },
          {
            requirementId: "req_2",
            label: "Safety awareness",
            importance: "OPTIONAL",
            numericScore: 76,
            scoreState: "Good",
            explanation: "Mentions routine safety checks.",
            evidence: {
              highlightedQuote: "I always check equipment before shifts.",
              transcriptStartMs: 18000,
              transcriptEndMs: 22000,
            },
          },
        ],
      },
      {
        category: "technical",
        label: "Technical skills",
        numericScore: 69,
        scoreState: "Good",
        requirements: [
          {
            requirementId: "req_3",
            label: "Scanner systems",
            importance: "MANDATORY",
            numericScore: 69,
            scoreState: "Good",
            explanation: "Shows clear familiarity with handheld scanners.",
            evidence: {
              highlightedQuote: "I used handheld scanners daily.",
              transcriptStartMs: 22000,
              transcriptEndMs: 26000,
            },
          },
        ],
      },
      {
        category: "interpersonal",
        label: "Interpersonal skills",
        numericScore: 41,
        scoreState: "Low",
        requirements: [
          {
            requirementId: "req_4",
            label: "Team communication",
            importance: "OPTIONAL",
            numericScore: 41,
            scoreState: "Low",
            explanation: "Some evidence of communication, but not much detail.",
            evidence: {
              highlightedQuote: "I keep the team updated during rush periods.",
              transcriptStartMs: 26000,
              transcriptEndMs: 32000,
            },
          },
        ],
      },
    ],
    weightConfigSnapshot: {
      mandatoryRequirementWeight: 0.8,
      optionalRequirementWeight: 0.2,
      essentialBlockWeight: 0.45,
      technicalBlockWeight: 0.45,
      interpersonalBlockWeight: 0.1,
    },
    fitClassification: "viable_fit",
    ...overrides,
  };
}

describe("evaluation summary", () => {
  afterEach(async () => {
    await resetPublicApplySubmissionStore();
  });

  it("builds a concise recruiter-facing summary from scored blocks", () => {
    const summary = buildEvaluationSummary(buildEvaluation());

    expect(summary).toEqual({
      headline: "Good · 74/100",
      summary:
        "Essential requirements stand out as the strongest block, led by Warehouse experience (Great) and Safety awareness (Good). Interpersonal skills stand out as the softest area, with Team communication (Low) as the main watchout.",
      strengths: ["Warehouse experience (Great)", "Safety awareness (Good)"],
      concerns: ["Team communication (Low)"],
      finalNumericScore: 74,
      finalScoreState: "Good",
    });
  });

  it("returns a pending summary when no scored requirements are available", () => {
    const summary = buildEvaluationSummary(
      buildEvaluation({
        finalNumericScore: null,
        finalScoreState: "Pending",
        blocks: [
          {
            category: "essential",
            label: "Essential requirements",
            numericScore: null,
            scoreState: "Pending",
            requirements: [],
          },
          {
            category: "technical",
            label: "Technical skills",
            numericScore: null,
            scoreState: "Pending",
            requirements: [],
          },
          {
            category: "interpersonal",
            label: "Interpersonal skills",
            numericScore: null,
            scoreState: "Pending",
            requirements: [],
          },
        ],
      }),
    );

    expect(summary).toEqual({
      headline: "Pending · no score yet",
      summary: "No scored requirements are available yet.",
      strengths: [],
      concerns: [],
      finalNumericScore: null,
      finalScoreState: "Pending",
    });
  });

  it("can be retrieved from the stored interview evaluation", async () => {
    await submitPublicApplication({
      jobId: "job_warehouse_madrid",
      fullName: "Lucia Torres",
      phone: "+34 600 123 456",
      email: "lucia@example.com",
      language: "en",
      profileSource: {
        linkedinUrl: "https://linkedin.com/in/lucia-torres",
        cvAssetRef: null,
        cvFileName: null,
      },
      legalAcceptance: {
        acceptedAt: "2026-03-25T12:00:00.000Z",
        termsVersion: publicApplyTermsVersion,
      },
    });

    const saveResult = await saveInterviewEvaluation(buildEvaluation());

    expect(saveResult.success).toBe(true);

    const summary = await getRecruiterCandidateSummary("run_1");

    expect(summary).toEqual(buildEvaluationSummary(buildEvaluation()));
  });
});
