"use client";

import type { CandidateEvaluation } from "@/domain/evaluations/types";
import { buildEvaluationSummary } from "@/lib/evaluation-summary";

type CandidateEvaluationSummaryProps = {
  evaluation: CandidateEvaluation;
};

export function CandidateEvaluationSummary({
  evaluation,
}: CandidateEvaluationSummaryProps) {
  const summary = buildEvaluationSummary(evaluation);

  return (
    <section className="rounded-[0.72rem] border border-slate-200/85 bg-slate-50/85 px-4 py-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="ops-kicker text-slate-500">Recruiter summary</p>
          <p className="mt-2 text-base font-semibold text-slate-950">
            Quick triage read
          </p>
        </div>
        <p className="font-mono text-xs tracking-[0.14em] text-slate-500 uppercase">
          {summary.headline}
        </p>
      </div>
      <p className="mt-3 text-sm leading-6 text-slate-700">{summary.summary}</p>

      {summary.strengths.length > 0 ? (
        <div className="mt-3">
          <p className="ops-kicker text-emerald-700">Strengths</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {summary.strengths.map((strength) => (
              <span
                key={strength}
                className="rounded-full border border-emerald-200/90 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-900"
              >
                {strength}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      {summary.concerns.length > 0 ? (
        <div className="mt-3">
          <p className="ops-kicker text-amber-700">Watchouts</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {summary.concerns.map((concern) => (
              <span
                key={concern}
                className="rounded-full border border-amber-200/90 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-900"
              >
                {concern}
              </span>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
