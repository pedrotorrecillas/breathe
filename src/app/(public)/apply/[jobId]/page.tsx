import { PublicApplyForm } from "@/components/public-apply-form";
import { SectionCard } from "@/components/section-card";
import { ErrorState } from "@/components/shared-states";
import { StatusBadge } from "@/components/status-badge";
import { findPublicJobBySlug, isPublicJobAvailable } from "@/lib/public-jobs";

type ApplyPageProps = {
  params: Promise<{
    jobId: string;
  }>;
};

export default async function ApplyPage({ params }: ApplyPageProps) {
  const { jobId } = await params;
  const publicJob = findPublicJobBySlug(jobId);

  if (!publicJob) {
    return (
      <div className="bg-ops-grid bg-ops-canvas flex flex-1">
        <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col px-6 py-10">
          <ErrorState
            eyebrow="Public apply"
            title="This job link is no longer available."
            description="The public job identifier is missing, invalid, or no longer exposed for candidate intake."
          />
        </div>
      </div>
    );
  }

  const availability = isPublicJobAvailable(publicJob);

  if (!availability.isAvailable) {
    return (
      <div className="bg-ops-grid bg-ops-canvas flex flex-1">
        <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col px-6 py-10">
          <ErrorState
            eyebrow="Public apply"
            title={
              availability.reason === "inactive"
                ? "This job is no longer accepting applications."
                : "This job has reached its interview limit."
            }
            description={
              availability.reason === "inactive"
                ? "The role remains visible for reference, but candidate intake is currently closed."
                : "The job is active, but the configured interview capacity has already been reached."
            }
          />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-ops-grid bg-ops-canvas flex flex-1">
      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-6 py-10">
        <div className="ops-shell ops-beacon rounded-[2rem] p-6 md:p-8">
          <div className="flex flex-col gap-4 border-b border-slate-200/80 pb-6">
            <p className="ops-kicker text-cyan-900">Public apply route</p>
            <h1 className="font-heading max-w-3xl text-3xl font-semibold text-slate-950">
              Apply to {publicJob.title} before entering Clara&apos;s interview
              queue.
            </h1>
            <p className="max-w-3xl text-sm leading-7 text-slate-600">
              {publicJob.description}
            </p>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
            <SectionCard
              title="Public form surface"
              kicker={publicJob.publicApplyPath?.replace("/apply/", "") ?? jobId}
              description="Candidate capture stays lightweight and operational so the interview can start immediately after a valid submit."
              tone="strong"
            >
              <PublicApplyForm
                jobId={publicJob.id}
                interviewLanguage={publicJob.interviewLanguage}
              />
            </SectionCard>

            <SectionCard
              title="Job context"
              kicker={publicJob.location ?? "Location pending"}
              description={publicJob.summary}
            >
              <div className="flex flex-wrap gap-2">
                <StatusBadge intent="success">Active job</StatusBadge>
                <StatusBadge intent="info">
                  Interview language {publicJob.interviewLanguage.toUpperCase()}
                </StatusBadge>
              </div>
              <dl className="mt-5 grid gap-4 border-t border-slate-200/80 pt-5 text-sm">
                <div className="grid gap-1">
                  <dt className="ops-kicker text-slate-500">Schedule</dt>
                  <dd className="text-slate-900">
                    {publicJob.schedule ?? "Shared after application review"}
                  </dd>
                </div>
                <div className="grid gap-1">
                  <dt className="ops-kicker text-slate-500">Compensation</dt>
                  <dd className="text-slate-900">
                    {publicJob.salary ?? "Shared during recruiter follow-up"}
                  </dd>
                </div>
                <div className="grid gap-1">
                  <dt className="ops-kicker text-slate-500">Interview flow</dt>
                  <dd className="text-slate-600">
                    After a valid submit, Clara confirms the intake and queues
                    the first interview run.
                  </dd>
                </div>
              </dl>
            </SectionCard>
          </div>
        </div>
      </div>
    </div>
  );
}
