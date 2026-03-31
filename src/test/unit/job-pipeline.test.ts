import { afterEach, describe, expect, it } from "vitest";

import { publicApplyTermsVersion } from "@/lib/public-apply";
import {
  applyRecruiterAction,
  getJobPipelineSnapshot,
  getOperationalStateLabel,
} from "@/lib/job-pipeline";
import {
  receiveHappyRobotWebhook,
  resetPublicApplySubmissionStore,
  saveInterviewEvaluation,
  submitPublicApplication,
} from "@/lib/public-apply-submissions";

describe("job pipeline labels", () => {
  afterEach(async () => {
    await resetPublicApplySubmissionStore();
  });

  it("derives a live recruiter snapshot from runtime state when available", async () => {
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

    await receiveHappyRobotWebhook(
      {
        eventId: "evt_1",
        interviewRunId: "run_1",
        providerCallId: "hr_call_run_1",
        status: "completed",
        happenedAt: "2026-03-25T12:05:00.000Z",
        recordingUrl: "https://example.com/recording.mp3",
        transcriptUrl: "https://example.com/transcript.txt",
        rawPayloadRef: "payloads/evt_1.json",
      },
      {
        receivedAt: new Date("2026-03-25T12:05:01.000Z"),
      },
    );

    await saveInterviewEvaluation({
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
              evidence: null,
            },
          ],
        },
        {
          category: "technical",
          label: "Technical skills",
          numericScore: 69,
          scoreState: "Good",
          requirements: [],
        },
        {
          category: "interpersonal",
          label: "Interpersonal skills",
          numericScore: 41,
          scoreState: "Low",
          requirements: [],
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
    });

    const snapshot = await getJobPipelineSnapshot("warehouse-associate-madrid");

    expect(snapshot).not.toBeNull();
    expect(snapshot?.candidates[0]).toMatchObject({
      id: "cand_1",
      fullName: "Lucia Torres",
      stage: "Interviewed",
      scoreState: "Good",
      operationalState: "completed",
    });
    expect(snapshot?.candidates[0]?.summary).toContain("Warehouse experience");

  });

  it("maps operational states into recruiter-friendly labels", () => {
    expect(getOperationalStateLabel("pending")).toBe("Awaiting call");
    expect(getOperationalStateLabel("calling")).toBe("Calling now");
    expect(getOperationalStateLabel("completed")).toBe("Interview complete");
    expect(getOperationalStateLabel("human_requested")).toBe("Human requested");
    expect(getOperationalStateLabel("no_response")).toBe("No response yet");
  });

  it("applies shortlist and reject transitions explicitly", async () => {
    const snapshot = await getJobPipelineSnapshot("warehouse-associate-madrid");

    expect(snapshot).not.toBeNull();

    const shortlisted = applyRecruiterAction(
      snapshot!.candidates,
      "cand_tomas_vidal",
      "shortlist",
    );
    const rejected = applyRecruiterAction(
      shortlisted,
      "cand_daniel_ruiz",
      "reject",
    );

    expect(
      shortlisted.find((candidate) => candidate.id === "cand_tomas_vidal")?.stage,
    ).toBe("Shortlisted");
    expect(
      rejected.find((candidate) => candidate.id === "cand_daniel_ruiz")?.stage,
    ).toBe("Rejected");
  });

  it("supports hire and reversible manual transitions", async () => {
    const snapshot = await getJobPipelineSnapshot("warehouse-associate-madrid");

    expect(snapshot).not.toBeNull();

    const hired = applyRecruiterAction(
      snapshot!.candidates,
      "cand_ines_gomez",
      "hire",
    );
    const movedBack = applyRecruiterAction(
      hired,
      "cand_ines_gomez",
      "move_to_shortlisted",
    );
    const restored = applyRecruiterAction(
      snapshot!.candidates,
      "cand_marta_gil",
      "restore_to_interviewed",
    );
    const rewound = applyRecruiterAction(
      snapshot!.candidates,
      "cand_omar_navarro",
      "move_to_interviewed",
    );

    expect(
      hired.find((candidate) => candidate.id === "cand_ines_gomez")?.stage,
    ).toBe("Hired");
    expect(
      movedBack.find((candidate) => candidate.id === "cand_ines_gomez")?.stage,
    ).toBe("Shortlisted");
    expect(
      restored.find((candidate) => candidate.id === "cand_marta_gil")?.stage,
    ).toBe("Interviewed");
    expect(
      rewound.find((candidate) => candidate.id === "cand_omar_navarro")?.stage,
    ).toBe("Interviewed");
  });
});
