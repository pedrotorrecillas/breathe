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
        <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
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
              <div className="rounded-[1rem] border border-slate-200/80 bg-slate-950 px-4 py-4 text-white shadow-[0_14px_30px_rgba(15,23,42,0.14)]">
                <p className="ops-kicker text-cyan-200">Selected candidate</p>
                <p className="mt-2 text-lg font-semibold">Lucia Torres</p>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  Warehouse operator with immediate availability and high volume
                  environment experience.
                </p>
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
                  className="rounded-[1rem] border border-slate-200/80 border-l-2 border-l-cyan-300 bg-white/88 p-4 shadow-[0_12px_28px_rgba(15,23,42,0.045)]"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-lg font-semibold text-slate-950">
                        {candidate.name}
                      </p>
                      <p className="mt-1 text-sm leading-6 text-slate-600">
                        {candidate.note}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
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
