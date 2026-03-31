import { describe, expect, it } from "vitest";

import {
  createInterviewPreparationPackage,
  generateInterviewQuestions,
} from "@/lib/interview-preparation";

describe("interview preparation", () => {
  it("generates one ordered interview question per job requirement", () => {
    const questions = generateInterviewQuestions({
      id: "job_1",
      title: "Warehouse Associate",
      summary: "Night shift role",
      location: "Madrid",
      status: "active",
      interviewLanguage: "es",
      createdAt: "2026-03-24T08:00:00.000Z",
      publishedAt: "2026-03-24T08:00:00.000Z",
      expiresAt: null,
      publicApplyPath: "/apply/job_1",
      pipeline: {
        applicants: 1,
        interviewed: 0,
        shortlisted: 0,
        hired: 0,
        rejected: 0,
      },
      interviewLimits: {
        maxInterviews: null,
        outstandingCap: null,
        greatCap: null,
      },
      requirements: [
        {
          id: "req_condition",
          code: "schedule",
          label: "Night shift availability",
          description: "Candidate can work night shifts",
          category: "condition",
          weight: 1,
          isKnockout: true,
        },
        {
          id: "req_technical",
          code: null,
          label: "Warehouse scanning systems",
          description: "Experience with scanners",
          category: "technical",
          weight: 3,
          isKnockout: false,
        },
      ],
    });

    expect(questions).toHaveLength(2);
    expect(questions[0]).toMatchObject({
      id: "question_req_condition",
      requirementId: "req_condition",
      kind: "condition_check",
      type: "killer",
      metadata: null,
    });
    expect(questions[1]).toMatchObject({
      id: "question_req_technical",
      requirementId: "req_technical",
      kind: "experience_probe",
      type: "standard",
      metadata: null,
    });
    expect(questions.every((question) => question.confidenceLevels.length === 6)).toBe(
      true,
    );
    expect(questions[0].confidenceLevels[0]).toMatchObject({
      band: "excellent",
      level: "90-100",
    });
    expect(questions[0].confidenceLevels[5]).toMatchObject({
      band: "inadequate",
      level: "1-29",
    });
  });

  it("generates a language question with language-specific metadata and prompt guidance", () => {
    const questions = generateInterviewQuestions({
      id: "job_2",
      title: "Retail Shift Lead",
      summary: "Store leadership role",
      location: "Barcelona",
      status: "active",
      interviewLanguage: "es",
      createdAt: "2026-03-24T08:00:00.000Z",
      publishedAt: "2026-03-24T08:00:00.000Z",
      expiresAt: null,
      publicApplyPath: "/apply/job_2",
      pipeline: {
        applicants: 1,
        interviewed: 0,
        shortlisted: 0,
        hired: 0,
        rejected: 0,
      },
      interviewLimits: {
        maxInterviews: null,
        outstandingCap: null,
        greatCap: null,
      },
      requirements: [
        {
          id: "req_language",
          code: null,
          label: "English proficiency",
          description: "Basic English communication with customers and team members.",
          category: "essential",
          weight: 2,
          isKnockout: false,
        },
      ],
    });

    expect(questions).toHaveLength(1);
    expect(questions[0]).toMatchObject({
      id: "question_req_language",
      requirementId: "req_language",
      kind: "language_check",
      type: "language",
      metadata: JSON.stringify({ lang: "en" }),
    });
    expect(questions[0].prompt).toContain(
      "Para la siguiente pregunta, vamos a cambiar a inglés",
    );
    expect(questions[0].prompt).toContain(
      "responde en inglés y cuéntame",
    );
    expect(questions[0].rubric).toContain("english");
    expect(questions[0].confidenceLevels).toHaveLength(6);
    expect(questions[0].confidenceLevels.every((level) => level.description.includes("English"))).toBe(
      true,
    );
  });

  it("builds a preparation package with the job language and generation timestamp", () => {
    const interviewPackage = createInterviewPreparationPackage({
      candidateId: "cand_1",
      job: {
        id: "job_1",
        title: "Warehouse Associate",
        summary: "Night shift role",
        location: "Madrid",
        status: "active",
        interviewLanguage: "es",
        createdAt: "2026-03-24T08:00:00.000Z",
        publishedAt: "2026-03-24T08:00:00.000Z",
        expiresAt: null,
        publicApplyPath: "/apply/job_1",
        pipeline: {
          applicants: 1,
          interviewed: 0,
          shortlisted: 0,
          hired: 0,
          rejected: 0,
        },
        interviewLimits: {
          maxInterviews: null,
          outstandingCap: null,
          greatCap: null,
        },
        requirements: [],
      },
      now: new Date("2026-03-24T08:10:00.000Z"),
    });

    expect(interviewPackage).toEqual({
      id: "prep_job_1_cand_1",
      jobId: "job_1",
      candidateId: "cand_1",
      language: "es",
      createdAt: "2026-03-24T08:10:00.000Z",
      questions: [],
    });
  });
});
