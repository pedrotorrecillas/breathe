import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { JobDetailWorkspace } from "@/components/job-detail-workspace";
import type { CandidateEvaluation } from "@/domain/evaluations/types";
import { publicApplyTermsVersion } from "@/lib/public-apply";
import { getInterviewRecordingForCandidate } from "@/lib/candidate-recording";
import {
  receiveHappyRobotWebhook,
  resetPublicApplySubmissionStore,
  saveInterviewEvaluation,
  submitPublicApplication,
} from "@/lib/public-apply-submissions";

describe("job detail pipeline", () => {
  afterEach(() => {
    cleanup();
    resetPublicApplySubmissionStore();
  });

  it("renders structured candidate cards with triage information", () => {
    render(<JobDetailWorkspace jobId="warehouse-associate-madrid" />);

    expect(screen.getAllByText(/Lucia Torres/i).length).toBeGreaterThan(0);
    expect(
      screen.getAllByText(/Forklift-certified warehouse operator/i).length,
    ).toBeGreaterThan(0);
    expect(screen.getAllByText(/Great/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Applied · Today, 09:12/i).length).toBeGreaterThan(0);
  });

  it("updates the reserved detail surface with a candidate report", () => {
    render(<JobDetailWorkspace jobId="warehouse-associate-madrid" />);

    fireEvent.click(screen.getAllByRole("button", { name: /Open candidate Bea Soto/i })[0]!);

    expect(screen.getAllByText(/Selected candidate/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Bea Soto/i).length).toBeGreaterThan(1);
    expect(
      screen.getAllByText(/Consistent order-picking throughput/i).length,
    ).toBeGreaterThan(0);
    expect(screen.getByText(/Candidate report/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Recruiter-facing evaluation summary/i),
    ).toBeInTheDocument();
    expect(screen.getAllByText(/Essential requirements/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Technical skills/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Interpersonal skills/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Forklift certification/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/AI recommendation/i)).toBeInTheDocument();
    expect(screen.getByText(/84\.3 \/ 100/i)).toBeInTheDocument();
    expect(screen.getByText(/Audio review/i)).toBeInTheDocument();
  });

  it("renders audio playback when a recording exists in runtime artifacts", () => {
    submitPublicApplication({
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

    receiveHappyRobotWebhook(
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

    const evaluation: CandidateEvaluation = {
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
    };

    saveInterviewEvaluation(evaluation);

    render(<JobDetailWorkspace jobId="warehouse-associate-madrid" />);

    fireEvent.click(
      screen.getByRole("button", { name: /Open candidate Lucia Torres/i }),
    );

    expect(
      screen.getByLabelText(/Interview recording for Lucia Torres/i),
    ).toHaveAttribute("src", "https://example.com/recording.mp3");
    expect(
      screen.getByText(/Runtime recording stored for this candidate/i),
    ).toBeInTheDocument();
    expect(screen.getAllByText(/Quick triage read/i).length).toBeGreaterThan(0);
    expect(
      screen.getAllByText(/Essential requirements stand out as the strongest block/i).length,
    ).toBeGreaterThan(0);
    expect(getInterviewRecordingForCandidate("Lucia Torres")).toEqual({
      recordingUrl: "https://example.com/recording.mp3",
      recordingDurationSeconds: null,
      providerCallId: "hr_call_run_1",
      completedAt: "2026-03-25T12:05:00.000Z",
      transcriptUrl: "https://example.com/transcript.txt",
    });
    expect(
      screen.getAllByText(/Warehouse experience \(Great\)/i).length,
    ).toBeGreaterThan(0);
  });

  it("shows lightweight operational badges only in Applicants", () => {
    render(<JobDetailWorkspace jobId="warehouse-associate-madrid" />);

    expect(screen.getAllByText(/Calling now/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Awaiting call/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Human requested/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Interview complete/i).length).toBeGreaterThan(0);
    expect(screen.queryByText(/human_requested/i)).not.toBeInTheDocument();
  });

  it("keeps rejected candidates in a separate tab with visible reasons", () => {
    render(<JobDetailWorkspace jobId="warehouse-associate-madrid" />);

    fireEvent.click(screen.getAllByRole("button", { name: /Rejected/i })[0]!);

    expect(screen.getByText(/Separate review context/i)).toBeInTheDocument();
    expect(screen.getByText(/Schedule mismatch/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Commute risk/i).length).toBeGreaterThan(0);
    expect(
      screen.queryByText(/Completed interview runs ready for recruiter triage/i),
    ).not.toBeInTheDocument();
  });

  it("supports explicit shortlist and reject actions", () => {
    render(<JobDetailWorkspace jobId="warehouse-associate-madrid" />);

    fireEvent.click(screen.getAllByRole("button", { name: /^Shortlist$/i })[0]!);

    expect(screen.getAllByRole("button", { name: /^Shortlist$/i })).toHaveLength(3);

    fireEvent.click(screen.getAllByRole("button", { name: /^Reject$/i })[0]!);

    expect(screen.getByText(/Separate review context/i)).toBeInTheDocument();
    expect(screen.getByText(/Rejected from applicants/i)).toBeInTheDocument();
  });

  it("supports hire and move-back actions for recruiter-controlled stages", () => {
    render(<JobDetailWorkspace jobId="warehouse-associate-madrid" />);

    fireEvent.click(screen.getAllByRole("button", { name: /^Hire$/i })[0]!);

    expect(screen.getAllByRole("button", { name: /^Hire$/i })).toHaveLength(1);
    expect(
      screen.getAllByRole("button", { name: /^Back to shortlisted$/i }),
    ).toHaveLength(1);

    fireEvent.click(
      screen.getAllByRole("button", { name: /^Back to shortlisted$/i })[0]!,
    );

    expect(screen.getAllByRole("button", { name: /^Hire$/i })).toHaveLength(2);
  });

  it("opens and closes candidate detail without losing pipeline context", () => {
    render(<JobDetailWorkspace jobId="warehouse-associate-madrid" />);

    fireEvent.click(screen.getAllByRole("button", { name: /Rejected/i })[0]!);
    fireEvent.click(
      screen.getByRole("button", { name: /Open candidate Marta Gil/i }),
    );

    expect(screen.getByText(/Candidate report/i)).toBeInTheDocument();
    expect(screen.getAllByText(/^Low$/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/47\.8 \/ 100/i)).toBeInTheDocument();
    expect(screen.getByText(/AI recommendation/i)).toBeInTheDocument();
    expect(screen.getByText(/Audio review/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Close panel/i }));

    expect(
      screen.getByText(/Select a candidate card to inspect detail/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/Separate review context/i)).toBeInTheDocument();
  });

  it("shows a graceful fallback when no recording exists", () => {
    render(<JobDetailWorkspace jobId="warehouse-associate-madrid" />);

    fireEvent.click(screen.getByRole("button", { name: /Open candidate Bea Soto/i }));

    expect(
      screen.getByText(/No interview recording is available for this candidate yet/i),
    ).toBeInTheDocument();
    expect(
      screen.queryByLabelText(/Interview recording for Bea Soto/i),
    ).not.toBeInTheDocument();
  });
});
