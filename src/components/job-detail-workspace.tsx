"use client";

import Link from "next/link";
import { useState } from "react";

import { JobCandidateRow } from "@/components/job-candidate-row";
import { PlaceholderState } from "@/components/placeholder-state";
import { EmptyState } from "@/components/shared-states";
import { StatusBadge, scoreBadgeIntent } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type {
  CandidateApplication,
  CandidateNote,
  CandidateProfile,
} from "@/domain/candidates/types";
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
  type RecruiterAction,
} from "@/lib/job-pipeline";
import type { RuntimeTraceEvent } from "@/lib/runtime-tracing";

type JobDetailWorkspaceProps = {
  initialSnapshot: {
    title: string;
    publicApplyPath: string | null;
    candidates: PipelineCandidate[];
  };
  candidateNotesByCandidateId: Record<
    string,
    {
      applicationId: string | null;
      jobId: string | null;
      notes: CandidateNote[];
    }
  >;
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
    .replace(
      /^no evidence of\s+/i,
      "The interview did not surface evidence of ",
    )
    .replace(
      /^limited evidence of\s+/i,
      "Only limited evidence came through for ",
    );
}

function formatNoteTimestamp(value: string) {
  return new Date(value).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function JobDetailWorkspace({
  initialSnapshot,
  candidateNotesByCandidateId: initialCandidateNotesByCandidateId,
  runtimeSnapshotsByCandidateId,
}: JobDetailWorkspaceProps) {
  const [candidates, setCandidates] = useState(
    () => initialSnapshot.candidates,
  );
  const [candidateNotesByCandidateId, setCandidateNotesByCandidateId] =
    useState(() => initialCandidateNotesByCandidateId);
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(
    null,
  );
  const [showRejected, setShowRejected] = useState(false);
  const [noteDraft, setNoteDraft] = useState("");
  const [noteError, setNoteError] = useState<string | null>(null);
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);
  const [stageActionError, setStageActionError] = useState<string | null>(null);
  const [isUpdatingStage, setIsUpdatingStage] = useState(false);

  const selectedCandidate =
    candidates.find((candidate) => candidate.id === selectedCandidateId) ??
    null;
  const selectedCandidateRuntime = selectedCandidate
    ? (runtimeSnapshotsByCandidateId[selectedCandidate.id] ?? null)
    : null;
  const selectedCandidateEvaluation =
    selectedCandidateRuntime?.evaluation ?? null;
  const selectedCandidateReport = selectedCandidateEvaluation
    ? buildCandidateReportFromEvaluation(selectedCandidateEvaluation)
    : null;
  const selectedCandidateRecording = selectedCandidateRuntime?.interviewRun
    .artifacts.recordingUrl
    ? {
        recordingUrl:
          selectedCandidateRuntime.interviewRun.artifacts.recordingUrl,
      }
    : null;
  const selectedCandidateNotesEntry = selectedCandidate
    ? (candidateNotesByCandidateId[selectedCandidate.id] ?? {
        applicationId:
          selectedCandidate.applicationId ??
          selectedCandidateRuntime?.application?.id ??
          null,
        jobId:
          selectedCandidate.jobId ??
          selectedCandidateRuntime?.application?.jobId ??
          null,
        notes: [],
      })
    : null;
  const selectedCandidateNotes = selectedCandidateNotesEntry?.notes ?? [];
  const canCreateNote = Boolean(
    selectedCandidate &&
    selectedCandidateNotesEntry?.applicationId &&
    selectedCandidateNotesEntry?.jobId,
  );

  const clearSelectedCandidate = () => {
    setSelectedCandidateId(null);
    setNoteDraft("");
    setNoteError(null);
    setStageActionError(null);
  };

  const selectCandidate = (candidateId: string) => {
    setSelectedCandidateId(candidateId);
    setNoteDraft("");
    setNoteError(null);
    setStageActionError(null);
  };

  const applySuccessfulRecruiterAction = (
    candidateId: string,
    action: RecruiterAction,
  ) => {
    setCandidates((currentCandidates) =>
      applyRecruiterAction(currentCandidates, candidateId, action),
    );

    if (action === "reject") {
      setShowRejected(true);
    }

    if (action === "restore_to_interviewed") {
      setShowRejected(false);
    }
  };

  const handleRecruiterActionForCandidate = async (
    candidate: PipelineCandidate,
    action: RecruiterAction,
  ) => {
    if (!candidate) {
      return;
    }

    if (!candidate.jobId) {
      setStageActionError(null);
      applySuccessfulRecruiterAction(candidate.id, action);
      return;
    }

    setIsUpdatingStage(true);
    setStageActionError(null);

    try {
      const response = await fetch(
        `/api/recruiter/candidates/${candidate.id}/stage`,
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify({
            action,
            jobId: candidate.jobId,
          }),
        },
      );

      const result = (await response.json()) as
        | { success: true }
        | { success: false; error: string };

      if (!response.ok || !result.success) {
        setStageActionError(
          result.success
            ? "Candidate stage could not be updated right now."
            : result.error,
        );
        return;
      }

      applySuccessfulRecruiterAction(candidate.id, action);
    } catch {
      setStageActionError("Candidate stage could not be updated right now.");
    } finally {
      setIsUpdatingStage(false);
    }
  };

  const handleRecruiterAction = async (action: RecruiterAction) => {
    if (!selectedCandidate) {
      return;
    }

    await handleRecruiterActionForCandidate(selectedCandidate, action);
  };

  const submitCandidateNote = async () => {
    if (
      !selectedCandidate ||
      !selectedCandidateNotesEntry?.applicationId ||
      !selectedCandidateNotesEntry.jobId
    ) {
      setNoteError("Notes are only available for persisted live applications.");
      return;
    }

    const trimmedBody = noteDraft.trim();

    if (!trimmedBody) {
      setNoteError("Write a short internal note before saving.");
      return;
    }

    setIsSubmittingNote(true);
    setNoteError(null);

    try {
      const response = await fetch(
        `/api/recruiter/candidates/${selectedCandidate.id}/notes`,
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify({
            applicationId: selectedCandidateNotesEntry.applicationId,
            jobId: selectedCandidateNotesEntry.jobId,
            body: trimmedBody,
          }),
        },
      );

      const result = (await response.json()) as
        | { success: true; data: CandidateNote }
        | { success: false; error: string };

      if (!response.ok || !result.success) {
        setNoteError(
          result.success ? "Note could not be saved right now." : result.error,
        );
        return;
      }

      setCandidateNotesByCandidateId((current) => {
        const existingNotes = current[selectedCandidate.id]?.notes ?? [];

        return {
          ...current,
          [selectedCandidate.id]: {
            applicationId: selectedCandidateNotesEntry.applicationId,
            jobId: selectedCandidateNotesEntry.jobId,
            notes: [...existingNotes, result.data].sort((left, right) =>
              left.createdAt.localeCompare(right.createdAt),
            ),
          },
        };
      });
      setNoteDraft("");
    } catch {
      setNoteError("Note could not be saved right now.");
    } finally {
      setIsSubmittingNote(false);
    }
  };

  const applicantCount = getCandidatesForStage(candidates, "Applicants").length;
  const interviewedCount = getCandidatesForStage(
    candidates,
    "Interviewed",
  ).length;
  const shortlistedCount = getCandidatesForStage(
    candidates,
    "Shortlisted",
  ).length;
  const hiredCount = getCandidatesForStage(candidates, "Hired").length;
  const rejectedCount = getCandidatesForStage(candidates, "Rejected").length;
  const visiblePipelineStages = showRejected
    ? (["Rejected"] as const)
    : activePipelineStages;
  const selectedCandidateScoreState = selectedCandidateReport
    ? mapNumericScoreToState(selectedCandidateReport.finalNumericScore)
    : (selectedCandidate?.scoreState ?? null);
  const selectedCandidateActions = selectedCandidate ? (
    <>
      {selectedCandidate.stage === "Interviewed" ? (
        <>
          <Button
            size="xs"
            variant="default"
            onClick={() => handleRecruiterAction("shortlist")}
            disabled={isUpdatingStage}
          >
            Shortlist
          </Button>
          <Button
            size="xs"
            variant="outline"
            onClick={() => handleRecruiterAction("reject")}
            disabled={isUpdatingStage}
          >
            Reject
          </Button>
        </>
      ) : null}
      {selectedCandidate.stage === "Applicants" ? (
        <Button
          size="xs"
          variant="outline"
          onClick={() => handleRecruiterAction("reject")}
          disabled={isUpdatingStage}
        >
          Reject
        </Button>
      ) : null}
      {selectedCandidate.stage === "Shortlisted" ? (
        <>
          <Button
            size="xs"
            variant="default"
            onClick={() => handleRecruiterAction("hire")}
            disabled={isUpdatingStage}
          >
            Hire
          </Button>
          <Button
            size="xs"
            variant="outline"
            onClick={() => handleRecruiterAction("move_to_interviewed")}
            disabled={isUpdatingStage}
          >
            Back to interviewed
          </Button>
        </>
      ) : null}
      {selectedCandidate.stage === "Hired" ? (
        <Button
          size="xs"
          variant="outline"
          onClick={() => handleRecruiterAction("move_to_shortlisted")}
          disabled={isUpdatingStage}
        >
          Back to shortlisted
        </Button>
      ) : null}
      {selectedCandidate.stage === "Rejected" ? (
        <Button
          size="xs"
          variant="outline"
          onClick={() => handleRecruiterAction("restore_to_interviewed")}
          disabled={isUpdatingStage}
        >
          Restore
        </Button>
      ) : null}
    </>
  ) : null;

  const renderCandidateRowActions = (candidate: PipelineCandidate) => {
    const baseClass =
      "rounded-full border px-3 py-1.5 text-[11px] font-medium tracking-[0.14em] uppercase transition-colors";
    const primaryClass =
      "border-slate-950 bg-slate-950 text-white hover:bg-slate-800";
    const secondaryClass =
      "border-slate-300/90 bg-white/82 text-slate-600 hover:border-slate-400 hover:text-slate-950";

    const buildAction = (
      label: string,
      action: RecruiterAction,
      tone: "primary" | "secondary" = "secondary",
    ) => (
      <button
        key={`${candidate.id}-${action}`}
        type="button"
        aria-label={`${label} ${candidate.fullName}`}
        className={`${baseClass} ${
          tone === "primary" ? primaryClass : secondaryClass
        }`}
        disabled={isUpdatingStage}
        onClick={() => void handleRecruiterActionForCandidate(candidate, action)}
      >
        {label}
      </button>
    );

    switch (candidate.stage) {
      case "Applicants":
        return buildAction("Reject", "reject");
      case "Interviewed":
        return (
          <>
            {buildAction("Shortlist", "shortlist", "primary")}
            {buildAction("Reject", "reject")}
          </>
        );
      case "Shortlisted":
        return (
          <>
            {buildAction("Hire", "hire", "primary")}
            {buildAction("Back to interviewed", "move_to_interviewed")}
          </>
        );
      case "Hired":
        return buildAction("Back to shortlisted", "move_to_shortlisted");
      case "Rejected":
        return buildAction("Restore", "restore_to_interviewed");
    }
  };

  return (
    <div className="flex flex-1 flex-col gap-6 px-6 py-6 md:px-8">
      <PlaceholderState
        title={initialSnapshot.title}
        titleSuffix={<StatusBadge intent="success">Active</StatusBadge>}
      >
        <div className="space-y-5">
          <div className="flex flex-col gap-4 border-b border-slate-200/80 pb-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="grid gap-3 sm:grid-cols-4">
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

            <div className="flex flex-wrap items-center gap-2">
              {initialSnapshot.publicApplyPath ? (
                <Link
                  href={initialSnapshot.publicApplyPath}
                  className="inline-flex items-center rounded-full border border-slate-300/90 bg-white px-3.5 py-2 text-sm font-medium text-slate-950 transition-colors hover:border-slate-400 hover:bg-slate-50"
                >
                  Open public apply
                </Link>
              ) : null}
              <button
                type="button"
                onClick={() => {
                  if (showRejected && selectedCandidate?.stage === "Rejected") {
                    clearSelectedCandidate();
                  }
                  setShowRejected((current) => !current);
                }}
                className={
                  showRejected
                    ? "rounded-full border border-slate-950 bg-slate-950 px-3 py-1.5 text-[11px] font-medium tracking-[0.14em] text-white uppercase"
                    : "rounded-full border border-slate-300/90 bg-white/90 px-3 py-1.5 text-[11px] font-medium tracking-[0.14em] text-slate-500 uppercase"
                }
              >
                {showRejected
                  ? "Back to active pipeline"
                  : `Rejected${rejectedCount > 0 ? ` (${rejectedCount})` : ""}`}
              </button>
            </div>
          </div>

          <div className="grid gap-5 xl:grid-cols-[minmax(0,1.28fr)_minmax(24rem,0.92fr)]">
            <section className="space-y-4">
              <div className="grid gap-4">
                {visiblePipelineStages.map((stage) => {
                  const stageCandidates = getCandidatesForStage(
                    candidates,
                    stage,
                  );

                  return (
                    <section
                      key={stage}
                      className="rounded-[0.85rem] border border-slate-200/85 bg-white/84 p-4"
                    >
                      <div className="flex items-center justify-between gap-3 border-b border-slate-200/80 pb-3">
                        <p className="text-base font-semibold text-slate-950">
                          {stage}
                        </p>
                        <p className="text-base font-semibold tracking-tight text-slate-500">
                          {stageCandidates.length}
                        </p>
                      </div>

                      {stageCandidates.length > 0 ? (
                        <div className="mt-4 grid gap-3">
                          {stageCandidates.map((candidate) => (
                            <JobCandidateRow
                              key={candidate.id}
                              candidate={candidate}
                              density="comfortable"
                              isSelected={candidate.id === selectedCandidateId}
                              onSelect={selectCandidate}
                              showOperationalState={stage === "Applicants"}
                              showScore={
                                stage !== "Applicants" && stage !== "Rejected"
                              }
                              visualVariant="ops"
                              actions={renderCandidateRowActions(candidate)}
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
            </section>

            <section className="min-h-0">
              {selectedCandidate ? (
                <div className="space-y-4 xl:sticky xl:top-6">
                  <section className="rounded-[0.9rem] border border-slate-200/85 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(244,247,250,0.96))] px-4 py-4 shadow-[0_14px_34px_rgba(15,23,42,0.06)]">
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
                              intent={
                                selectedCandidateScoreState === "Pending"
                                  ? "neutral"
                                  : scoreBadgeIntent[
                                      selectedCandidateScoreState
                                    ]
                              }
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
                            ? selectedCandidateReport.finalNumericScore.toFixed(
                                0,
                              )
                            : "--"}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      {selectedCandidateActions}
                    </div>
                    {stageActionError ? (
                      <p className="mt-3 text-sm text-rose-600" role="alert">
                        {stageActionError}
                      </p>
                    ) : null}
                  </section>

                  <section className="rounded-[0.8rem] border border-slate-200/85 bg-white/92 px-4 py-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="ops-kicker text-slate-500">
                          Internal recruiter notes
                        </p>
                        <p className="mt-2 text-sm leading-6 text-slate-600">
                          Private recruiter-only notes. These stay separate from
                          the AI-generated evaluation below.
                        </p>
                      </div>
                      <StatusBadge intent="neutral" density="compact">
                        Internal
                      </StatusBadge>
                    </div>

                    <div className="mt-4 space-y-3">
                      <Textarea
                        value={noteDraft}
                        onChange={(event) => setNoteDraft(event.target.value)}
                        placeholder="Add context for the hiring team."
                        aria-label={`Internal note for ${selectedCandidate.fullName}`}
                        disabled={isSubmittingNote || !canCreateNote}
                      />
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-xs text-slate-500">
                          {canCreateNote
                            ? "Visible to recruiters only."
                            : "Notes become available once this candidate exists in the persisted pipeline."}
                        </p>
                        <Button
                          size="xs"
                          variant="default"
                          onClick={submitCandidateNote}
                          disabled={isSubmittingNote || !canCreateNote}
                        >
                          {isSubmittingNote ? "Saving..." : "Add note"}
                        </Button>
                      </div>
                      {noteError ? (
                        <p className="text-sm text-rose-600">{noteError}</p>
                      ) : null}
                    </div>

                    <div className="mt-5 space-y-3 border-t border-slate-200/80 pt-4">
                      {selectedCandidateNotes.length > 0 ? (
                        selectedCandidateNotes.map((note) => (
                          <article
                            key={note.id}
                            className="rounded-[0.72rem] border border-slate-200/80 bg-slate-50/70 px-3 py-3"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <p className="text-sm font-semibold text-slate-950">
                                {note.authorName?.trim() || "Recruiter"}
                              </p>
                              <p className="text-xs text-slate-500">
                                {formatNoteTimestamp(note.createdAt)}
                              </p>
                            </div>
                            <p className="mt-2 text-sm leading-6 whitespace-pre-wrap text-slate-700">
                              {note.body}
                            </p>
                          </article>
                        ))
                      ) : (
                        <p className="text-sm leading-6 text-slate-600">
                          No internal notes yet.
                        </p>
                      )}
                    </div>
                  </section>

                  <section className="space-y-3">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="ops-kicker text-slate-500">
                          Structured evaluation
                        </p>
                        <p className="mt-2 text-sm leading-6 text-slate-600">
                          AI-generated interview scoring and evidence for
                          recruiter review.
                        </p>
                      </div>
                      <StatusBadge intent="info" density="compact">
                        AI
                      </StatusBadge>
                    </div>
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
                              const requirementScoreState =
                                mapNumericScoreToState(
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
                                        <StatusBadge
                                          intent="neutral"
                                          density="compact"
                                        >
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
                        No interview recording is available for this candidate
                        yet.
                      </p>
                    )}
                  </section>

                  <div className="flex justify-end">
                    <Button
                      size="xs"
                      variant="outline"
                      onClick={clearSelectedCandidate}
                    >
                      Close
                    </Button>
                  </div>
                </div>
              ) : (
                <EmptyState
                  eyebrow="Candidate review"
                  title="Select a candidate to review"
                  description="Open a card from the pipeline to inspect the evaluation, add notes, and make the next recruiter decision."
                />
              )}
            </section>
          </div>
        </div>
      </PlaceholderState>
    </div>
  );
}
