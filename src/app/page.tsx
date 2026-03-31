import Link from "next/link";

import {
  ArrowRight,
  BriefcaseBusiness,
  PhoneCall,
  ShieldCheck,
} from "lucide-react";

import { buttonVariants } from "@/components/ui/button-variants";
import { navigationItems } from "@/lib/navigation";
import { cn } from "@/lib/utils";

const pillars = [
  {
    title: "Jobs workspace",
    description:
      "Create jobs, review candidate volume, and move people through the pipeline from one view.",
    icon: BriefcaseBusiness,
  },
  {
    title: "Interview runtime",
    description:
      "HappyRobot dispatch, runtime outcomes, and interview artifacts stay attached to each call.",
    icon: PhoneCall,
  },
  {
    title: "Evaluation review",
    description:
      "Requirement evidence, block scores, and summaries stay visible for recruiter decisions.",
    icon: ShieldCheck,
  },
];

export default function Home() {
  return (
    <main className="relative flex flex-1 overflow-hidden bg-ops-canvas">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(21,94,117,0.12),transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(249,115,22,0.08),transparent_24%)]" />
      <div className="relative mx-auto flex w-full max-w-6xl flex-1 flex-col gap-10 px-6 py-10 lg:px-10">
        <section className="grid gap-8 rounded-[1.35rem] border border-slate-200/80 bg-white/94 p-7 shadow-[0_18px_48px_rgba(15,23,42,0.06)] md:grid-cols-[1.15fr_0.85fr] md:p-9">
          <div className="space-y-6">
            <div className="inline-flex items-center rounded-[0.7rem] border border-sky-200 bg-sky-50 px-3 py-1 font-mono text-xs tracking-[0.24em] text-sky-900 uppercase">
              Clara MVP
            </div>
            <div className="space-y-4">
              <h1 className="font-heading max-w-3xl text-4xl font-semibold tracking-tight text-slate-950 md:text-6xl">
                Clara helps recruiters publish jobs, run interviews, and review
                candidate evidence in one workspace.
              </h1>
              <p className="max-w-2xl text-base leading-8 text-slate-600 md:text-lg">
                The app is centered on Jobs, the public apply flow, HappyRobot
                interview runtime, and recruiter review. The surfaces are kept
                simple so the product reads clearly in manual testing.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/jobs"
                className={cn(
                  buttonVariants({ size: "lg" }),
                  "rounded-[0.75rem] bg-slate-950 px-6 text-white hover:bg-slate-800",
                )}
              >
                Open recruiter workspace
                <ArrowRight className="size-4" />
              </Link>
              <Link
                href="/apply/demo-warehouse-associate"
                className={cn(
                  buttonVariants({ size: "lg", variant: "outline" }),
                  "rounded-[0.75rem] border-slate-300 bg-white px-6 text-slate-700",
                )}
              >
                Open candidate application
              </Link>
            </div>
          </div>
          <aside className="rounded-[1.15rem] border border-slate-200/80 bg-slate-950 p-6 text-white shadow-[0_18px_40px_rgba(15,23,42,0.16)]">
            <div>
              <p className="font-mono text-xs tracking-[0.24em] text-cyan-200 uppercase">
                Available areas
              </p>
              <ul className="mt-4 divide-y divide-white/10 overflow-hidden rounded-[1rem] border border-white/10">
                {navigationItems.map((item) => (
                  <li
                    key={item.href}
                    className="flex items-center justify-between bg-white/5 px-4 py-3"
                  >
                    <span className="font-medium">{item.label}</span>
                    <span className="font-mono text-xs tracking-[0.2em] text-slate-300 uppercase">
                      {item.enabled ? "Live" : "Later"}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="mt-4 rounded-[1rem] border border-white/10 bg-white/5 p-4 text-sm leading-7 text-slate-200">
              Recruiters make the final decision. Clara structures the workflow
              and the evidence, not the outcome.
            </div>
          </aside>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {pillars.map(({ title, description, icon: Icon }) => (
            <article
              key={title}
              className="rounded-[1.2rem] border border-slate-200/80 bg-white/92 p-6 shadow-[0_12px_34px_rgba(15,23,42,0.05)]"
            >
              <div className="mb-4 inline-flex rounded-[0.8rem] bg-slate-950 p-3 text-white">
                <Icon className="size-5" />
              </div>
              <h2 className="font-heading text-xl font-semibold text-slate-950">
                {title}
              </h2>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                {description}
              </p>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
