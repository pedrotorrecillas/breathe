import { describe, expect, it } from "vitest";

import type { CandidateEvaluation } from "@/domain/evaluations/types";
import {
  buildATSWorkflowRequestsForEvent,
  enqueueATSWritebacksForEvaluation,
} from "@/lib/ats-integrations/workflow-requests";

describe("ATS workflow requests", () => {
  it("creates queued workflow requests from trigger matches", () => {
    const requests = buildATSWorkflowRequestsForEvent({
      event: {
        id: "ats_evt_1",
        companyId: "company_1",
        connectionId: "ats_conn_1",
        provider: "mock_ats",
        eventType: "application_seen",
        externalObjectType: "application",
        externalObjectId: "mock_app_1",
        externalJobId: "mock_job_store_associate",
        externalCandidateId: "mock_candidate_ana",
        externalStageId: "mock_stage_breathe_screen",
        occurredAt: "2026-05-19T10:00:00.000Z",
        processedAt: null,
        idempotencyKey: "event_key",
        payload: {},
      },
      matches: [
        {
          ruleId: "rule_1",
          actions: ["import_candidate", "prepare_interview", "queue_interview"],
          requiresRecruiterApproval: true,
        },
      ],
      now: "2026-05-19T10:01:00.000Z",
    });

    expect(requests).toEqual([
      {
        id: "ats_workflow_ats_evt_1_rule_1",
        companyId: "company_1",
        atsSyncEventId: "ats_evt_1",
        atsTriggerRuleId: "rule_1",
        externalApplicationId: "mock_app_1",
        internalCandidateId: null,
        internalApplicationId: null,
        requestedActions: ["import_candidate", "prepare_interview", "queue_interview"],
        requiresRecruiterApproval: true,
        status: "queued",
        createdAt: "2026-05-19T10:01:00.000Z",
        updatedAt: "2026-05-19T10:01:00.000Z",
      },
    ]);
  });

  it("enqueues writeback actions for linked ATS applications", () => {
    const evaluation: CandidateEvaluation = {
      id: "eval_1",
      companyId: "company_1",
      interviewRunId: "run_1",
      generatedAt: "2026-05-19T11:00:00.000Z",
      finalNumericScore: 86,
      finalScoreState: "Great",
      blocks: [],
      weightConfigSnapshot: {
        mandatoryRequirementWeight: 0.8,
        optionalRequirementWeight: 0.2,
        essentialBlockWeight: 0.45,
        technicalBlockWeight: 0.45,
        interpersonalBlockWeight: 0.1,
      },
      fitClassification: "strong_fit",
    };

    const actions = enqueueATSWritebacksForEvaluation({
      evaluation,
      interviewRun: {
        id: "run_1",
        companyId: "company_1",
        candidateId: "candidate_1",
        applicationId: "app_1",
        jobId: "job_1",
        interviewPreparationId: null,
        provider: "happyrobot",
        status: "completed",
        pipelineStage: "interviewed",
        dispatch: {
          dispatchedAt: null,
          providerCallId: null,
          providerAgentId: null,
          providerSessionId: null,
          outboundNumber: null,
        },
        metadata: {
          selectedLanguage: "es",
          candidateTimezone: {
            timezone: null,
            localDateTime: null,
            utcDateTime: null,
          },
          disclosedWithAi: true,
          disclosureText: "",
          callbackRequestedAt: null,
          failureReason: null,
          providerOutcomeLabel: null,
        },
        trace: {
          createdAt: "2026-05-19T10:00:00.000Z",
          normalizedAt: null,
          initiatedAt: null,
          completedAt: "2026-05-19T11:00:00.000Z",
          lastEventAt: "2026-05-19T11:00:00.000Z",
        },
        artifacts: {
          recordingUrl: null,
          transcriptUrl: null,
          transcriptAssetRef: null,
          providerPayloadSnapshotRef: null,
          recordingDurationSeconds: null,
        },
      },
      atsApplications: [
        {
          id: "ats_app_1",
          companyId: "company_1",
          connectionId: "ats_conn_1",
          provider: "mock_ats",
          externalId: "mock_app_1",
          externalCandidateId: "mock_candidate_ana",
          externalJobId: "mock_job_store_associate",
          externalStageId: "mock_stage_breathe_screen",
          externalUrl: null,
          internalCandidateId: "candidate_1",
          internalApplicationId: "app_1",
          internalJobId: "job_1",
          candidateName: "Ana Martin",
          candidateEmail: "ana@example.com",
          candidatePhone: "+34600000000",
          jobTitle: "Store Associate",
          stageName: "Breathe Screen",
          stageCategory: "screening",
          status: "active",
          externalUpdatedAt: "2026-05-19T10:00:00.000Z",
          lastSeenAt: "2026-05-19T10:00:00.000Z",
          rawSnapshot: {},
        },
      ],
      existingActions: [],
      now: "2026-05-19T11:01:00.000Z",
    });

    expect(actions).toHaveLength(1);
    expect(actions[0]).toMatchObject({
      provider: "mock_ats",
      actionType: "candidate_note",
      targetExternalCandidateId: "mock_candidate_ana",
      sourceObjectType: "evaluation",
      sourceObjectId: "eval_1",
      status: "queued",
    });
  });
});
