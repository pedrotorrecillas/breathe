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
    title: "Recruiter workspace",
    description:
      "The dashboard starts with Jobs, then expands into candidate review and pipeline decisions.",
    icon: BriefcaseBusiness,
  },
  {
    title: "Interview runtime",
    description:
      "The model boundary is already separated for HappyRobot dispatch, outcomes, and evaluation artifacts.",
    icon: PhoneCall,
  },
  {
    title: "Compliance-aware flow",
    description:
      "Decision support, consent capture, and public apply states are represented from the first scaffold.",
    icon: ShieldCheck,
  },
];

export default function Home() {
  return (
    <main className="relative flex flex-1 overflow-hidden">
      <div className="absolute inset-0 bg-ops-grid opacity-40" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(21,94,117,0.18),transparent_34%),radial-gradient(circle_at_bottom_right,_rgba(249,115,22,0.14),transparent_28%),linear-gradient(180deg,_rgba(245,247,250,1)_0%,_rgba(238,242,246,1)_100%)]" />
      <div className="relative mx-auto flex w-full max-w-6xl flex-1 flex-col gap-10 px-6 py-10 lg:px-10">
        <section className="grid gap-8 rounded-[1.35rem] border border-slate-200/80 bg-white/88 p-7 shadow-[0_22px_56px_rgba(15,23,42,0.07)] md:grid-cols-[1.15fr_0.85fr] md:p-9">
          <div className="space-y-6">
            <div className="inline-flex items-center rounded-[0.7rem] border border-sky-200 bg-sky-50 px-3 py-1 font-mono text-xs tracking-[0.24em] text-sky-900 uppercase">
              BRE-15 Foundations
            </div>
            <div className="space-y-4">
              <h1 className="font-heading max-w-3xl text-4xl font-semibold tracking-tight text-slate-950 md:text-6xl">
                Clara starts with a clean recruiter shell and a public apply
                entry point.
              </h1>
              <p className="max-w-2xl text-base leading-8 text-slate-600 md:text-lg">
                This scaffold reflects the MVP shape from the discovery notes
                and functional spec: a recruiter dashboard focused on Jobs, a
                public candidate flow, and clear domain seams for interview
                runtime and evaluation work.
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
                Open recruiter area
                <ArrowRight className="size-4" />
              </Link>
              <Link
                href="/apply/demo-warehouse-associate"
                className={cn(
                  buttonVariants({ size: "lg", variant: "outline" }),
                  "rounded-[0.75rem] border-slate-300 bg-white/92 px-6 text-slate-700",
                )}
              >
                Preview candidate apply flow
              </Link>
            </div>
          </div>
          <aside className="grid gap-4 rounded-[1.15rem] bg-slate-950 p-6 text-white shadow-[0_20px_48px_rgba(15,23,42,0.16)]">
            <div>
              <p className="font-mono text-xs tracking-[0.24em] text-sky-200 uppercase">
                Navigation Seed
              </p>
              <ul className="mt-4 divide-y divide-white/10 overflow-hidden rounded-[1rem] border border-white/10">
                {navigationItems.map((item) => (
                  <li
                    key={item.href}
                    className="flex items-center justify-between bg-white/5 px-4 py-3"
                  >
                    <span className="font-medium">{item.label}</span>
                    <span className="font-mono text-xs tracking-[0.2em] text-slate-300 uppercase">
                      {item.enabled ? "ready" : "later"}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-[1rem] border border-amber-400/25 bg-amber-400/10 p-4 text-sm leading-7 text-slate-200">
              Clara remains a decision-support system. Recruiters review
              candidate evidence and make the final hiring decision.
            </div>
          </aside>
        </section>

        <section className="grid gap-4 md:grid-cols-[1.15fr_0.85fr] md:auto-rows-fr">
          {pillars.map(({ title, description, icon: Icon }, index) => (
            <article
              key={title}
              className={cn(
                "rounded-[1.2rem] border p-6 shadow-[0_16px_42px_rgba(15,23,42,0.055)]",
                index === 0
                  ? "md:row-span-2 border-slate-950/90 bg-slate-950 text-white shadow-[0_22px_52px_rgba(15,23,42,0.16)]"
                  : "border-slate-200/80 bg-white/82",
              )}
            >
              <div
                className={cn(
                  "mb-4 inline-flex rounded-[0.8rem] p-3",
                  index === 0 ? "bg-white/10 text-white" : "bg-slate-950 text-white",
                )}
              >
                <Icon className="size-5" />
              </div>
              <h2
                className={cn(
                  "font-heading text-xl font-semibold",
                  index === 0 ? "text-white" : "text-slate-950",
                )}
              >
                {title}
              </h2>
              <p
                className={cn(
                  "mt-3 text-sm leading-7",
                  index === 0 ? "text-slate-300" : "text-slate-600",
                )}
              >
                {description}
              </p>
              {index === 0 ? (
                <div className="mt-5 grid gap-2 border-t border-white/10 pt-4 text-sm text-slate-200">
                  <div className="flex items-center justify-between">
                    <span>Jobs</span>
                    <span className="font-mono text-xs tracking-[0.16em] text-slate-400 uppercase">
                      live
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Candidates</span>
                    <span className="font-mono text-xs tracking-[0.16em] text-slate-400 uppercase">
                      staged
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Call runtime</span>
                    <span className="font-mono text-xs tracking-[0.16em] text-slate-400 uppercase">
                      isolated
                    </span>
                  </div>
                </div>
              ) : null}
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
