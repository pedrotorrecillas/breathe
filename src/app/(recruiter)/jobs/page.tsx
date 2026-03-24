import Link from "next/link";

import { buttonVariants } from "@/components/ui/button-variants";
import { DataPoint, SectionCard } from "@/components/section-card";
import { StatusBadge } from "@/components/status-badge";
import { cn } from "@/lib/utils";

const jobs = [
  {
    id: "warehouse-associate-madrid",
    title: "Warehouse Associate",
    status: "Active",
    location: "Madrid",
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
    location: "Barcelona",
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
      <header className="border-b border-slate-200/80 px-6 py-6 md:px-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="ops-kicker text-slate-500">Recruiter area</p>
            <h1 className="font-heading mt-3 text-3xl font-semibold text-slate-950">
              Jobs
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-600">
              Operational cards prioritize state, flow, and throughput instead
              of dashboard chrome. Each job surface is designed to hold routing,
              signal, and lifecycle control in one frame.
            </p>
          </div>
          <Link
            href="/jobs/new"
            className={cn(
              buttonVariants(),
              "rounded-full bg-slate-950 px-6 text-white shadow-[0_18px_30px_rgba(15,23,42,0.16)] hover:bg-slate-800",
            )}
          >
            New job
          </Link>
        </div>
      </header>

      <div className="grid gap-6 px-6 py-6 md:px-8">
        {jobs.map((job) => (
          <SectionCard
            key={job.id}
            title={job.title}
            kicker={`${job.location} / ${job.createdAt}`}
            description="Route volume into a controlled pipeline with recruiter-readable state and signal."
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
                <div className="rounded-[1.25rem] border border-slate-200/80 bg-slate-950 px-4 py-4 text-white shadow-[0_20px_40px_rgba(15,23,42,0.16)]">
                  <p className="ops-kicker text-cyan-200">Public intake</p>
                  <p className="mt-2 text-lg font-semibold">Apply route live</p>
                  <p className="mt-2 text-sm leading-6 text-slate-300">
                    Candidate volume lands here before voice dispatch and
                    review.
                  </p>
                </div>
                <div className="rounded-[1.25rem] border border-slate-200/80 bg-white/78 px-4 py-4">
                  <p className="ops-kicker text-slate-500">Recruiter action</p>
                  <p className="mt-2 text-lg font-semibold text-slate-950">
                    Review queue and lifecycle
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Counts, state, and next actions stay in the same card.
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
                        ? "Intake volume"
                        : key === "interviewed"
                          ? "Voice completed"
                          : key === "shortlisted"
                            ? "Human-ready"
                            : key === "hired"
                              ? "Closed won"
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
