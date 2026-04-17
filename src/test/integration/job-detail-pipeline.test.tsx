import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { JobDetailWorkspace } from "@/components/job-detail-workspace";
import type { CandidateEvaluation } from "@/domain/evaluations/types";
import { getInterviewRecordingForCandidate } from "@/lib/candidate-recording";
import { getJobPipelineSnapshot } from "@/lib/job-pipeline-server";
import { publicApplyTermsVersion } from "@/lib/public-apply";
import {
  listInterviewRunRuntimeSnapshotsByCandidateId,
  receiveHappyRobotWebhook,
  resetPublicApplySubmissionStore,
  saveInterviewEvaluation,
  submitPublicApplication,
} from "@/lib/public-apply-submissions";

async function renderJobDetail(jobId = "warehouse-associate-madrid") {
  const initialSnapshot = await getJobPipelineSnapshot(jobId);

  if (!initialSnapshot) {
    throw new Error(`Missing job pipeline snapshot for ${jobId}`);
  }

  const runtimeSnapshotsByCandidateId =
    await listInterviewRunRuntimeSnapshotsByCandidateId(
      initialSnapshot.candidates.map((candidate) => candidate.id),
    );

  render(
    <JobDetailWorkspace
      initialSnapshot={initialSnapshot}
      runtimeSnapshotsByCandidateId={runtimeSnapshotsByCandidateId}
    />,
  );
}

describe("job detail pipeline", () => {
  afterEach(async () => {
    cleanup();
    await resetPublicApplySubmissionStore();
  });

  it("renders structured candidate cards with triage information", async () => {
    await renderJobDetail();

    expect(screen.getAllByText(/Lucia Torres/i).length).toBeGreaterThan(0);
    expect(
      screen.getAllByText(/Forklift-certified warehouse operator/i).length,
    ).toBeGreaterThan(0);
    expect(screen.getAllByText(/Great/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Today, 09:12/i).length).toBeGreaterThan(0);
  });

  it("shows a clear empty evaluation state when no stored evaluation exists", async () => {
    await renderJobDetail();

    fireEvent.click(screen.getAllByRole("button", { name: /Open candidate Bea Soto/i })[0]!);

    expect(screen.getAllByText(/Bea Soto/i).length).toBeGreaterThan(1);
    expect(
      screen.getAllByText(/Consistent order-picking throughput/i).length,
    ).toBeGreaterThan(0);
    expect(screen.getByText(/No evaluation available yet/i)).toBeInTheDocument();
    expect(screen.queryByText(/AI recommendation/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Recruiter summary/i)).not.toBeInTheDocument();
    expect(screen.getByText(/^Score$/i)).toBeInTheDocument();
    expect(screen.getByText(/^--$/i)).toBeInTheDocument();
    expect(screen.getByText(/^Audio$/i)).toBeInTheDocument();
  });

  it("renders audio playback when a recording exists in runtime artifacts", async () => {
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

    await saveInterviewEvaluation(evaluation);
    await renderJobDetail();

    fireEvent.click(
      screen.getByRole("button", { name: /Open candidate Lucia Torres/i }),
    );

    expect(
      screen.getByLabelText(/Interview recording for Lucia Torres/i),
    ).toHaveAttribute("src", "https://example.com/recording.mp3");
    expect(await getInterviewRecordingForCandidate("Lucia Torres")).toEqual({
      recordingUrl: "https://example.com/recording.mp3",
      recordingDurationSeconds: null,
      providerCallId: "hr_call_run_1",
      completedAt: "2026-03-25T12:05:00.000Z",
      transcriptUrl: "https://example.com/transcript.txt",
    });
    expect(screen.getByText(/^Score$/i)).toBeInTheDocument();
    expect(screen.getByText(/^74$/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Warehouse experience/i).length).toBeGreaterThan(0);
    expect(
      screen.getByText(/The candidate showed prior warehouse work/i),
    ).toBeInTheDocument();
  });

  it("shows lightweight operational badges only in Applicants", async () => {
    await renderJobDetail();

    expect(screen.getAllByText(/Calling now/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Awaiting call/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Human requested/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Interview complete/i).length).toBeGreaterThan(0);
    expect(screen.queryByText(/human_requested/i)).not.toBeInTheDocument();
  });

  it("keeps rejected candidates behind a secondary control with visible reasons", async () => {
    await renderJobDetail();

    fireEvent.click(screen.getByRole("button", { name: /Rejected/i }));

    expect(screen.getAllByText(/^Rejected$/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Schedule mismatch/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Commute risk/i).length).toBeGreaterThan(0);
  });

  it("supports explicit shortlist and reject actions", async () => {
    await renderJobDetail();

    fireEvent.click(screen.getAllByRole("button", { name: /^Shortlist$/i })[0]!);

    expect(screen.getAllByRole("button", { name: /^Shortlist$/i })).toHaveLength(3);

    fireEvent.click(screen.getAllByRole("button", { name: /^Reject$/i })[0]!);

    expect(screen.getByRole("button", { name: /Rejected \(3\)/i })).toBeInTheDocument();
    expect(screen.getByText(/Rejected from applicants/i)).toBeInTheDocument();
  });

  it("supports hire and move-back actions for recruiter-controlled stages", async () => {
    await renderJobDetail();

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

  it("opens and closes candidate detail without losing pipeline context", async () => {
    await renderJobDetail();

    fireEvent.click(screen.getByRole("button", { name: /Rejected/i }));
    fireEvent.click(
      screen.getByRole("button", { name: /Open candidate Marta Gil/i }),
    );

    expect(screen.getByText(/No evaluation available yet/i)).toBeInTheDocument();
    expect(screen.queryByText(/AI recommendation/i)).not.toBeInTheDocument();
    expect(screen.getByText(/^Audio$/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /^Close$/i }));

    expect(screen.queryByRole("button", { name: /^Close$/i })).not.toBeInTheDocument();
    expect(screen.getByText(/Schedule mismatch/i)).toBeInTheDocument();
  });

  it("shows a graceful fallback when no recording exists", async () => {
    await renderJobDetail();

    fireEvent.click(screen.getByRole("button", { name: /Open candidate Bea Soto/i }));

    expect(
      screen.getByText(/No interview recording is available for this candidate yet/i),
    ).toBeInTheDocument();
    expect(
      screen.queryByLabelText(/Interview recording for Bea Soto/i),
    ).not.toBeInTheDocument();
  });
});
