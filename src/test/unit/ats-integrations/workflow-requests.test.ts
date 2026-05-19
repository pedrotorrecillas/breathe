import { describe, expect, it } from "vitest";

import type {
  ATSCanonicalApplication,
  ATSConnection,
} from "@/domain/ats-integrations/types";
import type { CandidateEvaluation } from "@/domain/evaluations/types";
import type { InterviewRun } from "@/domain/interviews/types";
import {
  buildATSWorkflowRequestsForEvent,
  enqueueATSWritebacksForEvaluation,
} from "@/lib/ats-integrations/workflow-requests";
import { stageMappingValueForExternalStage } from "@/lib/ats-integrations/stage-mappings";

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

const interviewRun: InterviewRun = {
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
};

const linkedApplication: ATSCanonicalApplication = {
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
};

function buildConnection(
  overrides: Partial<ATSConnection> = {},
): ATSConnection {
  return {
    id: "ats_conn_1",
    companyId: "company_1",
    provider: "mock_ats",
    status: "active",
    displayName: "Mock ATS",
    authMode: "mock",
    secretRef: null,
    externalAccountId: "mock_account",
    lastSyncAt: null,
    lastError: null,
    createdAt: "2026-05-19T10:00:00.000Z",
    updatedAt: "2026-05-19T10:00:00.000Z",
    ...overrides,
  };
}

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
        connectionId: "ats_conn_1",
        provider: "mock_ats",
        atsSyncEventId: "ats_evt_1",
        atsTriggerRuleId: "rule_1",
        externalApplicationId: "mock_app_1",
        internalCandidateId: null,
        internalApplicationId: null,
        requestedActions: [
          "import_candidate",
          "prepare_interview",
          "queue_interview",
        ],
        requiresRecruiterApproval: true,
        status: "queued",
        createdAt: "2026-05-19T10:01:00.000Z",
        updatedAt: "2026-05-19T10:01:00.000Z",
      },
    ]);
  });

  it("enqueues writeback actions for linked ATS applications", () => {
    const actions = enqueueATSWritebacksForEvaluation({
      evaluation,
      interviewRun,
      atsConnections: [buildConnection()],
      atsApplications: [linkedApplication],
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

  it("does not enqueue evaluation writebacks for externally archived ATS applications", () => {
    const actions = enqueueATSWritebacksForEvaluation({
      evaluation,
      interviewRun,
      atsConnections: [buildConnection()],
      atsApplications: [
        {
          ...linkedApplication,
          status: "archived_external",
        },
      ],
      existingActions: [],
      now: "2026-05-19T11:01:00.000Z",
    });

    expect(actions).toEqual([]);
  });

  it("does not enqueue evaluation writebacks for paused ATS connections", () => {
    const actions = enqueueATSWritebacksForEvaluation({
      evaluation,
      interviewRun,
      atsConnections: [buildConnection({ status: "paused" })],
      atsApplications: [linkedApplication],
      existingActions: [],
      now: "2026-05-19T11:01:00.000Z",
    });

    expect(actions).toEqual([]);
  });

  it("enqueues writebacks for every linked ATS application", () => {
    const secondLinkedApplication: ATSCanonicalApplication = {
      ...linkedApplication,
      id: "ats_app_2",
      connectionId: "ats_conn_2",
      externalId: "zoho_app_1",
      externalCandidateId: "zoho_candidate_ana",
      provider: "zoho_recruit",
    };

    const actions = enqueueATSWritebacksForEvaluation({
      evaluation,
      interviewRun,
      atsConnections: [
        buildConnection(),
        buildConnection({
          id: "ats_conn_2",
          provider: "zoho_recruit",
          displayName: "Zoho Recruit demo",
          authMode: "env_token",
          secretRef: "env:ZOHO_RECRUIT_ACCESS_TOKEN",
        }),
      ],
      atsApplications: [linkedApplication, secondLinkedApplication],
      existingActions: [],
      now: "2026-05-19T11:01:00.000Z",
    });

    expect(actions).toHaveLength(2);
    expect(actions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          connectionId: "ats_conn_1",
          provider: "mock_ats",
          targetExternalCandidateId: "mock_candidate_ana",
          targetExternalApplicationId: "mock_app_1",
        }),
        expect.objectContaining({
          connectionId: "ats_conn_2",
          provider: "zoho_recruit",
          targetExternalCandidateId: "zoho_candidate_ana",
          targetExternalApplicationId: "zoho_app_1",
        }),
      ]),
    );
  });

  it("formats evaluation writebacks as a recruiter-readable interview report", () => {
    const actions = enqueueATSWritebacksForEvaluation({
      evaluation: {
        ...evaluation,
        finalNumericScore: 74,
        finalScoreState: "Good",
        fitClassification: "viable_fit",
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
            ],
          },
          {
            category: "interpersonal",
            label: "Interpersonal skills",
            numericScore: 41,
            scoreState: "Low",
            requirements: [
              {
                requirementId: "req_2",
                label: "Team communication",
                importance: "OPTIONAL",
                numericScore: 41,
                scoreState: "Low",
                explanation: "Some evidence of communication.",
                evidence: null,
              },
            ],
          },
        ],
      },
      interviewRun,
      atsConnections: [buildConnection()],
      atsApplications: [linkedApplication],
      existingActions: [],
      now: "2026-05-19T11:01:00.000Z",
    });

    expect(actions[0].payload).toMatchObject({
      summary: "Good · 74/100",
      fitClassification: "viable_fit",
      finalNumericScore: 74,
      finalScoreState: "Good",
    });
    expect(actions[0].payload.body).toContain("Breathe interview report");
    expect(actions[0].payload.body).toContain("Result: Good · 74/100");
    expect(actions[0].payload.body).toContain("Fit: viable_fit");
    expect(actions[0].payload.body).toContain(
      "Essential requirements stand out as the strongest block",
    );
    expect(actions[0].payload.body).toContain(
      "- Warehouse experience (Great)",
    );
    expect(actions[0].payload.body).toContain("- Team communication (Low)");
  });

  it("uses status comment report mode as the stage move comment payload", () => {
    const actions = enqueueATSWritebacksForEvaluation({
      evaluation,
      interviewRun,
      atsConnections: [
        buildConnection({
          writebackPolicy: {
            reportMode: "status_comment",
            moveToExternalStageId: "mock_stage_interview_completed",
            requiresRecruiterReview: false,
          },
        }),
      ],
      atsApplications: [linkedApplication],
      existingActions: [],
      now: "2026-05-19T11:01:00.000Z",
    });

    expect(actions).toHaveLength(1);
    expect(actions[0]).toMatchObject({
      actionType: "application_stage_move",
      targetExternalCandidateId: "mock_candidate_ana",
      targetExternalApplicationId: "mock_app_1",
      targetExternalStageId: "mock_stage_interview_completed",
    });
    expect(actions[0].payload.body).toContain("Breathe interview report");
  });

  it("uses scoped writeback target stages without leaking the scope to the ATS", () => {
    const actions = enqueueATSWritebacksForEvaluation({
      evaluation,
      interviewRun,
      atsConnections: [
        buildConnection({
          writebackPolicy: {
            reportMode: "status_comment",
            moveToExternalStageId: stageMappingValueForExternalStage({
              externalJobId: "mock_job_store_associate",
              externalStageId: "mock_stage_interview_completed",
            }),
            requiresRecruiterReview: false,
          },
        }),
      ],
      atsApplications: [linkedApplication],
      existingActions: [],
      now: "2026-05-19T11:01:00.000Z",
    });

    expect(actions).toHaveLength(1);
    expect(actions[0]).toMatchObject({
      actionType: "application_stage_move",
      targetExternalJobId: "mock_job_store_associate",
      targetExternalStageId: "mock_stage_interview_completed",
    });
  });

  it("does not enqueue report writeback when the admin policy disables reports", () => {
    const actions = enqueueATSWritebacksForEvaluation({
      evaluation,
      interviewRun,
      atsConnections: [
        buildConnection({
          writebackPolicy: {
            reportMode: "disabled",
            moveToExternalStageId: null,
            requiresRecruiterReview: true,
          },
        }),
      ],
      atsApplications: [linkedApplication],
      existingActions: [],
      now: "2026-05-19T11:01:00.000Z",
    });

    expect(actions).toEqual([]);
  });
});
