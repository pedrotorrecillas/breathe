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
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(21,94,117,0.22),transparent_36%),radial-gradient(circle_at_bottom_right,_rgba(249,115,22,0.2),transparent_30%),linear-gradient(180deg,_rgba(245,247,250,1)_0%,_rgba(238,242,246,1)_100%)]" />
      <div className="relative mx-auto flex w-full max-w-6xl flex-1 flex-col gap-12 px-6 py-10 lg:px-10">
        <section className="grid gap-8 rounded-[2rem] border border-white/70 bg-white/80 p-8 shadow-[0_28px_80px_rgba(15,23,42,0.08)] backdrop-blur md:grid-cols-[1.4fr_0.9fr] md:p-10">
          <div className="space-y-6">
            <div className="inline-flex items-center rounded-full border border-sky-200 bg-sky-50 px-4 py-1.5 font-mono text-xs tracking-[0.24em] text-sky-900 uppercase">
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
                  "rounded-full bg-slate-950 px-6 text-white hover:bg-slate-800",
                )}
              >
                Open recruiter area
                <ArrowRight className="size-4" />
              </Link>
              <Link
                href="/apply/demo-warehouse-associate"
                className={cn(
                  buttonVariants({ size: "lg", variant: "outline" }),
                  "rounded-full border-slate-300 bg-white/80 px-6 text-slate-700",
                )}
              >
                Preview candidate apply flow
              </Link>
            </div>
          </div>
          <aside className="grid gap-4 rounded-[1.75rem] bg-slate-950 p-6 text-white">
            <div>
              <p className="font-mono text-xs tracking-[0.24em] text-sky-200 uppercase">
                Navigation Seed
              </p>
              <ul className="mt-4 grid gap-3">
                {navigationItems.map((item) => (
                  <li
                    key={item.href}
                    className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
                  >
                    <span className="font-medium">{item.label}</span>
                    <span className="font-mono text-xs tracking-[0.2em] text-slate-300 uppercase">
                      {item.enabled ? "ready" : "later"}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-amber-400/30 bg-amber-400/10 p-4 text-sm leading-7 text-slate-200">
              Clara remains a decision-support system. Recruiters review
              candidate evidence and make the final hiring decision.
            </div>
          </aside>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {pillars.map(({ title, description, icon: Icon }) => (
            <article
              key={title}
              className="rounded-[1.75rem] border border-slate-200 bg-white/75 p-6 shadow-[0_16px_48px_rgba(15,23,42,0.06)] backdrop-blur"
            >
              <div className="mb-4 inline-flex rounded-2xl bg-slate-950 p-3 text-white">
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
