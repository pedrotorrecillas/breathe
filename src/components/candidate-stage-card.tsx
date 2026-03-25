"use client";

import { StatusBadge, runtimeBadgeIntent, scoreBadgeIntent } from "@/components/status-badge";
import type { PipelineCandidate } from "@/lib/job-pipeline";
import { cn } from "@/lib/utils";

type CandidateStageCardProps = {
  candidate: PipelineCandidate;
  isSelected?: boolean;
  onSelect?: (candidateId: string) => void;
  extraBadges?: React.ReactNode;
  footerActions?: React.ReactNode;
};

export function CandidateStageCard({
  candidate,
  isSelected = false,
  onSelect,
  extraBadges,
  footerActions,
}: CandidateStageCardProps) {
  return (
    <article
      className={cn(
        "rounded-[0.8rem] border border-slate-200/90 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(245,248,251,0.94))] shadow-[0_10px_24px_rgba(15,23,42,0.045)]",
        isSelected &&
          "border-cyan-300/90 bg-[linear-gradient(180deg,rgba(240,253,255,0.98),rgba(236,250,255,0.94))] shadow-[0_0_0_1px_rgba(34,211,238,0.16)]",
      )}
    >
      <button
        type="button"
        aria-label={`Open candidate ${candidate.fullName}`}
        className="flex w-full flex-col gap-3 px-3 py-3 text-left"
        onClick={() => onSelect?.(candidate.id)}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-950">
              {candidate.fullName}
            </p>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              {candidate.relevantDateLabel} · {candidate.relevantDateValue}
            </p>
          </div>
          {candidate.scoreState ? (
            <StatusBadge
              intent={scoreBadgeIntent[candidate.scoreState]}
              density="compact"
            >
              {candidate.scoreState}
            </StatusBadge>
          ) : null}
        </div>

        <p className="text-sm leading-6 text-slate-600">{candidate.summary}</p>

        <div className="flex flex-wrap gap-2">
          {candidate.operationalState ? (
            <StatusBadge
              intent={runtimeBadgeIntent[candidate.operationalState]}
              density="compact"
            >
              {candidate.operationalState.replaceAll("_", " ")}
            </StatusBadge>
          ) : null}
          {extraBadges}
        </div>
      </button>

      {footerActions ? (
        <div className="flex flex-wrap gap-2 border-t border-slate-200/80 px-3 py-2.5">
          {footerActions}
        </div>
      ) : null}
    </article>
  );
}
