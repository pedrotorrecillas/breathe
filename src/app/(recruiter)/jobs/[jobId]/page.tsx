import { notFound } from "next/navigation";

import { PlaceholderState } from "@/components/placeholder-state";
import { DataPoint, DetailPanel, SectionCard } from "@/components/section-card";
import { EmptyState } from "@/components/shared-states";
import { scoreBadgeIntent, StatusBadge } from "@/components/status-badge";

type JobDetailPageProps = {
  params: Promise<{
    jobId: string;
  }>;
};

const knownJobIds = new Set([
  "warehouse-associate-madrid",
  "retail-shift-lead-barcelona",
]);

const candidatePreview = [
  {
    name: "Lucia Torres",
    score: "Outstanding",
    note: "Warehouse picking, forklift certified, available for nights.",
    runtime: "completed",
  },
  {
    name: "Daniel Ruiz",
    score: "Average",
    note: "Retail inventory background, logistics crossover unclear.",
    runtime: "human_requested",
  },
] as const;

const scoreScale = [
  "Outstanding",
  "Great",
  "Good",
  "Average",
  "Low",
  "Poor",
] as const;

export default async function JobDetailPage({ params }: JobDetailPageProps) {
  const { jobId } = await params;

  if (!knownJobIds.has(jobId)) {
    notFound();
  }

  return (
    <div className="flex flex-1 flex-col gap-6 px-6 py-6 md:px-8">
      <PlaceholderState
        eyebrow="BRE-6 Preview"
        title="Job detail is the bridge between configuration, pipeline counts, and recruiter decisions."
        description="The route is in place for candidate pipeline, detail navigation, and manual actions. Future issues can extend this without moving URLs or refactoring the recruiter shell."
      >
        <div className="grid gap-4 lg:grid-cols-[1.18fr_0.82fr]">
          <SectionCard
            title="Job state"
            kicker={jobId}
            description="The main panel combines lifecycle status, throughput, and recruiter-facing controls."
            tone="strong"
            actions={<StatusBadge intent="success">Active</StatusBadge>}
          >
            <div className="grid gap-3 sm:grid-cols-3">
              <DataPoint
                label="Applicants"
                value={42}
                detail="Volume received"
              />
              <DataPoint
                label="Interviewed"
                value={28}
                detail="Voice completed"
              />
              <DataPoint
                label="Shortlisted"
                value={9}
                detail="Recruiter-ready"
              />
            </div>
            <p className="mt-4 text-sm leading-7 text-slate-600">
              Public apply links, runtime toggles, and job lifecycle behavior
              attach here without breaking the main operator flow.
            </p>
          </SectionCard>

          <DetailPanel
            title="Candidate detail panel"
            kicker="Lateral panel"
            description="This side surface holds evidence and decision context for the selected candidate."
          >
            <div className="space-y-4">
              <div className="rounded-[0.75rem] border border-cyan-400/30 bg-[linear-gradient(180deg,rgba(16,24,37,0.99),rgba(25,37,55,0.97))] px-4 py-4 text-white shadow-[0_14px_30px_rgba(15,23,42,0.16)]">
                <div className="flex items-center justify-between gap-3">
                  <p className="ops-kicker text-cyan-200">Selected candidate</p>
                  <span className="ops-kicker text-cyan-300">Inspection focus</span>
                </div>
                <p className="mt-3 text-lg font-semibold">Lucia Torres</p>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  Warehouse operator with immediate availability and high volume
                  environment experience.
                </p>
                <div className="mt-4 grid gap-2 border-t border-white/10 pt-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">Latest signal</span>
                    <span className="font-medium text-white">
                      Night-ready, forklift certified
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">Review posture</span>
                    <span className="font-medium text-cyan-200">
                      Priority shortlist
                    </span>
                  </div>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                <DataPoint
                  label="Score"
                  value="Outstanding"
                  detail="High priority review"
                />
                <DataPoint
                  label="Human request"
                  value="No"
                  detail="Escalation clear"
                />
              </div>
            </div>
          </DetailPanel>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <SectionCard
            title="Candidate pipeline"
            kicker="Recruiter decisions"
            description="Candidate cards are designed for dense scanning: state first, evidence second."
          >
            <div className="grid gap-3">
              {candidatePreview.map((candidate) => (
                <article
                  key={candidate.name}
                  className="rounded-[0.75rem] border border-slate-200/85 border-l-[3px] border-l-cyan-400 bg-white/90 p-4 shadow-[0_10px_22px_rgba(15,23,42,0.04)]"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-1 rounded-full bg-cyan-400" />
                        <p className="text-lg font-semibold text-slate-950">
                          {candidate.name}
                        </p>
                      </div>
                      <p className="mt-2 text-xs uppercase tracking-[0.16em] text-slate-400">
                        Candidate note
                      </p>
                      <p className="mt-1 text-sm leading-6 text-slate-600">
                        {candidate.note}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-wrap gap-2 sm:max-w-[15rem] sm:justify-end">
                      <StatusBadge
                        intent={scoreBadgeIntent[candidate.score]}
                        density="compact"
                      >
                        {candidate.score}
                      </StatusBadge>
                      <StatusBadge
                        intent={
                          candidate.runtime === "completed" ? "info" : "special"
                        }
                        density="compact"
                      >
                        {candidate.runtime === "completed"
                          ? "Interview complete"
                          : "Human requested"}
                      </StatusBadge>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </SectionCard>

          <SectionCard
            title="Score and state legend"
            kicker="Recruiter scan system"
            description="Score badges stay categorical and compact. Operational badges carry exceptions without overloading dense views."
            tone="subtle"
          >
            <div className="grid gap-4">
              <div>
                <p className="ops-kicker text-slate-500">Score states</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {scoreScale.map((score) => (
                    <StatusBadge key={score} intent={scoreBadgeIntent[score]}>
                      {score}
                    </StatusBadge>
                  ))}
                </div>
              </div>
              <div>
                <p className="ops-kicker text-slate-500">Operational states</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <StatusBadge intent="neutral">Applicants</StatusBadge>
                  <StatusBadge intent="info">Interviewed</StatusBadge>
                  <StatusBadge intent="success">Shortlisted</StatusBadge>
                  <StatusBadge intent="warning">Draft</StatusBadge>
                  <StatusBadge intent="danger">Rejected</StatusBadge>
                  <StatusBadge intent="special">Human requested</StatusBadge>
                </div>
              </div>
            </div>
            <EmptyState
              eyebrow="Shared empty"
              title="No candidates have reached this pipeline view yet."
              description="Use this state wherever a recruiter-facing list, report, or candidate slice exists but has no data to show yet."
            />
          </SectionCard>
        </div>
      </PlaceholderState>
    </div>
  );
}
