import { notFound } from "next/navigation";

import { PlaceholderState } from "@/components/placeholder-state";
import { SectionCard } from "@/components/section-card";
import { StatusBadge } from "@/components/status-badge";

type JobDetailPageProps = {
  params: Promise<{
    jobId: string;
  }>;
};

const knownJobIds = new Set([
  "warehouse-associate-madrid",
  "retail-shift-lead-barcelona",
]);

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
          <SectionCard title="Job state" kicker={jobId}>
            <StatusBadge intent="success">Active</StatusBadge>
            <p className="mt-4 text-sm leading-7 text-slate-600">
              Public apply links and job lifecycle behavior will attach here.
            </p>
          </SectionCard>

          <SectionCard title="Candidate pipeline" kicker="Recruiter decisions">
            <ul className="space-y-3 text-sm leading-7 text-slate-600">
              <li>Applicants</li>
              <li>Interviewed</li>
              <li>Shortlisted</li>
              <li>Hired</li>
              <li>Rejected</li>
            </ul>
          </SectionCard>
        </div>
      </PlaceholderState>
    </div>
  );
}
