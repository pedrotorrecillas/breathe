import { afterEach, describe, expect, it } from "vitest";

import type { CandidateEvaluation } from "@/domain/evaluations/types";
import { publicApplyTermsVersion } from "@/lib/public-apply";
import { getInterviewRecordingForCandidate } from "@/lib/candidate-recording";
import {
  getPublicApplySubmissionSnapshot,
  getInterviewEvaluation,
  getInterviewRunRuntimeSnapshot,
  receiveHappyRobotWebhook,
  resetPublicApplySubmissionStore,
  saveInterviewEvaluation,
  submitPublicApplication,
} from "@/lib/public-apply-submissions";

describe("public apply submissions", () => {
  afterEach(async () => {
    await resetPublicApplySubmissionStore();
  });

  it("creates linked candidate, application, and interview run records", async () => {
    const result = await submitPublicApplication({
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

    expect(result.success).toBe(true);

    if (!result.success) {
      return;
    }

    expect(result.data.application.candidateId).toBe(result.data.candidate.id);
    expect(result.data.interviewRun.candidateId).toBe(result.data.candidate.id);
    expect(result.data.interviewRun.applicationId).toBe(
      result.data.application.id,
    );
    expect(result.data.interviewRun.status).toBe("queued");
    expect(result.data.interviewRun.pipelineStage).toBe("applicant");
    expect(result.data.application.stage).toBe("applicant");
    expect(result.data.interviewRun.interviewPreparationId).toBe(
      result.data.interviewPackage.id,
    );
    expect(result.data.callRequest.interviewPackageId).toBe(
      result.data.interviewPackage.id,
    );
    expect(result.data.dispatchResponse.success).toBe(true);
    expect(result.data.interviewRun.dispatch.providerCallId).toBe(
      "hr_call_run_1",
    );
    expect((await getPublicApplySubmissionSnapshot()).runtimeTraceEvents).toHaveLength(4);
    expect((await getInterviewRunRuntimeSnapshot("run_1"))?.runtimeTraceEvents).toEqual([
      expect.objectContaining({
        phase: "interview_preparation.started",
        interviewRunId: "run_1",
      }),
      expect.objectContaining({
        phase: "interview_preparation.completed",
        interviewRunId: "run_1",
      }),
      expect.objectContaining({
        phase: "dispatch.started",
        interviewRunId: "run_1",
      }),
      expect.objectContaining({
        phase: "dispatch.completed",
        interviewRunId: "run_1",
        providerCallId: "hr_call_run_1",
      }),
    ]);
  });

  it("forwards runtime trace events to an optional sink without changing persistence", async () => {
    const forwardedEvents: Array<{ phase: string; interviewRunId: string }> = [];

    const result = await submitPublicApplication(
      {
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
      },
      {
        traceSink: (event) => {
          forwardedEvents.push({
            phase: event.phase,
            interviewRunId: event.interviewRunId,
          });
        },
      },
    );

    expect(result.success).toBe(true);
    expect(forwardedEvents).toEqual([
      {
        phase: "interview_preparation.started",
        interviewRunId: "run_1",
      },
      {
        phase: "interview_preparation.completed",
        interviewRunId: "run_1",
      },
      {
        phase: "dispatch.started",
        interviewRunId: "run_1",
      },
      {
        phase: "dispatch.completed",
        interviewRunId: "run_1",
      },
    ]);
    expect((await getPublicApplySubmissionSnapshot()).runtimeTraceEvents).toHaveLength(4);
  });

  it("does not persist partial state when a staged failure happens", async () => {
    const result = await submitPublicApplication(
      {
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
      },
      {
        failureMode: "application",
      },
    );

    expect(result).toEqual({
      success: false,
      error: "Application creation failed before persistence.",
    });
    expect(await getPublicApplySubmissionSnapshot()).toEqual({
      candidates: [],
      applications: [],
      interviewRuns: [],
      interviewPreparationPackages: [],
      dispatchRequests: [],
      dispatchPayloads: [],
      dispatchResponses: [],
      webhookRecords: [],
      runtimeTraceEvents: [],
    });
  });

  it("stores webhook records and updates the linked interview run", async () => {
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

    const webhookResult = await receiveHappyRobotWebhook(
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

    expect(webhookResult.success).toBe(true);

    const snapshot = await getPublicApplySubmissionSnapshot();

    expect(snapshot.webhookRecords).toHaveLength(1);
    expect(snapshot.interviewRuns[0]?.status).toBe("completed");
    expect(snapshot.interviewRuns[0]?.pipelineStage).toBe("interviewed");
    expect(snapshot.applications[0]?.stage).toBe("interviewed");
    expect(snapshot.interviewRuns[0]?.artifacts.recordingUrl).toBe(
      "https://example.com/recording.mp3",
    );
    expect(snapshot.interviewRuns[0]?.trace.completedAt).toBe(
      "2026-03-25T12:05:00.000Z",
    );
    expect(await getInterviewRecordingForCandidate("Lucia Torres")).toEqual({
      recordingUrl: "https://example.com/recording.mp3",
      recordingDurationSeconds: null,
      providerCallId: "hr_call_run_1",
      completedAt: "2026-03-25T12:05:00.000Z",
      transcriptUrl: "https://example.com/transcript.txt",
    });
    expect((await getPublicApplySubmissionSnapshot()).applications[0]?.stage).toBe(
      "interviewed",
    );

    expect(await getInterviewRunRuntimeSnapshot("run_1")).toMatchObject({
      interviewRun: {
        id: "run_1",
        dispatch: {
          providerCallId: "hr_call_run_1",
          providerAgentId: "gala-v1",
          providerSessionId: "hr_session_run_1",
        },
        metadata: {
          providerOutcomeLabel: "completed",
        },
        artifacts: {
          recordingUrl: "https://example.com/recording.mp3",
          transcriptUrl: "https://example.com/transcript.txt",
          providerPayloadSnapshotRef: "payloads/evt_1.json",
        },
      },
      dispatchRequest: {
        interviewRunId: "run_1",
        interviewPackageId: "prep_job_warehouse_madrid_cand_1",
      },
      dispatchPayload: {
        interviewRunId: "run_1",
        outboundNumber: "+34910000000",
      },
      dispatchResponse: {
        success: true,
        result: {
          providerCallId: "hr_call_run_1",
          providerAgentId: "gala-v1",
          providerSessionId: "hr_session_run_1",
        },
      },
      webhookRecords: [
        {
          matchedInterviewRunId: "run_1",
        },
      ],
      runtimeTraceEvents: [
        {
          phase: "interview_preparation.started",
        },
        {
          phase: "interview_preparation.completed",
        },
        {
          phase: "dispatch.started",
        },
        {
          phase: "dispatch.completed",
        },
      ],
      evaluation: null,
    });
  });

  it("automatically stores an evaluation when a completed transcript is available", async () => {
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

    const webhookResult = await receiveHappyRobotWebhook(
      {
        eventId: "evt_2",
        interviewRunId: "run_1",
        providerCallId: "hr_call_run_1",
        status: "completed",
        happenedAt: "2026-03-25T12:05:00.000Z",
        recordingUrl: "https://example.com/recording.mp3",
        transcriptUrl: "https://example.com/transcript.txt",
        transcript: "I worked in a warehouse for four years and used handheld scanners daily. I communicate clearly with shift leads and can work nights.",
        rawPayloadRef: "payloads/evt_2.json",
      },
      {
        receivedAt: new Date("2026-03-25T12:05:01.000Z"),
      },
    );

    expect(webhookResult.success).toBe(true);

    const evaluation = await getInterviewEvaluation("run_1");
    expect(evaluation).not.toBeNull();
    expect(evaluation?.finalNumericScore).not.toBeNull();
    expect(evaluation?.blocks).toHaveLength(3);
    expect(evaluation?.blocks[0]?.requirements).toHaveLength(1);
    expect(evaluation?.blocks[1]?.requirements).toHaveLength(1);
    expect(evaluation?.blocks[2]?.requirements).toHaveLength(1);
    expect((await getInterviewRunRuntimeSnapshot("run_1"))?.evaluation).toEqual(evaluation);
  });

  it("stores and retrieves an evaluation for an existing interview run", async () => {
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
          numericScore: 78,
          scoreState: "Great",
          requirements: [],
        },
        {
          category: "technical",
          label: "Technical skills",
          numericScore: 70,
          scoreState: "Good",
          requirements: [],
        },
        {
          category: "interpersonal",
          label: "Interpersonal skills",
          numericScore: 68,
          scoreState: "Good",
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

    const saveResult = await saveInterviewEvaluation(evaluation);

    expect(saveResult).toEqual({
      success: true,
      data: evaluation,
    });
    expect(await getInterviewEvaluation("run_1")).toEqual(evaluation);
    expect((await getPublicApplySubmissionSnapshot()).interviewRuns).toHaveLength(1);
  });

  it("refuses to store an evaluation when the interview run is missing", async () => {
    const evaluation: CandidateEvaluation = {
      id: "eval_1",
      interviewRunId: "missing_run",
      generatedAt: "2026-03-25T12:15:00.000Z",
      finalNumericScore: 74,
      finalScoreState: "Good",
      blocks: [],
      weightConfigSnapshot: {
        mandatoryRequirementWeight: 0.8,
        optionalRequirementWeight: 0.2,
        essentialBlockWeight: 0.45,
        technicalBlockWeight: 0.45,
        interpersonalBlockWeight: 0.1,
      },
      fitClassification: null,
    };

    const saveResult = await saveInterviewEvaluation(evaluation);

    expect(saveResult).toEqual({
      success: false,
      error: "Evaluation could not be stored because the interview run was not found.",
    });
    expect(await getInterviewEvaluation("missing_run")).toBeNull();
    expect((await getPublicApplySubmissionSnapshot()).interviewRuns).toHaveLength(0);
  });
});
