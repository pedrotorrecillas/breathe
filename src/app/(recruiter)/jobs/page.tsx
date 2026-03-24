import Link from "next/link";

import { buttonVariants } from "@/components/ui/button-variants";
import { SectionCard } from "@/components/section-card";
import { StatusBadge } from "@/components/status-badge";
import { cn } from "@/lib/utils";

const jobs = [
  {
    id: "warehouse-associate-madrid",
    title: "Warehouse Associate",
    status: "Active",
    createdAt: "March 24, 2026",
    pipeline: {
      applicants: 42,
      interviewed: 28,
      shortlisted: 9,
      hired: 2,
      rejected: 11,
    },
  },
  {
    id: "retail-shift-lead-barcelona",
    title: "Retail Shift Lead",
    status: "Draft",
    createdAt: "March 24, 2026",
    pipeline: {
      applicants: 0,
      interviewed: 0,
      shortlisted: 0,
      hired: 0,
      rejected: 0,
    },
  },
];

export default function JobsPage() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-slate-200 px-6 py-6 md:px-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="font-mono text-xs tracking-[0.24em] text-slate-500 uppercase">
              Recruiter area
            </p>
            <h1 className="font-heading mt-3 text-3xl font-semibold text-slate-950">
              Jobs
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-600">
              Horizontal job cards keep the MVP aligned with the functional spec
              while leaving room for pipeline counts and lifecycle actions.
            </p>
          </div>
          <Link
            href="/jobs/new"
            className={cn(
              buttonVariants(),
              "rounded-full bg-slate-950 px-6 text-white hover:bg-slate-800",
            )}
          >
            New job
          </Link>
        </div>
      </header>

      <div className="grid gap-6 px-6 py-6 md:px-8">
        {jobs.map((job) => (
          <SectionCard key={job.id} title={job.title} kicker={job.createdAt}>
            <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex flex-wrap items-center gap-3">
                <StatusBadge
                  intent={job.status === "Active" ? "success" : "warning"}
                >
                  {job.status}
                </StatusBadge>
                <p className="text-sm text-slate-600">
                  Public apply link, candidate counts, and job state controls
                  live here.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-5">
                {Object.entries(job.pipeline).map(([key, value]) => (
                  <div
                    key={key}
                    className="rounded-2xl bg-slate-50 px-4 py-3 text-center"
                  >
                    <p className="font-mono text-[11px] tracking-[0.22em] text-slate-500 uppercase">
                      {key}
                    </p>
                    <p className="mt-2 text-2xl font-semibold text-slate-950">
                      {value}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6">
              <Link
                href={`/jobs/${job.id}`}
                className={cn(
                  buttonVariants({ variant: "outline" }),
                  "rounded-full",
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
