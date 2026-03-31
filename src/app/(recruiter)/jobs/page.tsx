import Link from "next/link";

import { buttonVariants } from "@/components/ui/button-variants";
import { DataPoint, SectionCard } from "@/components/section-card";
import { StatusBadge } from "@/components/status-badge";
import { listRecruiterJobs } from "@/lib/job-pipeline";
import { cn } from "@/lib/utils";

export default async function JobsPage() {
  const jobs = await listRecruiterJobs();

  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-slate-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.95),rgba(246,249,252,0.88))] px-6 py-6 md:px-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="ops-kicker text-slate-500">Recruiter area</p>
            <h1 className="font-heading mt-3 text-3xl font-semibold text-slate-950">
              Jobs
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-600">
              Review open roles, candidate volume, and the next action from one
              list.
            </p>
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

      <div className="grid gap-6 px-6 py-6 md:px-8 xl:grid-cols-2">
        {jobs.map((job) => (
          <SectionCard
            key={job.id}
            title={job.title}
            kicker={`${job.location} / ${job.createdAt}`}
            description="Open the role, inspect pipeline counts, and continue the review from there."
            tone={job.status === "Active" ? "strong" : "default"}
            actions={
              <StatusBadge
                intent={job.status === "Active" ? "success" : "warning"}
              >
                {job.status}
              </StatusBadge>
            }
          >
            <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
              <div className="grid gap-3 sm:grid-cols-2 xl:min-w-[22rem]">
                <div className="rounded-[1rem] border border-slate-200/80 bg-slate-950 px-4 py-4 text-white shadow-[0_14px_30px_rgba(15,23,42,0.14)]">
                  <p className="ops-kicker text-cyan-200">Public apply</p>
                  <p className="mt-2 text-lg font-semibold">Candidate intake live</p>
                  <p className="mt-2 text-sm leading-6 text-slate-300">
                    New candidates arrive here before the call and recruiter
                    review.
                  </p>
                </div>
                <div className="rounded-[1rem] border border-slate-200/80 bg-white/86 px-4 py-4">
                  <p className="ops-kicker text-slate-500">Recruiter review</p>
                  <p className="mt-2 text-lg font-semibold text-slate-950">Move candidates forward</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Keep shortlist, reject, and hire actions next to the counts.
                  </p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-5">
                {Object.entries(job.pipeline).map(([key, value]) => (
                  <DataPoint
                    key={key}
                    label={key}
                    value={value}
                    detail={
                      key === "applicants"
                        ? "Applied"
                        : key === "interviewed"
                          ? "Interviewed"
                          : key === "shortlisted"
                            ? "Shortlisted"
                            : key === "hired"
                              ? "Hired"
                              : "Filtered out"
                    }
                  />
                ))}
              </div>
            </div>

            <div className="mt-6">
              <Link
                href={`/jobs/${job.id}`}
                className={cn(
                  buttonVariants({ variant: "outline" }),
                  "rounded-[0.75rem]",
                )}
              >
                Open job detail
              </Link>
            </div>
          </SectionCard>
        ))}
      </div>
    </div>
  );
}
