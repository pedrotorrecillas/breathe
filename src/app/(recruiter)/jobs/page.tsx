import Link from "next/link";

import { buttonVariants } from "@/components/ui/button-variants";
import { DataPoint } from "@/components/section-card";
import { StatusBadge } from "@/components/status-badge";
import { listRecruiterJobs } from "@/lib/job-pipeline-server";
import { cn } from "@/lib/utils";

export default async function JobsPage() {
  const jobs = await listRecruiterJobs();

  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-slate-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.95),rgba(246,249,252,0.88))] px-6 py-6 md:px-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <h1 className="font-heading text-3xl font-semibold text-slate-950">Jobs</h1>
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

      <div className="grid gap-6 px-6 py-6 md:px-8 xl:grid-cols-2">
        {jobs.map((job) => (
          <Link
            key={job.id}
            href={`/jobs/${job.id}`}
            className="group block rounded-[1rem] outline-none"
          >
            <article className="rounded-[1rem] border border-slate-200/85 bg-white/92 p-4 shadow-[0_12px_32px_rgba(15,23,42,0.04)] transition-transform duration-150 group-hover:-translate-y-0.5 group-hover:border-slate-300/90 group-hover:shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="font-heading text-xl font-semibold text-slate-950">
                    {job.title}
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    {job.location} / {job.createdAt}
                  </p>
                </div>
                <StatusBadge
                  intent={job.status === "Active" ? "success" : "warning"}
                >
                  {job.status}
                </StatusBadge>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-5">
                {Object.entries(job.pipeline).map(([key, value]) => (
                  <DataPoint key={key} label={key} value={value} />
                ))}
              </div>
            </article>
          </Link>
        ))}
      </div>
    </div>
  );
}
