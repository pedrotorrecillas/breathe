"use client";

import Link from "next/link";
import { useState } from "react";

import { CandidateStageCard } from "@/components/candidate-stage-card";
import { PlaceholderState } from "@/components/placeholder-state";
import { EmptyState } from "@/components/shared-states";
import { StatusBadge, scoreBadgeIntent } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import type { CandidateApplication, CandidateProfile } from "@/domain/candidates/types";
import type { CandidateEvaluation } from "@/domain/evaluations/types";
import type { InterviewPreparationPackage } from "@/domain/interview-preparation/types";
import type { InterviewRun } from "@/domain/interviews/types";
import type {
  HappyRobotCallRequest,
  HappyRobotDispatchResponse,
  HappyRobotNormalizedDispatchPayload,
  HappyRobotWebhookRecord,
} from "@/domain/runtime/happyrobot/types";
import { mapNumericScoreToState } from "@/lib/evaluation-scoring";
import {
  activePipelineStages,
  applyRecruiterAction,
  getCandidatesForStage,
  type PipelineCandidate,
} from "@/lib/job-pipeline";
import type { RuntimeTraceEvent } from "@/lib/runtime-tracing";

type JobDetailWorkspaceProps = {
  initialSnapshot: {
    title: string;
    publicApplyPath: string | null;
    candidates: PipelineCandidate[];
  };
  runtimeSnapshotsByCandidateId: Record<
    string,
    {
      interviewRun: InterviewRun;
      candidate: CandidateProfile | null;
      application: CandidateApplication | null;
      interviewPreparationPackage: InterviewPreparationPackage | null;
      dispatchRequest: HappyRobotCallRequest | null;
      dispatchPayload: HappyRobotNormalizedDispatchPayload | null;
      dispatchResponse: HappyRobotDispatchResponse | null;
      webhookRecords: HappyRobotWebhookRecord[];
      runtimeTraceEvents: RuntimeTraceEvent[];
      evaluation: CandidateEvaluation | null;
    } | null
  >;
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
  requirements: ReportRequirement[];
};

type CandidateReport = {
  finalNumericScore: number;
  blocks: ReportBlock[];
};

function buildCandidateReportFromEvaluation(
  evaluation: CandidateEvaluation,
): CandidateReport {
  return {
    finalNumericScore: evaluation.finalNumericScore ?? 0,
    blocks: evaluation.blocks.map((block) => ({
      category: block.category,
      title: block.label,
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

function humanizeRequirementExplanation(explanation: string) {
  const trimmed = explanation.trim();

  if (!trimmed) {
    return "No clear evidence was captured for this requirement yet.";
  }

  return trimmed
    .replace(/^direct evidence of\s+/i, "The candidate showed ")
    .replace(/^evidence of\s+/i, "The candidate showed ")
    .replace(/^candidate demonstrated\s+/i, "The candidate showed ")
    .replace(/^candidate shared\s+/i, "The candidate shared ")
    .replace(/^provided evidence of\s+/i, "The candidate showed ")
    .replace(/^no evidence of\s+/i, "The interview did not surface evidence of ")
    .replace(/^limited evidence of\s+/i, "Only limited evidence came through for ");
}

export function JobDetailWorkspace({
  initialSnapshot,
  runtimeSnapshotsByCandidateId,
}: JobDetailWorkspaceProps) {
  const [candidates, setCandidates] = useState(() => initialSnapshot.candidates);
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [showRejected, setShowRejected] = useState(false);

  const selectedCandidate =
    candidates.find((candidate) => candidate.id === selectedCandidateId) ?? null;
  const selectedCandidateRuntime = selectedCandidate
    ? runtimeSnapshotsByCandidateId[selectedCandidate.id] ?? null
    : null;
  const selectedCandidateEvaluation =
    selectedCandidateRuntime?.evaluation ?? null;
  const selectedCandidateReport = selectedCandidateEvaluation
    ? buildCandidateReportFromEvaluation(selectedCandidateEvaluation)
    : null;
  const selectedCandidateRecording = selectedCandidateRuntime?.interviewRun.artifacts
    .recordingUrl
    ? {
        recordingUrl: selectedCandidateRuntime.interviewRun.artifacts.recordingUrl,
      }
    : null;

  const selectCandidate = (candidateId: string) => {
    setSelectedCandidateId(candidateId);
    setPanelOpen(true);
  };

  const applicantCount = getCandidatesForStage(candidates, "Applicants").length;
  const interviewedCount = getCandidatesForStage(candidates, "Interviewed").length;
  const shortlistedCount = getCandidatesForStage(candidates, "Shortlisted").length;
  const hiredCount = getCandidatesForStage(candidates, "Hired").length;
  const rejectedCount = getCandidatesForStage(candidates, "Rejected").length;
  const visiblePipelineStages = showRejected ? (["Rejected"] as const) : activePipelineStages;
  const selectedCandidateScoreState = selectedCandidateReport
    ? mapNumericScoreToState(selectedCandidateReport.finalNumericScore)
    : selectedCandidate?.scoreState ?? null;

  return (
    <div className="flex flex-1 flex-col gap-6 px-6 py-6 md:px-8">
      <PlaceholderState
        eyebrow="Job detail"
        title={initialSnapshot.title}
        description=""
      >
        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            {["Job detail", "Preview", "Applicants", "Interview outcome"].map(
              (item) => (
                <span
                  key={item}
                  className="rounded-full border border-slate-200/85 bg-white/92 px-3 py-1 text-[11px] font-medium tracking-[0.16em] text-slate-500 uppercase"
                >
                  {item}
                </span>
              ),
            )}
            <StatusBadge intent="success">Active</StatusBadge>
          </div>

          <div className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-200/80 pb-4">
            <div className="flex flex-wrap gap-5">
              <div>
                <p className="ops-kicker text-slate-500">Applicants</p>
                <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                  {applicantCount}
                </p>
              </div>
              <div>
                <p className="ops-kicker text-slate-500">Interviewed</p>
                <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                  {interviewedCount}
                </p>
              </div>
              <div>
                <p className="ops-kicker text-slate-500">Shortlisted</p>
                <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                  {shortlistedCount}
                </p>
              </div>
              <div>
                <p className="ops-kicker text-slate-500">Hired</p>
                <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                  {hiredCount}
                </p>
              </div>
            </div>
            {initialSnapshot.publicApplyPath ? (
              <div className="min-w-0">
                <p className="ops-kicker text-slate-500">Applicant link</p>
                <Link
                  href={initialSnapshot.publicApplyPath}
                  className="mt-2 inline-flex text-sm font-medium text-slate-950 underline underline-offset-4"
                >
                  Open public apply
                </Link>
              </div>
            ) : null}
          </div>

          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setShowRejected((current) => !current)}
              className={
                showRejected
                  ? "rounded-full border border-slate-950 bg-slate-950 px-3 py-1.5 text-[11px] font-medium tracking-[0.14em] text-white uppercase"
                  : "rounded-full border border-slate-300/90 bg-white/90 px-3 py-1.5 text-[11px] font-medium tracking-[0.14em] text-slate-500 uppercase"
              }
            >
              Rejected {rejectedCount > 0 ? `(${rejectedCount})` : ""}
            </button>
          </div>

          <div className="grid gap-4 xl:grid-cols-4">
            {visiblePipelineStages.map((stage) => {
              const stageCandidates = getCandidatesForStage(candidates, stage);

              return (
                <section
                  key={stage}
                  className="rounded-[0.85rem] border border-slate-200/85 bg-white/84 p-4"
                >
                  <div className="flex items-center justify-between gap-3 border-b border-slate-200/80 pb-3">
                    <p className="text-base font-semibold text-slate-950">{stage}</p>
                    <p className="text-base font-semibold tracking-tight text-slate-500">
                      {stageCandidates.length}
                    </p>
                  </div>

                  {stageCandidates.length > 0 ? (
                    <div className="mt-4 grid gap-2">
                      {stageCandidates.map((candidate) => (
                        <CandidateStageCard
                          key={candidate.id}
                          candidate={candidate}
                          isSelected={candidate.id === selectedCandidateId}
                          onSelect={selectCandidate}
                          showOperationalState={stage === "Applicants"}
                          extraBadges={
                            stage === "Rejected" && candidate.rejectedReason ? (
                              <StatusBadge intent="warning" density="compact">
                                {candidate.rejectedReason}
                              </StatusBadge>
                            ) : null
                          }
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
                              {stage === "Rejected" ? (
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
                                    setShowRejected(false);
                                    setSelectedCandidateId(candidate.id);
                                    setPanelOpen(false);
                                  }}
                                >
                                  Restore
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
                                    setShowRejected(true);
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
        </div>

        {panelOpen && selectedCandidate ? (
          <>
            <div
              className="fixed inset-0 z-40 bg-slate-950/38 backdrop-blur-[2px]"
              onClick={() => {
                setPanelOpen(false);
                setSelectedCandidateId(null);
              }}
            />
            <aside className="fixed inset-y-0 right-0 z-50 flex w-full max-w-[42rem] flex-col overflow-y-auto border-l border-slate-200/80 bg-[linear-gradient(180deg,rgba(250,251,252,0.98),rgba(244,247,250,0.98))] px-5 py-5 shadow-[-18px_0_48px_rgba(15,23,42,0.14)] sm:px-6">
              <div className="space-y-5">
                <div className="flex items-start justify-between gap-4 border-b border-slate-200/80 pb-4">
                  <div className="min-w-0">
                    <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
                      {selectedCandidate.fullName}
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {selectedCandidate.summary}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <StatusBadge intent="info" density="compact">
                        {selectedCandidate.stage}
                      </StatusBadge>
                      {selectedCandidateScoreState ? (
                        <StatusBadge
                          intent={scoreBadgeIntent[selectedCandidateScoreState]}
                          density="compact"
                        >
                          {selectedCandidateScoreState}
                        </StatusBadge>
                      ) : null}
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="ops-kicker text-slate-500">Score</p>
                    <p className="mt-2 text-4xl font-semibold tracking-tight text-slate-950">
                      {selectedCandidateReport
                        ? selectedCandidateReport.finalNumericScore.toFixed(0)
                        : "--"}
                    </p>
                  </div>
                </div>

                <section className="space-y-3">
                  {selectedCandidateReport ? (
                    selectedCandidateReport.blocks.map((block) => (
                      <section
                        key={block.category}
                        className="rounded-[0.8rem] border border-slate-200/85 bg-white/92 px-4 py-4"
                      >
                        <h3 className="text-base font-semibold text-slate-950">
                          {block.title}
                        </h3>
                        <div className="mt-3 space-y-3">
                          {block.requirements.map((requirement) => {
                            const requirementScoreState = mapNumericScoreToState(
                              requirement.numericScore,
                            );

                            return (
                              <div
                                key={requirement.label}
                                className="rounded-[0.72rem] border border-slate-200/80 bg-slate-50/70 px-3 py-3"
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
                                  <p className="text-lg font-semibold tracking-tight text-slate-950">
                                    {requirement.numericScore.toFixed(0)}
                                  </p>
                                </div>
                                <p className="mt-2 text-sm leading-6 text-slate-600">
                                  {humanizeRequirementExplanation(
                                    requirement.explanation,
                                  )}
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      </section>
                    ))
                  ) : (
                    <section className="rounded-[0.8rem] border border-slate-200/85 bg-white/92 px-4 py-4">
                      <p className="text-sm font-semibold text-slate-950">
                        No evaluation available yet
                      </p>
                    </section>
                  )}
                </section>

                <section className="rounded-[0.8rem] border border-slate-200/85 bg-white/92 px-4 py-4">
                  <p className="ops-kicker text-slate-500">Audio</p>
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
                    </div>
                  ) : (
                    <p className="mt-3 text-sm leading-6 text-slate-600">
                      No interview recording is available for this candidate yet.
                    </p>
                  )}
                </section>

                <div className="flex justify-end">
                  <Button
                    size="xs"
                    variant="outline"
                    onClick={() => {
                      setPanelOpen(false);
                      setSelectedCandidateId(null);
                    }}
                  >
                    Close
                  </Button>
                </div>
              </div>
            </aside>
          </>
        ) : null}
      </PlaceholderState>
    </div>
  );
}
