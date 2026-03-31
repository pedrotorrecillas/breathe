"use client";

import { useState } from "react";

import { CandidateEvaluationSummary } from "@/components/candidate-evaluation-summary";
import { CandidateStageCard } from "@/components/candidate-stage-card";
import { DataPoint, DetailPanel, SectionCard } from "@/components/section-card";
import { PlaceholderState } from "@/components/placeholder-state";
import { EmptyState } from "@/components/shared-states";
import type { CandidateEvaluation } from "@/domain/evaluations/types";
import { StatusBadge, scoreBadgeIntent } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { mapNumericScoreToState } from "@/lib/evaluation-scoring";
import { getInterviewRunRuntimeSnapshotByCandidateId } from "@/lib/public-apply-submissions";
import {
  activePipelineStages,
  applyRecruiterAction,
  getCandidatesForStage,
  getJobPipelineSnapshot,
  type JobDetailTab,
  jobDetailTabs,
} from "@/lib/job-pipeline";

type JobDetailWorkspaceProps = {
  jobId: string;
};

type ReportRequirementImportance = "Mandatory" | "Optional";
type ReportBlockCategory = "essential" | "technical" | "interpersonal";

type ReportRequirement = {
  label: string;
  importance: ReportRequirementImportance;
  numericScore: number;
  explanation: string;
};

type ReportBlock = {
  category: ReportBlockCategory;
  title: string;
  numericScore: number;
  requirements: ReportRequirement[];
};

type CandidateReport = {
  finalNumericScore: number;
  blocks: ReportBlock[];
};

const reportBlockTitles: Record<ReportBlockCategory, string> = {
  essential: "Essential requirements",
  technical: "Technical skills",
  interpersonal: "Interpersonal skills",
};

const reportDataByCandidateId: Record<string, CandidateReport> = {
  cand_bea_soto: {
    finalNumericScore: 84.3,
    blocks: [
      {
        category: "essential",
        title: reportBlockTitles.essential,
        numericScore: 89.2,
        requirements: [
          {
            label: "Forklift certification",
            importance: "Mandatory",
            numericScore: 95,
            explanation:
              "Clear certification evidence and direct equipment familiarity support this requirement strongly.",
          },
          {
            label: "Weekend shift flexibility",
            importance: "Optional",
            numericScore: 80,
            explanation:
              "Candidate confirmed reliable weekend coverage and a workable shift pattern for the rota.",
          },
        ],
      },
      {
        category: "technical",
        title: reportBlockTitles.technical,
        numericScore: 82.4,
        requirements: [
          {
            label: "Order-picking throughput",
            importance: "Mandatory",
            numericScore: 87,
            explanation:
              "Described consistent picking volume with clean attendance and stable pace across busy shifts.",
          },
          {
            label: "Warehouse system fluency",
            importance: "Optional",
            numericScore: 76,
            explanation:
              "Has practical scanner and inventory workflow exposure, but not deep systems administration experience.",
          },
        ],
      },
      {
        category: "interpersonal",
        title: reportBlockTitles.interpersonal,
        numericScore: 80.6,
        requirements: [
          {
            label: "Shift handoff communication",
            importance: "Mandatory",
            numericScore: 84,
            explanation:
              "Explained handoffs clearly and gave examples of staying concise during shift changes.",
          },
          {
            label: "Team coordination",
            importance: "Optional",
            numericScore: 74,
            explanation:
              "Shows calm collaboration and reliable response to supervisor direction under time pressure.",
          },
        ],
      },
    ],
  },
  cand_marta_gil: {
    finalNumericScore: 47.8,
    blocks: [
      {
        category: "essential",
        title: reportBlockTitles.essential,
        numericScore: 55.6,
        requirements: [
          {
            label: "Forklift certification",
            importance: "Mandatory",
            numericScore: 61,
            explanation:
              "Basic exposure exists, but the interview evidence does not fully confirm current active certification.",
          },
          {
            label: "Weekend shift flexibility",
            importance: "Optional",
            numericScore: 46,
            explanation:
              "Availability is constrained on several weekends, which weakens coverage for the role.",
          },
        ],
      },
      {
        category: "technical",
        title: reportBlockTitles.technical,
        numericScore: 49.2,
        requirements: [
          {
            label: "Order-picking throughput",
            importance: "Mandatory",
            numericScore: 53,
            explanation:
              "The candidate can do the work, but the evidence for steady high-volume output is limited.",
          },
          {
            label: "Warehouse system fluency",
            importance: "Optional",
            numericScore: 42,
            explanation:
              "Familiarity with common warehouse tools is present, but day-to-day system confidence still looks uneven.",
          },
        ],
      },
      {
        category: "interpersonal",
        title: reportBlockTitles.interpersonal,
        numericScore: 38.4,
        requirements: [
          {
            label: "Shift handoff communication",
            importance: "Mandatory",
            numericScore: 44,
            explanation:
              "Communication is clear enough, but the answers were short and not yet fully operational.",
          },
          {
            label: "Team coordination",
            importance: "Optional",
            numericScore: 33,
            explanation:
              "Team support examples were limited, so the interpersonal signal stays below the strongest candidates.",
          },
        ],
      },
    ],
  },
};

const defaultReport: CandidateReport = {
  finalNumericScore: 61.5,
  blocks: [
    {
      category: "essential",
      title: reportBlockTitles.essential,
      numericScore: 63.5,
      requirements: [
        {
          label: "Core role requirement",
          importance: "Mandatory",
          numericScore: 66,
          explanation:
            "This mock report uses the same block structure as the candidate-specific examples.",
        },
          {
            label: "Support requirement",
            importance: "Optional",
            numericScore: 61,
            explanation:
              "Sample content keeps the report surface stable for any selected candidate.",
          },
      ],
    },
    {
      category: "technical",
      title: reportBlockTitles.technical,
      numericScore: 60.4,
      requirements: [
          {
            label: "Workflow execution",
            importance: "Mandatory",
            numericScore: 64,
            explanation:
              "The sample report keeps a balanced technical block with visible scoring metadata.",
          },
          {
            label: "Tool familiarity",
            importance: "Optional",
            numericScore: 57,
            explanation:
              "This row stays conservative so the layout remains readable in the sidebar.",
          },
      ],
    },
    {
      category: "interpersonal",
      title: reportBlockTitles.interpersonal,
      numericScore: 60.6,
      requirements: [
          {
            label: "Communication quality",
            importance: "Mandatory",
            numericScore: 62,
            explanation:
              "The report surface still shows one explanation per row, even when using example data.",
          },
          {
            label: "Collaboration signal",
            importance: "Optional",
            numericScore: 59,
            explanation:
              "Example data keeps the panel stable without introducing transcript or CV tabs.",
          },
      ],
    },
  ],
};

function getCandidateReport(candidateId: string): CandidateReport {
  return reportDataByCandidateId[candidateId] ?? defaultReport;
}

function buildCandidateReportFromEvaluation(
  evaluation: CandidateEvaluation,
): CandidateReport {
  return {
    finalNumericScore: evaluation.finalNumericScore ?? 0,
    blocks: evaluation.blocks.map((block) => ({
      category: block.category,
      title: block.label,
      numericScore: block.numericScore ?? 0,
      requirements: block.requirements.map((requirement) => ({
        label: requirement.label,
        importance:
          requirement.importance === "MANDATORY" ? "Mandatory" : "Optional",
        numericScore: requirement.numericScore ?? 0,
        explanation: requirement.explanation,
      })),
    })),
  };
}

function scoreBadgeIntentFor(score: number | null) {
  const scoreState = mapNumericScoreToState(score);

  return scoreState === "Pending" ? "neutral" : scoreBadgeIntent[scoreState];
}

export function JobDetailWorkspace({ jobId }: JobDetailWorkspaceProps) {
  const snapshot = getJobPipelineSnapshot(jobId);
  const [activeTab, setActiveTab] = useState<JobDetailTab>("Applicants");
  const [candidates, setCandidates] = useState(() => snapshot?.candidates ?? []);
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);

  if (!snapshot) {
    return null;
  }

  const selectedCandidate =
    candidates.find((candidate) => candidate.id === selectedCandidateId) ??
    null;
  const selectedCandidateRuntime = selectedCandidate
    ? getInterviewRunRuntimeSnapshotByCandidateId(selectedCandidate.id)
    : null;
  const selectedCandidateEvaluation =
    selectedCandidateRuntime?.evaluation ?? null;
  const selectedCandidateReport = selectedCandidateEvaluation
    ? buildCandidateReportFromEvaluation(selectedCandidateEvaluation)
    : selectedCandidate
      ? getCandidateReport(selectedCandidate.id)
      : null;
  const selectedCandidateRecording = selectedCandidateRuntime?.interviewRun.artifacts.recordingUrl
    ? {
        recordingUrl: selectedCandidateRuntime.interviewRun.artifacts.recordingUrl,
        completedAt: selectedCandidateRuntime.interviewRun.trace.completedAt,
      }
    : null;

  const selectCandidate = (candidateId: string) => {
    setSelectedCandidateId(candidateId);
    setPanelOpen(true);
  };

  return (
    <div className="flex flex-1 flex-col gap-6 px-6 py-6 md:px-8">
      <PlaceholderState
        eyebrow="Job detail"
        title="Job detail keeps pipeline review and candidate decisions in one place."
        description="Review the job context, pipeline stages, and candidate evidence without leaving the page."
      >
        <div className="grid gap-4 lg:grid-cols-[1.18fr_0.82fr]">
          <SectionCard
            title="Job context"
            kicker={jobId}
            description="Keep the current job status, intake summary, and key actions visible before inspecting candidates."
            tone="strong"
            actions={<StatusBadge intent="success">Active</StatusBadge>}
          >
            <div className="grid gap-3 sm:grid-cols-3">
              <DataPoint
                label="Candidate intake"
                value="Live"
                detail="Candidate link accepting applications"
              />
              <DataPoint
                label="Interview mode"
                value="Phone"
                detail="Queue-first runtime"
              />
              <DataPoint
                label="Operator focus"
                value="Pipeline"
                detail="Triage and recruiter decisions"
              />
            </div>
            <p className="mt-4 text-sm leading-7 text-slate-600">
              Keep the job-level context visible while the workspace below
              shifts between active stages and rejected candidates.
            </p>
          </SectionCard>

          <DetailPanel
            title="Candidate detail panel"
            kicker="Candidate review"
            description="Open a candidate without leaving the pipeline."
          >
            {panelOpen && selectedCandidate ? (
              <div className="space-y-3">
                <div className="rounded-[0.72rem] border border-cyan-400/30 bg-[linear-gradient(180deg,rgba(16,24,37,0.99),rgba(25,37,55,0.97))] px-4 py-4 text-white">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="ops-kicker text-cyan-200">Selected candidate</p>
                      <p className="mt-3 text-lg font-semibold">
                        {selectedCandidate.fullName}
                      </p>
                    </div>
                    <Button
                      size="xs"
                      variant="outline"
                      onClick={() => setPanelOpen(false)}
                    >
                      Close panel
                    </Button>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-300">
                    {selectedCandidate.summary}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <StatusBadge intent="info" density="compact">
                      {selectedCandidate.stage}
                    </StatusBadge>
                    {selectedCandidate.scoreState ? (
                      <StatusBadge
                        intent={scoreBadgeIntent[selectedCandidate.scoreState]}
                        density="compact"
                      >
                        {selectedCandidate.scoreState}
                      </StatusBadge>
                    ) : null}
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                  <DataPoint
                    label="Current stage"
                    value={selectedCandidate.stage}
                    detail="Selection persists while reviewing pipeline"
                  />
                  <DataPoint
                    label={selectedCandidate.relevantDateLabel}
                    value={selectedCandidate.relevantDateValue}
                    detail="Most recent triage signal"
                  />
                </div>
                {selectedCandidateEvaluation ? (
                  <CandidateEvaluationSummary evaluation={selectedCandidateEvaluation} />
                ) : null}
                <section className="rounded-[0.72rem] border border-slate-200/85 bg-white/90 px-4 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="ops-kicker text-slate-500">Candidate report</p>
                      <p className="mt-2 text-base font-semibold text-slate-950">
                        Recruiter-facing evaluation
                      </p>
                    </div>
                    <div className="text-right">
                      <StatusBadge
                        intent={scoreBadgeIntentFor(selectedCandidateReport?.finalNumericScore ?? null)}
                        density="compact"
                      >
                        {mapNumericScoreToState(
                          selectedCandidateReport?.finalNumericScore ?? null,
                        )}
                      </StatusBadge>
                      <p className="mt-2 font-mono text-xs tracking-[0.14em] text-slate-500 uppercase">
                        {selectedCandidateReport
                          ? `${selectedCandidateReport.finalNumericScore.toFixed(1)} / 100`
                          : "Pending"}
                      </p>
                    </div>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    This report combines essential, technical, and interpersonal
                    blocks for the current candidate. Example data appears
                    until a live evaluation is available.
                  </p>

                  {selectedCandidateReport ? (
                    <div className="mt-4 space-y-3">
                      {selectedCandidateReport.blocks.map((block) => {
                        const blockScoreState = mapNumericScoreToState(block.numericScore);

                        return (
                          <section
                            key={block.category}
                            className="rounded-[0.72rem] border border-slate-200/85 bg-slate-50/80 px-3 py-3"
                          >
                            <div className="flex items-start justify-between gap-3 border-b border-slate-200/80 pb-3">
                              <div>
                                <p className="ops-kicker text-slate-500">
                                  {block.title}
                                </p>
                                <p className="mt-2 text-sm font-semibold text-slate-950">
                                  Block score
                                </p>
                              </div>
                              <div className="text-right">
                                <StatusBadge
                                  intent={scoreBadgeIntentFor(block.numericScore)}
                                  density="compact"
                                >
                                  {blockScoreState}
                                </StatusBadge>
                                <p className="mt-2 font-mono text-xs tracking-[0.14em] text-slate-500 uppercase">
                                  {block.numericScore.toFixed(1)} / 100
                                </p>
                              </div>
                            </div>

                            <div className="mt-3 space-y-2">
                              {block.requirements.map((requirement) => {
                                const requirementScoreState = mapNumericScoreToState(
                                  requirement.numericScore,
                                );

                                return (
                                  <div
                                    key={requirement.label}
                                    className="rounded-[0.64rem] border border-white/80 bg-white/90 px-3 py-3 shadow-[0_1px_0_rgba(15,23,42,0.03)]"
                                  >
                                    <div className="flex items-start justify-between gap-3">
                                      <div>
                                        <p className="text-sm font-semibold text-slate-950">
                                          {requirement.label}
                                        </p>
                                        <div className="mt-2 flex flex-wrap gap-2">
                                          <StatusBadge intent="neutral" density="compact">
                                            {requirement.importance}
                                          </StatusBadge>
                                          <StatusBadge
                                            intent={scoreBadgeIntentFor(
                                              requirement.numericScore,
                                            )}
                                            density="compact"
                                          >
                                            {requirementScoreState}
                                          </StatusBadge>
                                        </div>
                                      </div>
                                      <p className="font-mono text-xs tracking-[0.12em] text-slate-500 uppercase">
                                        {requirement.numericScore.toFixed(1)}
                                      </p>
                                    </div>
                                    <p className="mt-2 text-sm leading-6 text-slate-600">
                                      {requirement.explanation}
                                    </p>
                                  </div>
                                );
                              })}
                            </div>
                          </section>
                        );
                      })}
                    </div>
                  ) : null}

                  <div className="mt-4 rounded-[0.72rem] border border-amber-200/85 bg-amber-50/85 px-3 py-3">
                    <p className="ops-kicker text-amber-700">AI recommendation</p>
                    <p className="mt-2 text-sm leading-6 text-amber-950/90">
                      This output is decision support only. Review the evidence,
                      recruiter context, and job requirements before acting on
                      the recommendation.
                    </p>
                  </div>
                </section>
                <section className="rounded-[0.72rem] border border-slate-200/85 bg-white/90 px-4 py-4">
                  <p className="ops-kicker text-slate-500">Audio review</p>
                  {selectedCandidateRecording ? (
                    <div className="mt-3 rounded-[0.72rem] border border-slate-200/85 bg-slate-50/80 px-3 py-3">
                      <audio
                        controls
                        preload="none"
                        aria-label={`Interview recording for ${selectedCandidate.fullName}`}
                        src={selectedCandidateRecording.recordingUrl}
                        className="w-full"
                      >
                        Your browser does not support the audio element.
                      </audio>
                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        Runtime recording stored for this candidate.
                        {selectedCandidateRecording.completedAt
                          ? ` Captured at ${selectedCandidateRecording.completedAt}.`
                          : null}
                      </p>
                    </div>
                  ) : (
                    <p className="mt-3 text-sm leading-6 text-slate-600">
                      No interview recording is available for this candidate
                      yet. The player appears after a completed runtime run
                      writes recording data into the stored artifacts.
                    </p>
                  )}
                </section>
              </div>
            ) : (
              <EmptyState
                eyebrow="No selection"
                title="Select a candidate card to review their report."
                description="The detail panel stays in this route and updates from the active pipeline."
              />
            )}
          </DetailPanel>
        </div>

        <SectionCard
          title="Pipeline workspace"
          kicker="Recruiter decisions"
          description="Move through the active stages and keep rejected candidates in the same job detail route."
          tone="strong"
        >
          <div className="flex flex-wrap gap-2 border-b border-slate-200/80 pb-4">
            {jobDetailTabs.map((stage) => (
              <button
                key={stage}
                type="button"
                onClick={() => setActiveTab(stage)}
                className={
                  activeTab === stage
                    ? "rounded-[0.55rem] border border-slate-950 bg-slate-950 px-3 py-1.5 text-xs font-medium tracking-[0.14em] text-white uppercase"
                    : "rounded-[0.55rem] border border-slate-300/90 bg-white/85 px-3 py-1.5 text-xs font-medium tracking-[0.14em] text-slate-500 uppercase"
                }
              >
                {stage}
              </button>
            ))}
          </div>

          {activeTab === "Rejected" ? (
            <div className="mt-5 rounded-[0.85rem] border border-slate-200/85 bg-white/84 p-4">
              <div className="flex items-center justify-between gap-3 border-b border-slate-200/80 pb-3">
                <div>
                  <p className="ops-kicker text-slate-500">Rejected</p>
                  <p className="mt-2 text-base font-semibold text-slate-950">
                    Rejected review
                  </p>
                </div>
                <StatusBadge intent="danger" density="compact">
                  {getCandidatesForStage(candidates, "Rejected").length}
                </StatusBadge>
              </div>
              <p className="mt-4 text-sm leading-7 text-slate-600">
                Rejected candidates stay accessible inside this job detail
                surface, but separated from the active pipeline so triage stays
                focused.
              </p>

              <div className="mt-4 grid gap-2 lg:grid-cols-2">
                {getCandidatesForStage(candidates, "Rejected").map((candidate) => (
                  <CandidateStageCard
                    key={candidate.id}
                    candidate={candidate}
                    isSelected={candidate.id === selectedCandidateId}
                    onSelect={selectCandidate}
                    extraBadges={
                      candidate.rejectedReason ? (
                        <StatusBadge intent="warning" density="compact">
                          {candidate.rejectedReason}
                        </StatusBadge>
                      ) : null
                    }
                    footerActions={
                      <Button
                        size="xs"
                        variant="outline"
                        onClick={() => {
                          setCandidates((currentCandidates) =>
                            applyRecruiterAction(
                              currentCandidates,
                              candidate.id,
                              "restore_to_interviewed",
                            ),
                          );
                          setActiveTab("Applicants");
                          setSelectedCandidateId(candidate.id);
                          setPanelOpen(false);
                        }}
                      >
                        Restore
                      </Button>
                    }
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className="mt-5 grid gap-4 xl:grid-cols-4">
              {activePipelineStages.map((stage, index) => {
                const stageCandidates = getCandidatesForStage(candidates, stage);

                return (
                  <section
                    key={stage}
                    className="rounded-[0.85rem] border border-slate-200/85 bg-white/84 p-4"
                  >
                    <div className="flex items-center justify-between gap-3 border-b border-slate-200/80 pb-3">
                      <div>
                        <p className="ops-kicker text-slate-500">{stage}</p>
                        <p className="mt-2 text-base font-semibold text-slate-950">
                          {stageCandidates.length} candidates
                        </p>
                      </div>
                      <StatusBadge
                        intent={index === 0 ? "neutral" : index === 1 ? "info" : index === 2 ? "success" : "warning"}
                        density="compact"
                      >
                        {stageCandidates.length}
                      </StatusBadge>
                    </div>
                    <p className="mt-4 text-sm leading-6 text-slate-600">
                      {stage === "Applicants"
                        ? "Candidates waiting for interview progress or recruiter review."
                        : stage === "Interviewed"
                          ? "Completed interview runs ready for recruiter triage."
                          : stage === "Shortlisted"
                            ? "Candidates explicitly promoted for next-step review."
                            : "Final recruiter-confirmed outcomes for this job."}
                    </p>
                    {stageCandidates.length > 0 ? (
                      <div className="mt-4 grid gap-2">
                        {stageCandidates.map((candidate) => (
                          <CandidateStageCard
                            key={candidate.id}
                            candidate={candidate}
                            isSelected={candidate.id === selectedCandidateId}
                            onSelect={selectCandidate}
                            showOperationalState={stage === "Applicants"}
                            footerActions={
                              <>
                                {stage === "Interviewed" ? (
                                  <Button
                                    size="xs"
                                    variant="secondary"
                                    onClick={() =>
                                      setCandidates((currentCandidates) =>
                                        applyRecruiterAction(
                                          currentCandidates,
                                          candidate.id,
                                          "shortlist",
                                        ),
                                      )
                                    }
                                  >
                                    Shortlist
                                  </Button>
                                ) : null}
                                {stage === "Shortlisted" ? (
                                  <>
                                    <Button
                                      size="xs"
                                      variant="default"
                                      onClick={() =>
                                        setCandidates((currentCandidates) =>
                                          applyRecruiterAction(
                                            currentCandidates,
                                            candidate.id,
                                            "hire",
                                          ),
                                        )
                                      }
                                    >
                                      Hire
                                    </Button>
                                    <Button
                                      size="xs"
                                      variant="outline"
                                      onClick={() =>
                                        setCandidates((currentCandidates) =>
                                          applyRecruiterAction(
                                            currentCandidates,
                                            candidate.id,
                                            "move_to_interviewed",
                                          ),
                                        )
                                      }
                                    >
                                      Back to interviewed
                                    </Button>
                                  </>
                                ) : null}
                                {stage === "Hired" ? (
                                  <Button
                                    size="xs"
                                    variant="outline"
                                    onClick={() =>
                                      setCandidates((currentCandidates) =>
                                        applyRecruiterAction(
                                          currentCandidates,
                                          candidate.id,
                                          "move_to_shortlisted",
                                        ),
                                      )
                                    }
                                  >
                                    Back to shortlisted
                                  </Button>
                                ) : null}
                                {stage === "Applicants" || stage === "Interviewed" ? (
                                  <Button
                                    size="xs"
                                    variant="outline"
                                    onClick={() => {
                                      setCandidates((currentCandidates) =>
                                        applyRecruiterAction(
                                          currentCandidates,
                                          candidate.id,
                                          "reject",
                                        ),
                                      );
                                      setSelectedCandidateId(candidate.id);
                                      setActiveTab("Rejected");
                                      setPanelOpen(false);
                                    }}
                                  >
                                    Reject
                                  </Button>
                                ) : null}
                              </>
                            }
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="mt-4">
                        <EmptyState
                          eyebrow="Stage empty"
                          title="No candidates in this stage."
                          description="The stage remains visible even when there is no current volume."
                        />
                      </div>
                    )}
                  </section>
                );
              })}
            </div>
          )}
        </SectionCard>
      </PlaceholderState>
    </div>
  );
}
