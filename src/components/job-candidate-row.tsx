"use client";

import type { ReactNode } from "react";

import {
  StatusBadge,
  runtimeBadgeIntent,
  scoreBadgeIntent,
} from "@/components/status-badge";
import {
  getOperationalStateLabel,
  type PipelineCandidate,
} from "@/lib/job-pipeline";
import { cn } from "@/lib/utils";

type JobCandidateRowProps = {
  candidate: PipelineCandidate;
  isSelected?: boolean;
  showOperationalState?: boolean;
  showStage?: boolean;
  showScore?: boolean;
  density?: "comfortable" | "compact";
  visualVariant?: "ops" | "rail" | "split";
  timeline?: ReactNode;
  actions?: ReactNode;
  onSelect?: (candidateId: string) => void;
};

export function JobCandidateRow({
  candidate,
  isSelected = false,
  showOperationalState = false,
  showStage = false,
  showScore = true,
  density = "comfortable",
  visualVariant = "ops",
  timeline,
  actions,
  onSelect,
}: JobCandidateRowProps) {
  const isCompact = density === "compact";
  const isRail = visualVariant === "rail";
  const isSplit = visualVariant === "split";

  return (
    <article
      className={cn(
        "rounded-[0.95rem] border transition-all",
        isRail
          ? "relative overflow-hidden bg-[linear-gradient(180deg,rgba(251,247,239,0.98),rgba(243,238,229,0.94))] shadow-[0_14px_32px_rgba(15,23,42,0.055)]"
          : isSplit
            ? "overflow-hidden bg-[linear-gradient(180deg,rgba(255,255,255,0.99),rgba(245,248,251,0.95))] shadow-[0_12px_28px_rgba(15,23,42,0.05)]"
            : "border-slate-200/80 bg-white/72 shadow-[inset_0_1px_0_rgba(255,255,255,0.68)]",
        isSelected &&
          (isRail || isSplit
            ? "border-cyan-300/90 shadow-[0_0_0_1px_rgba(34,211,238,0.16)]"
            : "border-cyan-300/90 bg-[linear-gradient(180deg,rgba(240,253,255,0.98),rgba(236,250,255,0.92))] shadow-[0_0_0_1px_rgba(34,211,238,0.12)]"),
      )}
    >
      {isRail ? (
        <div className="absolute inset-y-0 left-0 w-1.5 bg-[linear-gradient(180deg,rgba(94,126,255,0.9),rgba(170,184,232,0.46))]" />
      ) : null}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-stretch">
        <button
          type="button"
          aria-label={`Open candidate ${candidate.fullName}`}
          className={cn(
            "flex min-w-0 flex-1 flex-col gap-4 text-left transition-colors",
            isCompact ? "px-4 py-3" : "px-4 py-4",
            isRail && "pl-6",
            isSplit && "lg:px-5",
            !isRail && !isSplit && "hover:bg-white/44",
          )}
          onClick={() => onSelect?.(candidate.id)}
        >
          {timeline ? (
            <div
              className={cn(
                "flex flex-wrap items-center gap-2 text-xs text-slate-500",
                isRail && "border-b border-slate-200/70 pb-3",
              )}
            >
              {timeline}
            </div>
          ) : null}

          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="truncate text-base font-semibold tracking-tight text-slate-950">
                  {candidate.fullName}
                </h3>
                {showScore && candidate.scoreState ? (
                  <StatusBadge
                    intent={scoreBadgeIntent[candidate.scoreState]}
                    density="compact"
                  >
                    {candidate.scoreState}
                  </StatusBadge>
                ) : null}
                {showStage ? (
                  <StatusBadge intent="info" density="compact">
                    {candidate.stage}
                  </StatusBadge>
                ) : null}
                {showOperationalState && candidate.operationalState ? (
                  <StatusBadge
                    intent={runtimeBadgeIntent[candidate.operationalState]}
                    density="compact"
                  >
                    {getOperationalStateLabel(candidate.operationalState)}
                  </StatusBadge>
                ) : null}
                {candidate.stage === "Rejected" && candidate.rejectedReason ? (
                  <StatusBadge intent="warning" density="compact">
                    {candidate.rejectedReason}
                  </StatusBadge>
                ) : null}
              </div>

              <p
                className={cn(
                  "text-slate-600",
                  isCompact
                    ? "mt-2 text-sm leading-5"
                    : "mt-2 text-sm leading-6",
                )}
              >
                {candidate.summary}
              </p>
            </div>

            <div
              className={cn(
                "text-left lg:min-w-[9rem] lg:text-right",
                isSplit && "lg:min-w-[8rem]",
              )}
            >
              <p className="ops-kicker text-slate-500">
                {candidate.relevantDateLabel}
              </p>
              <p className="mt-1 text-sm font-medium text-slate-950">
                {candidate.relevantDateValue}
              </p>
            </div>
          </div>
        </button>

        {actions ? (
          <div
            className={cn(
              "flex shrink-0 flex-wrap items-center gap-2 border-slate-200/80",
              isCompact
                ? "px-4 pb-3 lg:min-w-[12rem] lg:flex-col lg:items-stretch lg:justify-center lg:border-l lg:px-3 lg:py-3"
                : "px-4 pb-4 lg:min-w-[13rem] lg:flex-col lg:items-stretch lg:justify-center lg:border-l lg:px-4 lg:py-4",
              !isRail &&
                !isSplit &&
                "bg-[linear-gradient(180deg,rgba(250,244,235,0.28),rgba(255,255,255,0.2))]",
              isRail &&
                "bg-[linear-gradient(180deg,rgba(255,255,255,0.4),rgba(255,255,255,0.2))]",
              isSplit &&
                "bg-[linear-gradient(180deg,rgba(242,237,227,0.88),rgba(230,222,208,0.66))] lg:min-w-[14rem]",
            )}
          >
            {actions}
          </div>
        ) : null}
      </div>
    </article>
  );
}
