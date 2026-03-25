"use client";

import { useState } from "react";

import { CandidateStageCard } from "@/components/candidate-stage-card";
import { DataPoint, DetailPanel, SectionCard } from "@/components/section-card";
import { PlaceholderState } from "@/components/placeholder-state";
import { EmptyState } from "@/components/shared-states";
import { StatusBadge } from "@/components/status-badge";
import {
  activePipelineStages,
  getCandidatesForStage,
  getJobPipelineSnapshot,
  jobDetailTabs,
} from "@/lib/job-pipeline";

type JobDetailWorkspaceProps = {
  jobId: string;
};

export function JobDetailWorkspace({ jobId }: JobDetailWorkspaceProps) {
  const snapshot = getJobPipelineSnapshot(jobId);
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(
    snapshot?.candidates[0]?.id ?? null,
  );

  if (!snapshot) {
    return null;
  }

  const selectedCandidate =
    snapshot.candidates.find((candidate) => candidate.id === selectedCandidateId) ??
    null;

  return (
    <div className="flex flex-1 flex-col gap-6 px-6 py-6 md:px-8">
      <PlaceholderState
        eyebrow="Job detail"
        title="Job detail is the main recruiter workspace for pipeline review and manual decisions."
        description="This surface holds job context, pipeline phases, candidate triage, and the future lateral detail inspection flow without breaking recruiter context."
      >
        <div className="grid gap-4 lg:grid-cols-[1.18fr_0.82fr]">
          <SectionCard
            title="Job context"
            kicker={jobId}
            description="The shell anchors lifecycle, intake status, and the operational summary recruiters need before inspecting candidates."
            tone="strong"
            actions={<StatusBadge intent="success">Active</StatusBadge>}
          >
            <div className="grid gap-3 sm:grid-cols-3">
              <DataPoint
                label="Public intake"
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
              Use this header to keep job-level context visible while the main
              workspace below shifts between active pipeline phases and rejected
              review.
            </p>
          </SectionCard>

          <DetailPanel
            title="Candidate detail panel"
            kicker="Lateral panel"
            description="The side surface stays anchored here so candidate inspection can open without navigating away from the job pipeline."
          >
            {selectedCandidate ? (
              <div className="space-y-3">
                <div className="rounded-[0.72rem] border border-cyan-400/30 bg-[linear-gradient(180deg,rgba(16,24,37,0.99),rgba(25,37,55,0.97))] px-4 py-4 text-white">
                  <p className="ops-kicker text-cyan-200">Selected candidate</p>
                  <p className="mt-3 text-lg font-semibold">
                    {selectedCandidate.fullName}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-300">
                    {selectedCandidate.summary}
                  </p>
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
              </div>
            ) : (
              <EmptyState
                eyebrow="No selection"
                title="Select a candidate card to inspect detail."
                description="The lateral surface stays in this route and updates from the active pipeline."
              />
            )}
          </DetailPanel>
        </div>

        <SectionCard
          title="Pipeline workspace"
          kicker="Recruiter decisions"
          description="The main body is structured around active stages plus a dedicated rejected context inside the same job detail route."
          tone="strong"
        >
          <div className="flex flex-wrap gap-2 border-b border-slate-200/80 pb-4">
            {jobDetailTabs.map((stage, index) => (
              <div
                key={stage}
                className={
                  index === 0
                    ? "rounded-[0.55rem] border border-slate-950 bg-slate-950 px-3 py-1.5 text-xs font-medium tracking-[0.14em] text-white uppercase"
                    : "rounded-[0.55rem] border border-slate-300/90 bg-white/85 px-3 py-1.5 text-xs font-medium tracking-[0.14em] text-slate-500 uppercase"
                }
              >
                {stage}
              </div>
            ))}
          </div>

          <div className="mt-5 grid gap-4 xl:grid-cols-4">
            {activePipelineStages.map((stage, index) => {
              const stageCandidates = getCandidatesForStage(snapshot.candidates, stage);

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
                        ? "Candidates explicitly promoted for recruiter follow-up."
                        : "Final recruiter-confirmed outcomes for this job."}
                </p>
                {stageCandidates.length > 0 ? (
                  <div className="mt-4 grid gap-2">
                    {stageCandidates.map((candidate) => (
                      <CandidateStageCard
                        key={candidate.id}
                        candidate={candidate}
                        isSelected={candidate.id === selectedCandidateId}
                        onSelect={setSelectedCandidateId}
                        showOperationalState={stage === "Applicants"}
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

          <div className="mt-5 rounded-[0.85rem] border border-slate-200/85 bg-white/84 p-4">
            <div className="flex items-center justify-between gap-3 border-b border-slate-200/80 pb-3">
              <div>
                <p className="ops-kicker text-slate-500">Rejected</p>
                <p className="mt-2 text-base font-semibold text-slate-950">
                  Separate review context
                </p>
              </div>
              <span className="rounded-[0.5rem] border border-slate-200 bg-slate-100/90 px-2 py-1 ops-kicker text-slate-500">
                Tabbed
              </span>
            </div>
            <p className="mt-4 text-sm leading-7 text-slate-600">
              Rejected candidates stay accessible inside this job detail
              surface, but separated from the active pipeline so triage stays
              focused.
            </p>
          </div>
        </SectionCard>
      </PlaceholderState>
    </div>
  );
}
