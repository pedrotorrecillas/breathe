import Image from "next/image";
import Link from "next/link";

import { ArrowRight, ArrowUpRight } from "lucide-react";

import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";

const customerLogos = [
  "Job&Talent",
  "Santa Lucía",
  "Merlin",
  "Glovo",
  "South",
  "Iberia",
  "Papa John's",
] as const;

const valueProps = [
  {
    title: "Reduce screening load",
    body: "Remove repetitive first-round qualification work so recruiters spend less time on calls and more time on decisions.",
  },
  {
    title: "Keep evaluation consistent",
    body: "Assess every candidate against the same role conditions, requirements, and interview logic across teams and markets.",
  },
  {
    title: "Execute the next step",
    body: "Go beyond a scorecard. Trigger human interview, training, contract, or onboarding directly from the hiring flow.",
  },
  {
    title: "Work with your ATS",
    body: "Add execution to the stack you already run, without asking teams to replace their ATS.",
  },
] as const;

const workflowSteps = [
  {
    step: "01",
    title: "Define the ideal candidate",
    body: "Turn the role into conditions, hard skills, soft skills, and interview logic.",
  },
  {
    step: "02",
    title: "Screen and qualify beyond the CV",
    body: "Qualify earlier, before recruiters lose time in manual screening and fragmented handoffs.",
  },
  {
    step: "03",
    title: "Run voice interviews at scale",
    body: "Breathe calls candidates automatically and runs structured phone interviews under load.",
  },
  {
    step: "04",
    title: "Generate structured evaluation",
    body: "Every interview returns scored requirements, evidence, and recruiter-ready output.",
  },
  {
    step: "05",
    title: "Execute the next step",
    body: "Move straight into human interview, training, contract, or onboarding.",
  },
] as const;

const proofStats = [
  { label: "Interviews run", value: "2M+" },
  { label: "Time to shortlist", value: "65 min" },
  { label: "Core layer", value: "Voice interviews" },
  { label: "Output", value: "Structured evaluation" },
] as const;

export default function Home() {
  return (
    <main className="relative flex flex-1 overflow-hidden bg-[#ece9e2] text-slate-950">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(122,240,210,0.1),transparent_24%),radial-gradient(circle_at_bottom_right,_rgba(123,157,255,0.08),transparent_26%)]" />
      <div className="absolute inset-x-0 top-0 h-[32rem] bg-[linear-gradient(180deg,rgba(255,255,255,0.62),transparent)]" />

      <div className="relative mx-auto flex w-full max-w-[96rem] flex-1 flex-col gap-6 px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
        <section className="overflow-hidden rounded-[2rem] border border-black/8 bg-[#111111] text-white shadow-[0_30px_100px_rgba(15,23,42,0.18)]">
          <div className="grid lg:grid-cols-[1.06fr_0.94fr]">
            <div className="relative overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(122,240,210,0.18),transparent_30%),linear-gradient(180deg,rgba(255,255,255,0.03),transparent_32%)]" />
              <div className="relative flex h-full flex-col justify-between gap-12 px-6 py-6 sm:px-8 sm:py-8 lg:px-10 lg:py-10">
                <div className="space-y-8">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="rounded-full border border-white/12 bg-white/6 px-3 py-1 font-mono text-[11px] tracking-[0.22em] text-white/72 uppercase">
                      AI hiring infrastructure
                    </span>
                    <span className="rounded-full border border-white/12 bg-white/6 px-3 py-1 font-mono text-[11px] tracking-[0.22em] text-white/50 uppercase">
                      ATS-compatible
                    </span>
                  </div>

                  <div className="space-y-5">
                    <h1 className="max-w-4xl text-[3.3rem] leading-[0.9] font-semibold tracking-[-0.065em] text-white sm:text-[4.25rem] lg:text-[5.8rem]">
                      Infrastructure{" "}
                      <br />
                      for hiring{" "}
                      <br />
                      at scale.
                    </h1>
                    <p className="max-w-2xl text-base leading-8 text-white/68 sm:text-lg">
                      Breathe defines the ideal candidate, screens and
                      interviews by voice, generates structured evaluation, and
                      executes the next step in the hiring flow. It works with
                      your ATS, not against it.
                    </p>
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row">
                    <Link
                      href="/jobs"
                      className={cn(
                        buttonVariants({ size: "lg" }),
                        "h-11 rounded-[0.9rem] bg-[#d9ff57] px-6 text-slate-950 hover:bg-[#cbf24b]",
                      )}
                    >
                      Book a demo
                      <ArrowRight className="size-4" />
                    </Link>
                    <Link
                      href="/jobs/product-manager"
                      className={cn(
                        buttonVariants({ size: "lg", variant: "outline" }),
                        "h-11 rounded-[0.9rem] border-white/14 bg-white/7 px-6 text-white hover:bg-white/10 hover:text-white",
                      )}
                    >
                      See the system
                      <ArrowUpRight className="size-4" />
                    </Link>
                  </div>
                </div>

                <div className="grid gap-0 rounded-[1.2rem] border border-white/10 bg-white/[0.035] sm:grid-cols-2 xl:grid-cols-4">
                  {proofStats.map((stat, index) => (
                    <div
                      key={stat.label}
                      className={cn(
                        "px-4 py-4",
                        index < proofStats.length - 1 &&
                          "border-b border-white/8 xl:border-r xl:border-b-0",
                        index === 1 && "sm:border-l sm:border-white/8 xl:border-l-0",
                        index < 2 && "sm:border-b sm:border-white/8 xl:border-b-0",
                      )}
                    >
                      <p className="font-mono text-[11px] tracking-[0.2em] text-white/40 uppercase">
                        {stat.label}
                      </p>
                      <p className="mt-3 text-2xl font-semibold tracking-tight text-white">
                        {stat.value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="relative min-h-[28rem] border-t border-white/10 lg:min-h-[44rem] lg:border-t-0 lg:border-l">
              <Image
                src="/landing/warehouse-racks.png"
                alt="Warehouse racks in a high-volume operations environment"
                fill
                priority
                className="object-cover"
              />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(17,17,17,0.06),rgba(17,17,17,0.86))]" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(122,240,210,0.18),transparent_22%)]" />

              <div className="absolute inset-0 flex flex-col justify-between p-5 sm:p-6 lg:p-8">
                <div className="self-start rounded-full border border-white/16 bg-black/30 px-3 py-1 font-mono text-[11px] tracking-[0.22em] text-white/74 uppercase backdrop-blur-sm">
                  Voice in the workflow
                </div>

                <div className="space-y-4">
                  <div className="rounded-[1.15rem] border border-white/14 bg-black/34 p-5 backdrop-blur-md">
                    <p className="font-mono text-[11px] tracking-[0.18em] text-white/46 uppercase">
                      Operating layer
                    </p>
                    <p className="mt-3 max-w-md text-[1.75rem] leading-[1.08] font-semibold tracking-[-0.04em] text-white">
                      Define the role.
                      <br />
                      Qualify earlier.
                      <br />
                      Interview by voice.
                      <br />
                      Execute the next step.
                    </p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-[1rem] border border-white/14 bg-black/26 p-4 backdrop-blur-md">
                      <p className="font-mono text-[11px] tracking-[0.18em] text-white/44 uppercase">
                        Recruiter control
                      </p>
                      <p className="mt-3 text-sm leading-7 text-white/80">
                        Human decisions stay in the loop while the system
                        executes the repetitive layer around them.
                      </p>
                    </div>
                    <div className="rounded-[1rem] border border-white/14 bg-black/26 p-4 backdrop-blur-md">
                      <p className="font-mono text-[11px] tracking-[0.18em] text-white/44 uppercase">
                        Existing stack
                      </p>
                      <p className="mt-3 text-sm leading-7 text-white/80">
                        Built to fit existing ATS workflows instead of posing as
                        another suite to replace them.
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {customerLogos.map((logo) => (
                      <span
                        key={logo}
                        className="rounded-full border border-white/10 bg-black/18 px-3 py-1.5 text-xs font-medium text-white/64"
                      >
                        {logo}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-[0.72fr_1.28fr]">
          <div className="rounded-[1.55rem] border border-black/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(238,236,230,0.9))] p-6 shadow-[0_22px_60px_rgba(15,23,42,0.06)] sm:p-7">
            <p className="font-mono text-[11px] tracking-[0.22em] text-slate-500 uppercase">
              Why teams buy Breathe
            </p>
            <h2 className="mt-4 max-w-md text-3xl leading-tight font-semibold tracking-[-0.04em] text-slate-950 sm:text-[2.45rem]">
              Hiring systems should not stop at the interview.
            </h2>
            <p className="mt-5 max-w-md text-base leading-8 text-slate-600">
              Most teams patch together sourcing, manual screening, calls,
              scorecards, and handoffs. Breathe compresses that layer into one
              operating system for qualification, evaluation, and execution.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {valueProps.map((item, index) => (
              <article
                key={item.title}
                className={cn(
                  "rounded-[1.25rem] border p-5 shadow-[0_16px_40px_rgba(15,23,42,0.05)] sm:p-6",
                  index === 2
                    ? "border-black/8 bg-[#111111] text-white"
                    : "border-black/8 bg-white/86 text-slate-950",
                )}
              >
                <p
                  className={cn(
                    "font-mono text-[11px] tracking-[0.2em] uppercase",
                    index === 2 ? "text-white/36" : "text-slate-400",
                  )}
                >
                  0{index + 1}
                </p>
                <h3 className="mt-3 text-[1.35rem] leading-tight font-semibold tracking-[-0.03em]">
                  {item.title}
                </h3>
                <p
                  className={cn(
                    "mt-4 text-sm leading-7",
                    index === 2 ? "text-white/74" : "text-slate-600",
                  )}
                >
                  {item.body}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="overflow-hidden rounded-[1.7rem] border border-black/8 bg-[#f8f7f3] shadow-[0_18px_54px_rgba(15,23,42,0.05)]">
          <div className="grid gap-0 lg:grid-cols-[0.7fr_1.3fr]">
            <div className="border-b border-black/8 px-6 py-6 lg:border-r lg:border-b-0 lg:px-8 lg:py-8">
              <p className="font-mono text-[11px] tracking-[0.22em] text-slate-500 uppercase">
                How Breathe works
              </p>
              <h2 className="mt-4 max-w-sm text-3xl leading-tight font-semibold tracking-[-0.04em] text-slate-950 sm:text-[2.45rem]">
                One hiring layer from role definition to next-step execution.
              </h2>
              <p className="mt-5 max-w-md text-base leading-8 text-slate-600">
                The workflow starts before the interview and keeps moving after
                the evaluation. That is the point.
              </p>
            </div>

            <div className="grid gap-px bg-black/8 lg:grid-cols-5">
              {workflowSteps.map((item, index) => (
                <article
                  key={item.step}
                  className={cn(
                    "relative bg-white/92 px-5 py-5 sm:px-6 sm:py-6",
                    index === 2 && "bg-[linear-gradient(180deg,#131313,#1b1b1b)] text-white",
                  )}
                >
                  <p
                    className={cn(
                      "font-mono text-[11px] tracking-[0.2em] uppercase",
                      index === 2 ? "text-white/38" : "text-slate-400",
                    )}
                  >
                    {item.step}
                  </p>
                  <h3 className="mt-4 text-lg leading-tight font-semibold tracking-[-0.03em]">
                    {item.title}
                  </h3>
                  <p
                    className={cn(
                      "mt-4 text-sm leading-7",
                      index === 2 ? "text-white/72" : "text-slate-600",
                    )}
                  >
                    {item.body}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-[0.92fr_1.08fr]">
          <article className="rounded-[1.55rem] border border-black/8 bg-[#111111] p-6 text-white shadow-[0_24px_80px_rgba(15,23,42,0.16)] sm:p-7">
            <p className="font-mono text-[11px] tracking-[0.2em] text-white/36 uppercase">
              What breaks today
            </p>
            <ul className="mt-6 grid gap-4 text-sm leading-7 text-white/72">
              <li>High applicant volume creates a screening bottleneck.</li>
              <li>Phone qualification still burns recruiter time.</li>
              <li>Evaluation quality varies too much across teams.</li>
              <li>The ATS tracks the funnel, but does not execute this layer.</li>
            </ul>
          </article>

          <article className="rounded-[1.55rem] border border-black/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(239,236,228,0.92))] p-6 shadow-[0_20px_56px_rgba(15,23,42,0.06)] sm:p-7">
            <p className="font-mono text-[11px] tracking-[0.2em] text-slate-500 uppercase">
              What changes with Breathe
            </p>
            <ul className="mt-6 grid gap-4 text-sm leading-7 text-slate-600">
              <li>Consistent early qualification at scale.</li>
              <li>Structured evaluation recruiters can act on.</li>
              <li>Execution into interview, training, contract, or onboarding.</li>
              <li>Operational speed without replacing the existing stack.</li>
            </ul>
          </article>
        </section>

        <section className="rounded-[1.7rem] border border-black/8 bg-[linear-gradient(135deg,rgba(17,17,17,0.985),rgba(39,39,39,0.96))] p-6 text-white shadow-[0_30px_90px_rgba(15,23,42,0.18)] sm:p-8 lg:p-9">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="font-mono text-[11px] tracking-[0.2em] text-white/40 uppercase">
                Book a demo
              </p>
              <h2 className="mt-4 text-3xl leading-tight font-semibold tracking-[-0.045em] sm:text-[2.8rem]">
                See how Breathe fits your hiring flow.
              </h2>
              <p className="mt-5 text-base leading-8 text-white/70">
                Start with the role, see the voice interview layer, review the
                structured evaluation, and map the next operational step into
                your workflow.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/jobs"
                className={cn(
                  buttonVariants({ size: "lg" }),
                  "h-11 rounded-[0.9rem] bg-[#d9ff57] px-6 text-slate-950 hover:bg-[#cbf24b]",
                )}
              >
                Book a demo
              </Link>
              <Link
                href="/jobs/product-manager"
                className={cn(
                  buttonVariants({ size: "lg", variant: "outline" }),
                  "h-11 rounded-[0.9rem] border-white/14 bg-white/8 px-6 text-white hover:bg-white/12 hover:text-white",
                )}
              >
                See the system
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
