import Link from "next/link";

import { buttonVariants } from "@/components/ui/button-variants";
import { DataPoint } from "@/components/section-card";
import { StatusBadge } from "@/components/status-badge";
import { getCurrentRecruiter } from "@/lib/auth/server";
import { listRecruiterJobs } from "@/lib/job-pipeline-server";
import { cn } from "@/lib/utils";

export default async function JobsPage() {
  const recruiter = await getCurrentRecruiter().catch(() => null);
  const jobs = await listRecruiterJobs(recruiter ?? undefined);
  const activeJobs = jobs.filter((job) => job.status === "Active").length;
  const totalPipelineCandidates = jobs.reduce(
    (sum, job) =>
      sum +
      Object.values(job.pipeline).reduce(
        (pipelineTotal, count) => pipelineTotal + count,
        0,
      ),
    0,
  );

  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-slate-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.95),rgba(246,249,252,0.88))] px-6 py-5 md:px-8">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="space-y-3">
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
              Jobs
            </h1>
            <div className="grid gap-3 sm:grid-cols-3">
              <DataPoint
                label="Open roles"
                value={jobs.length}
                detail="Listed in recruiter workspace"
              />
              <DataPoint
                label="Active"
                value={activeJobs}
                detail="Currently accepting applicants"
              />
              <DataPoint
                label="Pipeline volume"
                value={totalPipelineCandidates}
                detail="Candidates across all stages"
              />
            </div>
          </div>
          <Link
            href="/jobs/new"
            className={cn(
              buttonVariants(),
              "rounded-[0.75rem] bg-slate-950 px-6 text-white shadow-[0_12px_24px_rgba(15,23,42,0.14)] hover:bg-slate-800",
            )}
          >
            New job
          </Link>
        </div>
      </header>

      <div className="grid gap-3 px-6 py-6 md:px-8">
        {jobs.map((job) => (
          <Link
            key={job.id}
            href={`/jobs/${job.id}`}
            className="group block rounded-[1rem] outline-none"
          >
            <article className="rounded-[0.95rem] border border-slate-200/85 bg-white/92 p-4 shadow-[0_10px_24px_rgba(15,23,42,0.04)] transition-colors duration-150 group-hover:border-slate-300/90 group-hover:bg-white group-hover:shadow-[0_16px_32px_rgba(15,23,42,0.07)]">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                <div className="min-w-0 xl:max-w-[26rem]">
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-xl font-semibold tracking-tight text-slate-950">
                      {job.title}
                    </h2>
                    <StatusBadge
                      intent={job.status === "Active" ? "success" : "warning"}
                    >
                      {job.status}
                    </StatusBadge>
                  </div>
                  <p className="mt-2 text-sm text-slate-500">
                    {job.location} / {job.createdAt}
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-5 xl:min-w-[34rem]">
                  {Object.entries(job.pipeline).map(([key, value]) => (
                    <DataPoint key={key} label={key} value={value} />
                  ))}
                </div>
              </div>
            </article>
          </Link>
        ))}
      </div>
    </div>
  );
}
