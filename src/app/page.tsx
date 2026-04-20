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
    <main className="brand-stage bg-background text-foreground relative flex flex-1 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(94,126,255,0.08),transparent_24%),radial-gradient(circle_at_bottom_right,_rgba(170,184,232,0.14),transparent_28%)]" />
      <div className="absolute inset-x-0 top-0 h-[32rem] bg-[linear-gradient(180deg,rgba(255,255,255,0.38),transparent)]" />

      <div className="relative mx-auto flex w-full max-w-[96rem] flex-1 flex-col gap-6 px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
        <section className="brand-hero text-primary-foreground overflow-hidden rounded-[2rem]">
          <div className="grid lg:grid-cols-[1.06fr_0.94fr]">
            <div className="relative overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(94,126,255,0.18),transparent_30%),linear-gradient(180deg,rgba(255,255,255,0.03),transparent_32%)]" />
              <div className="relative flex h-full flex-col justify-between gap-12 px-6 py-6 sm:px-8 sm:py-8 lg:px-10 lg:py-10">
                <div className="space-y-8">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="brand-chip-inverse rounded-full px-3 py-1 font-mono text-[11px] tracking-[0.22em] uppercase">
                      Candidate operations layer
                    </span>
                    <span className="brand-chip-inverse text-primary-foreground/52 rounded-full px-3 py-1 font-mono text-[11px] tracking-[0.22em] uppercase">
                      ATS-compatible
                    </span>
                  </div>

                  <div className="space-y-5">
                    <h1 className="text-primary-foreground max-w-4xl text-[3.2rem] leading-[0.88] sm:text-[4.15rem] lg:text-[5.55rem]">
                      Candidate <br />
                      operations <br />
                      for high-volume teams.
                    </h1>
                    <p className="text-primary-foreground/68 max-w-2xl text-base leading-8 sm:text-lg">
                      From application to ready-to-start, Breathe runs the
                      operational hiring layer that usually slows teams down:
                      screening, outreach, interviews, scheduling,
                      documentation, and workflow movement on top of the ATS
                      they already use.
                    </p>
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row">
                    <Link
                      href="/jobs"
                      className={cn(
                        buttonVariants({ size: "lg", variant: "secondary" }),
                        "border-highlight/26 bg-highlight text-highlight-foreground h-11 rounded-[0.9rem] px-6 hover:bg-[#4f70f1]",
                      )}
                    >
                      Book a demo
                      <ArrowRight className="size-4" />
                    </Link>
                    <Link
                      href="/jobs/product-manager"
                      className={cn(
                        buttonVariants({ size: "lg", variant: "outline" }),
                        "text-primary-foreground hover:text-primary-foreground h-11 rounded-[0.9rem] border-white/14 bg-white/7 px-6 hover:bg-white/10",
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
                        index === 1 &&
                          "sm:border-l sm:border-white/8 xl:border-l-0",
                        index < 2 &&
                          "sm:border-b sm:border-white/8 xl:border-b-0",
                      )}
                    >
                      <p className="font-mono text-[11px] tracking-[0.2em] text-white/40 uppercase">
                        {stat.label}
                      </p>
                      <p className="text-primary-foreground mt-3 text-2xl font-semibold tracking-tight">
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
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(17,17,17,0.08),rgba(17,17,17,0.88))]" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(94,126,255,0.18),transparent_22%)]" />

              <div className="absolute inset-0 flex flex-col justify-between p-5 sm:p-6 lg:p-8">
                <div className="text-primary-foreground/74 self-start rounded-full border border-white/16 bg-black/30 px-3 py-1 font-mono text-[11px] tracking-[0.22em] uppercase backdrop-blur-sm">
                  From application to ready-to-start
                </div>

                <div className="space-y-4">
                  <div className="rounded-[1.15rem] border border-white/14 bg-black/34 p-5 backdrop-blur-md">
                    <p className="text-primary-foreground/46 font-mono text-[11px] tracking-[0.18em] uppercase">
                      Operating layer
                    </p>
                    <p className="text-primary-foreground mt-3 max-w-md text-[1.75rem] leading-[1.02]">
                      Screening.
                      <br />
                      Follow-up.
                      <br />
                      Interviews.
                      <br />
                      Documentation.
                    </p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-[1rem] border border-white/14 bg-black/26 p-4 backdrop-blur-md">
                      <p className="text-primary-foreground/44 font-mono text-[11px] tracking-[0.18em] uppercase">
                        Recruiter control
                      </p>
                      <p className="text-primary-foreground/80 mt-3 text-sm leading-7">
                        Human decisions stay in the loop while the system
                        executes the repetitive layer around them.
                      </p>
                    </div>
                    <div className="rounded-[1rem] border border-white/14 bg-black/26 p-4 backdrop-blur-md">
                      <p className="text-primary-foreground/44 font-mono text-[11px] tracking-[0.18em] uppercase">
                        Existing stack
                      </p>
                      <p className="text-primary-foreground/80 mt-3 text-sm leading-7">
                        Built to fit existing ATS workflows instead of posing as
                        another suite to replace them.
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {customerLogos.map((logo) => (
                      <span
                        key={logo}
                        className="text-primary-foreground/64 rounded-full border border-white/10 bg-black/18 px-3 py-1.5 text-xs font-medium"
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
          <div className="brand-surface rounded-[1.55rem] p-6 sm:p-7">
            <p className="text-muted-foreground font-mono text-[11px] tracking-[0.22em] uppercase">
              Why teams buy Breathe
            </p>
            <h2 className="text-foreground mt-4 max-w-md text-3xl leading-tight sm:text-[2.45rem]">
              Recruiters should focus on decisions, not admin.
            </h2>
            <p className="text-muted-foreground mt-5 max-w-md text-base leading-8">
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
                  "rounded-[1.25rem] border p-5 shadow-[0_16px_40px_rgba(23,23,23,0.05)] sm:p-6",
                  index === 2
                    ? "brand-surface-strong text-primary-foreground"
                    : "border-border/82 bg-card/86 text-foreground",
                )}
              >
                <p
                  className={cn(
                    "font-mono text-[11px] tracking-[0.2em] uppercase",
                    index === 2
                      ? "text-primary-foreground/36"
                      : "text-muted-foreground",
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
                    index === 2
                      ? "text-primary-foreground/74"
                      : "text-muted-foreground",
                  )}
                >
                  {item.body}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="brand-surface overflow-hidden rounded-[1.7rem]">
          <div className="grid gap-0 lg:grid-cols-[0.7fr_1.3fr]">
            <div className="border-border/78 border-b px-6 py-6 lg:border-r lg:border-b-0 lg:px-8 lg:py-8">
              <p className="text-muted-foreground font-mono text-[11px] tracking-[0.22em] uppercase">
                How Breathe works
              </p>
              <h2 className="text-foreground mt-4 max-w-sm text-3xl leading-tight sm:text-[2.45rem]">
                One hiring layer from role definition to next-step execution.
              </h2>
              <p className="text-muted-foreground mt-5 max-w-md text-base leading-8">
                The workflow starts before the interview and keeps moving after
                the evaluation. That is the point.
              </p>
            </div>

            <div className="bg-border/80 grid gap-px lg:grid-cols-5">
              {workflowSteps.map((item, index) => (
                <article
                  key={item.step}
                  className={cn(
                    "bg-card/92 relative px-5 py-5 sm:px-6 sm:py-6",
                    index === 2 &&
                      "brand-surface-strong text-primary-foreground",
                  )}
                >
                  <p
                    className={cn(
                      "font-mono text-[11px] tracking-[0.2em] uppercase",
                      index === 2
                        ? "text-primary-foreground/38"
                        : "text-muted-foreground",
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
                      index === 2
                        ? "text-primary-foreground/72"
                        : "text-muted-foreground",
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
          <article className="brand-surface-strong text-primary-foreground rounded-[1.55rem] p-6 sm:p-7">
            <p className="text-primary-foreground/36 font-mono text-[11px] tracking-[0.2em] uppercase">
              What breaks today
            </p>
            <ul className="text-primary-foreground/72 mt-6 grid gap-4 text-sm leading-7">
              <li>High applicant volume creates a screening bottleneck.</li>
              <li>Phone qualification still burns recruiter time.</li>
              <li>Evaluation quality varies too much across teams.</li>
              <li>
                The ATS tracks the funnel, but does not execute this layer.
              </li>
            </ul>
          </article>

          <article className="brand-surface rounded-[1.55rem] p-6 sm:p-7">
            <p className="text-muted-foreground font-mono text-[11px] tracking-[0.2em] uppercase">
              What changes with Breathe
            </p>
            <ul className="text-muted-foreground mt-6 grid gap-4 text-sm leading-7">
              <li>Consistent early qualification at scale.</li>
              <li>Structured evaluation recruiters can act on.</li>
              <li>
                Execution into interview, training, contract, or onboarding.
              </li>
              <li>Operational speed without replacing the existing stack.</li>
            </ul>
          </article>
        </section>

        <section className="brand-surface-strong text-primary-foreground rounded-[1.7rem] p-6 sm:p-8 lg:p-9">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-primary-foreground/40 font-mono text-[11px] tracking-[0.2em] uppercase">
                Book a demo
              </p>
              <h2 className="mt-4 text-3xl leading-tight sm:text-[2.8rem]">
                See how Breathe fits your hiring flow.
              </h2>
              <p className="text-primary-foreground/70 mt-5 text-base leading-8">
                Start with the role, see the voice interview layer, review the
                structured evaluation, and map the next operational step into
                your workflow.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/jobs"
                className={cn(
                  buttonVariants({ size: "lg", variant: "secondary" }),
                  "border-highlight/26 bg-highlight text-highlight-foreground h-11 rounded-[0.9rem] px-6 hover:bg-[#4f70f1]",
                )}
              >
                Book a demo
              </Link>
              <Link
                href="/jobs/product-manager"
                className={cn(
                  buttonVariants({ size: "lg", variant: "outline" }),
                  "text-primary-foreground hover:text-primary-foreground h-11 rounded-[0.9rem] border-white/14 bg-white/8 px-6 hover:bg-white/12",
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
