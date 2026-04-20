import Image from "next/image";
import Link from "next/link";

import { ArrowRight } from "lucide-react";

import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Mechanism", href: "#mechanism" },
  { label: "Stack fit", href: "#stack-fit" },
  { label: "Outcomes", href: "#outcomes" },
  { label: "Environments", href: "#environments" },
  { label: "Security", href: "#security" },
] as const;

const heroStages = [
  { step: "01", label: "Apply" },
  { step: "02", label: "Screen" },
  { step: "03", label: "Reach out" },
  { step: "04", label: "Interview" },
  { step: "05", label: "Document" },
  { step: "06", label: "Enroll" },
  { step: "07", label: "Ready-to-start" },
] as const;

const tickerItems = [
  "Candidate operations",
  "Application → ready-to-start",
  "On top of your ATS",
  "Built for high-volume hiring",
  "Recruiters on decisions, not admin",
  "Human control. System speed.",
] as const;

const proofItems = [
  {
    label: "Origin",
    body: "From the team that increased recruiter productivity at Job&Talent.",
  },
  {
    label: "Built for",
    body: "Real high-volume hiring operations with stages, shifts, sites, and handoffs.",
  },
  {
    label: "Fit",
    body: "Operates on top of the ATS and systems teams already use.",
  },
  {
    label: "Scope",
    body: "From application to ready-to-start.",
  },
] as const;

const frictionPoints = [
  "Too many applicants to process manually.",
  "Too many handoffs across disconnected tools.",
  "Too much recruiter time spent pushing the workflow forward.",
  "Too much inconsistency between candidates, sites, and shifts.",
] as const;

type MechanismModule = {
  id: string;
  title: string;
  tag: string;
  body: string;
  details: readonly string[];
  wide?: boolean;
};

const mechanismModules: readonly MechanismModule[] = [
  {
    id: "M-01",
    title: "Screen",
    tag: "Auto",
    body: "Parse applications, apply rules, and move qualified candidates forward at the rate demand arrives.",
    details: ["Application intake", "Rule engine", "Queue write-back"],
    wide: true,
  },
  {
    id: "M-02",
    title: "Reach out",
    tag: "Auto",
    body: "Handle follow-up, reminders, and next-step communication automatically across the channels your team already uses.",
    details: ["SMS", "Email", "WhatsApp"],
    wide: true,
  },
  {
    id: "M-03",
    title: "Interview",
    tag: "Auto",
    body: "Run structured interviews and capture signals in a consistent format across every candidate, site, and shift.",
    details: ["Structured", "Signal capture"],
  },
  {
    id: "M-04",
    title: "Coordinate",
    tag: "Auto",
    body: "Move candidates across stages, trigger next actions, and keep the process aligned with the ATS of record.",
    details: ["Stage orchestration"],
  },
  {
    id: "M-05",
    title: "Document",
    tag: "Auto",
    body: "Collect required information and keep documentation moving without manual chasing or spreadsheet hand-offs.",
    details: ["Collection", "Validation"],
  },
  {
    id: "M-06",
    title: "Enroll",
    tag: "Auto",
    body: "Support handoff into enrollment and ready-to-start steps once a candidate is selected.",
    details: ["Handoff", "Ready-to-start"],
  },
];

type StackLayer = {
  tag: string;
  title: string;
  body: string;
  meta: string;
  inverted?: boolean;
};

const stackLayers: readonly StackLayer[] = [
  {
    tag: "Layer 03",
    title: "Breathe",
    body: "Candidate operations engine: screen, reach out, interview, coordinate, document, enroll, escalate.",
    meta: "Active",
    inverted: true,
  },
  {
    tag: "Layer 02",
    title: "ATS of record",
    body: "Your system of truth for roles, stages, and candidate state. Unchanged.",
    meta: "Greenhouse · Workday · SmartRecruiters · iCIMS",
  },
  {
    tag: "Layer 01",
    title: "Existing hiring stack",
    body: "Scheduling, comms, HRIS, checks, onboarding, payroll: the tools your team already uses.",
    meta: "SMS · Email · WhatsApp · HRIS · BGC",
  },
];

const stackFacts = [
  ["Deploy", "Fast rollout"],
  ["Replatform", "None"],
  ["System of record", "ATS stays in place"],
  ["Posture", "Readable, attributable, auditable"],
] as const;

const outcomeCards = [
  {
    label: "Throughput",
    title: "The process scales with candidate volume, not recruiter headcount.",
    body: "Breathe takes over the repetitive work that usually becomes the rate limiter first.",
  },
  {
    label: "Recruiter load",
    title: "Recruiters stay on judgment work.",
    body: "Escalations arrive with context already assembled, instead of another queue to manually push.",
  },
  {
    label: "Readiness",
    title: "Documentation and enrollment keep moving before start dates slip.",
    body: "The process does not stall after interview just because paperwork and handoff live across tools.",
  },
] as const;

const trustCards = [
  {
    label: "Recruiter policy",
    title: "Policy, not prompts.",
    body: "Rules, thresholds, and escalation paths are set by your team. Breathe operates inside them every time.",
    points: ["Role-level stage rules", "Site and shift guardrails", "Escalation on doubt"],
  },
  {
    label: "Audit",
    title: "Every action on the record.",
    body: "Messages, stage moves, and collected information are attributable to a rule, a reason, and a timestamp.",
    points: ["Per-candidate action log", "Policy diff history", "Export to ATS of record"],
  },
  {
    label: "Enterprise trust",
    title: "Human control. System speed.",
    body: "Recruiters keep the decisions that matter while the system keeps the pace through the operational layer.",
    points: ["SOC 2 Type II", "GDPR", "Regional data residency", "SSO / SCIM"],
  },
] as const;

const trustBadges = [
  ["Standard", "SOC 2 Type II"],
  ["Standard", "GDPR"],
  ["Hosting", "EU · US"],
  ["Access", "SSO · SCIM"],
] as const;

const useCases = [
  {
    label: "Logistics",
    title: "Warehousing & logistics",
    body: "Pickers, packers, forklift operators. Ramp volumes spike on peak windows and teams need application-to-ready-to-start inside the hiring window, not after it.",
    image: "/landing/img-1-warehouse-aisle.jpg",
    alt: "Warehouse aisle in a high-volume logistics environment",
    tags: ["Peak volume", "Shift-based", "Multi-site"],
  },
  {
    label: "Hospitality",
    title: "Kitchen & hospitality",
    body: "Line cooks, service staff, baristas. Documentation and enrollment are often the real bottleneck, not screening.",
    image: "/landing/img-3-kitchen-line.jpg",
    alt: "Kitchen line during service preparation",
    tags: ["High churn", "Fast starts", "Docs-heavy"],
  },
  {
    label: "Production",
    title: "Production & assembly",
    body: "Line operators, QA, packaging. Repetitive environments where consistency between candidates, shifts, and sites is the real hiring KPI.",
    image: "/landing/img-4-production-line.jpg",
    alt: "Production line in an assembly environment",
    tags: ["Repetition", "Consistency", "Operational rhythm"],
  },
] as const;

export default function Home() {
  return (
    <main
      id="top"
      className="brand-stage text-foreground relative flex flex-1 flex-col"
    >
      <header className="sticky top-0 z-40 border-b border-border/90 bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-[104rem] items-center justify-between gap-6 px-4 py-4 sm:px-6 lg:px-8">
          <Link href="#top" className="flex items-center gap-3">
            <span className="relative size-[18px]">
              <span className="absolute inset-0 border border-foreground" />
              <span className="absolute inset-0 translate-x-1 translate-y-1 border border-highlight/85" />
            </span>
            <span className="text-base">Breathe</span>
          </Link>

          <nav className="hidden items-center gap-8 md:flex">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="font-mono text-[11px] tracking-[0.14em] uppercase text-structure-secondary hover:text-highlight"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/auth/login"
              className="font-mono text-[11px] tracking-[0.14em] uppercase text-structure-secondary hover:text-foreground"
            >
              Sign in
            </Link>
            <Link
              href="#final-cta"
              className={cn(
                buttonVariants({ size: "lg", variant: "default" }),
                "h-10 rounded-none px-4 font-mono text-[11px] tracking-[0.14em] uppercase",
              )}
            >
              Book a demo
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-[104rem] flex-col px-4 sm:px-6 lg:px-8">
        <section className="border-b border-border py-12 sm:py-16 lg:py-20">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <p className="ops-kicker text-structure-secondary">
              The candidate-operations layer for high-volume hiring
            </p>
            <p className="ops-kicker text-muted-foreground">
              On top of your ATS · built for operational teams
            </p>
          </div>

          <div className="mt-8 grid gap-10 lg:grid-cols-[1.18fr_0.82fr] lg:items-end">
            <div>
              <h1 className="max-w-[10ch] text-[3.9rem] leading-[0.88] sm:text-[5.6rem] lg:text-[8rem]">
                From application to{" "}
                <span className="text-highlight">ready-to-start.</span>
              </h1>
            </div>

            <div className="space-y-6 lg:pb-3">
              <div className="flex items-center gap-3 font-mono text-[11px] tracking-[0.14em] uppercase text-structure-secondary">
                <span className="ops-signal-dot size-2 bg-highlight" />
                Candidate operations for high-volume teams
              </div>
              <p className="max-w-[42ch] text-lg leading-8 text-structure-secondary">
                Breathe runs candidate operations for high-volume teams:
                screening, outreach, interviews, documentation, and enrollment
                on top of your ATS, so you can fill more roles, faster, without
                adding recruiter load.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Link
                  href="#final-cta"
                  className={cn(
                    buttonVariants({ size: "lg", variant: "default" }),
                    "h-11 rounded-none px-5 font-mono text-[11px] tracking-[0.14em] uppercase",
                  )}
                >
                  Book a demo
                  <ArrowRight className="size-4" />
                </Link>
                <Link
                  href="#mechanism"
                  className={cn(
                    buttonVariants({ size: "lg", variant: "outline" }),
                    "h-11 rounded-none px-5 font-mono text-[11px] tracking-[0.14em] uppercase",
                  )}
                >
                  See how it runs
                  <ArrowRight className="size-4" />
                </Link>
              </div>
              <p className="ops-kicker text-muted-foreground">
                Operates on top of your ATS · no replatform
              </p>
            </div>
          </div>

          <div className="mt-14 border-y border-foreground pt-4">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <p className="ops-kicker text-muted-foreground">
                Ref. 01 — operational context / warehouse aisle
              </p>
              <p className="ops-kicker text-muted-foreground">
                Documentary photography · no overlay
              </p>
            </div>
            <div className="relative aspect-[24/9] overflow-hidden bg-secondary">
              <Image
                src="/landing/img-1-warehouse-aisle.jpg"
                alt="Warehouse aisle in a high-volume hiring environment"
                fill
                priority
                className="object-cover saturate-90"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/15" />
            </div>
            <div className="grid border-t border-border md:grid-cols-7">
              {heroStages.map((stage, index) => (
                <div
                  key={stage.step}
                  className={cn(
                    "flex flex-col gap-2 border-r border-border px-4 py-4 last:border-r-0",
                    index === heroStages.length - 1 && "bg-highlight/6",
                  )}
                >
                  <span className="font-mono text-[10px] tracking-[0.14em] uppercase text-muted-foreground">
                    Stage {stage.step}
                  </span>
                  <span
                    className={cn(
                      "font-heading text-lg leading-none tracking-[-0.03em]",
                      index === heroStages.length - 1 && "text-highlight",
                    )}
                  >
                    {stage.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="overflow-hidden border-b border-foreground">
          <div className="flex w-max animate-[ticker_36s_linear_infinite] gap-12 py-4">
            {[...tickerItems, ...tickerItems].map((item, index) => (
              <span
                key={`${item}-${index}`}
                className="inline-flex items-center gap-3 font-mono text-[11px] tracking-[0.14em] uppercase text-foreground"
              >
                <span className="size-[6px] bg-highlight" />
                {item}
              </span>
            ))}
          </div>
        </section>

        <section className="border-b border-border">
          <div className="grid lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
            {proofItems.map((item, index) => (
              <article
                key={item.label}
                className={cn(
                  "border-r border-border px-6 py-8 last:border-r-0",
                  index === 0 && "lg:border-l-0",
                )}
              >
                <p className="mb-3 flex items-center gap-2 font-mono text-[10px] tracking-[0.14em] uppercase text-muted-foreground">
                  <span className="size-[5px] bg-highlight" />
                  {item.label}
                </p>
                <p className="max-w-[30ch] text-base leading-7 text-foreground">
                  {item.body}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="border-b border-border py-20" id="friction">
          <div className="mb-12 grid gap-6 md:grid-cols-[12rem_1fr]">
            <p className="ops-kicker text-foreground">03 · Friction</p>
            <p className="ops-kicker text-muted-foreground">
              What breaks first when volume rises
            </p>
          </div>

          <div className="grid border-y border-foreground lg:grid-cols-2">
            <div className="relative aspect-[4/5] overflow-hidden border-r border-foreground bg-secondary">
              <Image
                src="/landing/img-2-loading-dock.jpg"
                alt="Loading dock and staging area"
                fill
                className="object-cover"
              />
            </div>

            <div className="flex flex-col">
              <div className="px-8 py-10 sm:px-12 sm:py-14">
                <h2 className="max-w-[9ch] text-[3.4rem] leading-[0.92] sm:text-[4.2rem]">
                  Volume breaks candidate operations first.
                </h2>
                <p className="mt-6 max-w-[46ch] text-lg leading-8 text-structure-secondary">
                  When every stage depends on recruiters chasing responses,
                  scheduling interviews, moving candidates forward, collecting
                  documentation, and coordinating handoffs across tools,
                  throughput slows down long before demand does.
                </p>

                <div className="mt-10 border-t border-border">
                  {frictionPoints.map((point, index) => (
                    <div
                      key={point}
                      className="grid grid-cols-[3.5rem_1fr] border-b border-border py-5"
                    >
                      <span className="font-mono text-[11px] tracking-[0.14em] uppercase text-muted-foreground">
                        0{index + 1}
                      </span>
                      <p className="text-base leading-7 text-foreground">
                        {point}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-auto flex flex-col gap-4 bg-foreground px-8 py-7 sm:flex-row sm:items-center sm:justify-between sm:px-12">
                <p className="ops-kicker text-highlight-soft">Observed outcome</p>
                <p className="max-w-[28ch] text-2xl leading-tight text-background">
                  Open roles stay open, candidates drop, and operations feel it.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-border py-20" id="mechanism">
          <div className="mb-12 grid gap-8 lg:grid-cols-[1.2fr_1fr] lg:items-end">
            <div>
              <p className="ops-kicker text-foreground">04 · Mechanism</p>
              <h2 className="mt-6 max-w-[10ch] text-[3.5rem] leading-[0.92] sm:text-[5rem]">
                Candidate operations, from application to ready-to-start.
              </h2>
            </div>
            <div>
              <p className="max-w-[44ch] text-lg leading-8 text-structure-secondary">
                Breathe uses AI to run screening, outreach, interviews,
                scheduling, documentation, enrollment, and recruiter review, so
                the process keeps moving without relying on recruiters to push
                every step by hand.
              </p>
            </div>
          </div>

          <div className="overflow-hidden border border-foreground bg-secondary/45">
            <div className="flex items-center justify-between gap-4 border-b border-foreground px-6 py-4">
              <div className="flex items-center gap-3 font-mono text-[11px] tracking-[0.14em] uppercase text-foreground">
                <span className="size-[7px] bg-highlight" />
                Breathe / candidate-ops / run 2641
              </div>
              <p className="ops-kicker text-muted-foreground">
                Active · recruiter-in-the-loop only where needed
              </p>
            </div>

            <div className="grid border-b border-foreground md:grid-cols-7">
              {[
                ...heroStages.slice(1, 6).map((stage) => ({
                  ...stage,
                  human: false,
                })),
                { step: "07", label: "Escalate", human: true },
              ].map((stage, index) => (
                <div
                  key={stage.label}
                  className={cn(
                    "flex flex-col gap-3 border-r border-border px-4 py-5 last:border-r-0",
                    stage.human ? "bg-foreground text-background" : "bg-background/55",
                  )}
                >
                  <span
                    className={cn(
                      "font-mono text-[10px] tracking-[0.14em] uppercase",
                      stage.human ? "text-highlight-soft" : "text-muted-foreground",
                    )}
                  >
                    Stage {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="font-heading text-[1.05rem] leading-none tracking-[-0.03em]">
                    {stage.label}
                  </span>
                  <span
                    className={cn(
                      "mt-auto font-mono text-[9.5px] tracking-[0.14em] uppercase",
                      stage.human ? "text-highlight-soft" : "text-structure-secondary",
                    )}
                  >
                    {stage.human ? "Human" : "Auto"}
                  </span>
                </div>
              ))}
            </div>

            <div className="grid md:grid-cols-12">
              {mechanismModules.map((module, index) => (
                <article
                  key={module.id}
                  className={cn(
                    "flex min-h-[15rem] flex-col justify-between border-r border-b border-border px-5 py-6 last:border-r-0 md:px-6",
                    module.wide ? "md:col-span-6" : "md:col-span-3",
                    index === mechanismModules.length - 1 && "md:border-r-0",
                  )}
                >
                  <div className="flex items-start justify-between gap-4">
                    <span className="font-mono text-[10px] tracking-[0.14em] uppercase text-muted-foreground">
                      {module.id}
                    </span>
                    <span className="rounded-sm border border-highlight/40 px-2 py-1 font-mono text-[9.5px] tracking-[0.14em] uppercase text-highlight">
                      {module.tag}
                    </span>
                  </div>

                  <div className="mt-6">
                    <h3 className="text-[1.8rem] leading-none tracking-[-0.03em]">
                      {module.title}
                    </h3>
                    <p className="mt-4 max-w-[34ch] text-[0.95rem] leading-7 text-structure-secondary">
                      {module.body}
                    </p>
                  </div>

                  <div className="mt-6 flex flex-wrap gap-x-4 gap-y-2">
                    {module.details.map((detail) => (
                      <span
                        key={detail}
                        className="inline-flex items-center gap-2 font-mono text-[10px] tracking-[0.12em] uppercase text-structure-secondary"
                      >
                        <span className="size-[5px] bg-highlight" />
                        {detail}
                      </span>
                    ))}
                  </div>
                </article>
              ))}

              <article className="flex flex-col gap-5 bg-foreground px-6 py-7 text-background md:col-span-12 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-4">
                  <span className="font-mono text-[10px] tracking-[0.14em] uppercase text-highlight-soft">
                    M-07
                  </span>
                  <span className="rounded-sm border border-highlight/40 px-2 py-1 font-mono text-[9.5px] tracking-[0.14em] uppercase text-highlight-soft">
                    Human-in-the-loop
                  </span>
                  <h3 className="text-[1.8rem] leading-none tracking-[-0.03em]">
                    Escalate
                  </h3>
                </div>
                <p className="max-w-[48ch] text-[0.95rem] leading-7 text-background/78">
                  Ask recruiters for input only where judgment or approval is
                  needed. Every escalation arrives with the relevant context
                  already assembled.
                </p>
              </article>
            </div>

            <div className="flex flex-col gap-4 border-t border-foreground px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-[1.45rem] leading-tight tracking-[-0.02em] text-foreground">
                Candidate operations keep moving.{" "}
                <span className="text-highlight">
                  Recruiters stay focused on decisions.
                </span>
              </p>
              <Link
                href="#final-cta"
                className="font-mono text-[11px] tracking-[0.14em] uppercase text-foreground underline underline-offset-4 hover:text-highlight"
              >
                Walk through the engine
              </Link>
            </div>
          </div>
        </section>

        <section className="border-b border-border py-20" id="stack-fit">
          <div className="grid gap-10 lg:grid-cols-[1fr_1.4fr] lg:items-start">
            <div>
              <p className="ops-kicker text-foreground">06 · Stack fit</p>
              <h2 className="mt-6 max-w-[8ch] text-[3.5rem] leading-[0.92] sm:text-[4.8rem]">
                Automation on top of your ATS, not around it.
              </h2>
              <p className="mt-6 max-w-[36ch] text-lg leading-8 text-structure-secondary">
                Breathe operates as the candidate-operations layer on top of
                your system of record. The ATS stays the source of truth;
                Breathe runs the work between the stages.
              </p>
            </div>

            <div className="border border-foreground bg-secondary/45 p-7">
              <div className="space-y-4">
                {stackLayers.map((layer) => (
                  <div key={layer.title}>
                    <div
                      className={cn(
                        "grid items-center gap-5 border border-foreground px-5 py-5 md:grid-cols-[6rem_1fr_auto]",
                        layer.inverted
                          ? "bg-foreground text-background"
                          : "bg-background/70 text-foreground",
                      )}
                    >
                      <p
                        className={cn(
                          "font-mono text-[10px] tracking-[0.14em] uppercase",
                          layer.inverted
                            ? "text-highlight-soft"
                            : "text-muted-foreground",
                        )}
                      >
                        {layer.tag}
                      </p>
                      <div>
                        <h3 className="text-[1.7rem] leading-none tracking-[-0.02em]">
                          {layer.title}
                        </h3>
                        <p
                          className={cn(
                            "mt-2 max-w-[42ch] text-[0.95rem] leading-7",
                            layer.inverted
                              ? "text-background/72"
                              : "text-structure-secondary",
                          )}
                        >
                          {layer.body}
                        </p>
                      </div>
                      <p
                        className={cn(
                          "font-mono text-[10px] tracking-[0.12em] uppercase",
                          layer.inverted
                            ? "text-highlight-soft"
                            : "text-muted-foreground",
                        )}
                      >
                        {layer.meta}
                      </p>
                    </div>
                    {layer !== stackLayers[stackLayers.length - 1] && (
                      <div className="ml-7 h-5 border-l border-dashed border-foreground" />
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-6 grid gap-0 border border-border sm:grid-cols-2 xl:grid-cols-4">
                {stackFacts.map(([label, value], index) => (
                  <div
                    key={label}
                    className={cn(
                      "border-r border-border px-4 py-4 last:border-r-0",
                      index > 1 && "border-t border-border xl:border-t-0",
                    )}
                  >
                    <p className="font-mono text-[10px] tracking-[0.12em] uppercase text-muted-foreground">
                      {label}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-foreground">
                      {value}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-border py-20" id="outcomes">
          <div className="mb-12 grid gap-8 lg:grid-cols-[1.2fr_1fr] lg:items-end">
            <div>
              <p className="ops-kicker text-foreground">07 · Business outcome</p>
              <h2 className="mt-6 max-w-[9ch] text-[3.8rem] leading-[0.92] sm:text-[5.6rem]">
                Fill more roles, faster —{" "}
                <span className="text-highlight">
                  without adding recruiter load.
                </span>
              </h2>
            </div>
            <p className="max-w-[40ch] text-lg leading-8 text-structure-secondary">
              Breathe shifts the rate limiter off the recruiting team.
              Throughput scales with candidate volume, not headcount.
            </p>
          </div>

          <div className="grid border-y border-foreground md:grid-cols-3">
            {outcomeCards.map((card, index) => (
              <article
                key={card.label}
                className={cn(
                  "flex min-h-[17rem] flex-col gap-5 border-r border-border px-6 py-8 last:border-r-0",
                  index === 0 && "bg-background/72",
                )}
              >
                <p className="font-mono text-[10px] tracking-[0.14em] uppercase text-muted-foreground">
                  {card.label}
                </p>
                <h3 className="text-[2rem] leading-[0.98] tracking-[-0.03em]">
                  {card.title}
                </h3>
                <p className="max-w-[30ch] text-[0.95rem] leading-7 text-structure-secondary">
                  {card.body}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="border-b border-border py-20" id="security">
          <div className="mb-12 grid gap-8 lg:grid-cols-[1.2fr_1fr] lg:items-end">
            <div>
              <p className="ops-kicker text-foreground">08 · Security</p>
              <h2 className="mt-6 max-w-[7ch] text-[3.6rem] leading-[0.92] sm:text-[5rem]">
                Human control.{" "}
                <span className="text-highlight">System speed.</span>
              </h2>
            </div>
            <p className="max-w-[40ch] text-lg leading-8 text-structure-secondary">
              Breathe operates inside clear guardrails your team sets. Actions
              are attributable, reversible, and kept on the record, while
              recruiters keep control of the decisions that matter.
            </p>
          </div>

          <div className="grid border-y border-foreground md:grid-cols-3">
            {trustCards.map((card) => (
              <article
                key={card.title}
                className="flex min-h-[18rem] flex-col gap-4 border-r border-border px-6 py-8 last:border-r-0"
              >
                <p className="font-mono text-[10px] tracking-[0.14em] uppercase text-muted-foreground">
                  {card.label}
                </p>
                <h3 className="text-[2rem] leading-[0.98] tracking-[-0.03em]">
                  {card.title}
                </h3>
                <p className="max-w-[32ch] text-[0.95rem] leading-7 text-structure-secondary">
                  {card.body}
                </p>
                <div className="mt-auto flex flex-col gap-2 pt-2">
                  {card.points.map((point) => (
                    <span
                      key={point}
                      className="inline-flex items-center gap-2 font-mono text-[10px] tracking-[0.12em] uppercase text-structure-secondary"
                    >
                      <span className="h-[1px] w-2 bg-highlight" />
                      {point}
                    </span>
                  ))}
                </div>
              </article>
            ))}
          </div>

          <div className="mt-7 grid border border-border sm:grid-cols-2 xl:grid-cols-4">
            {trustBadges.map(([label, value], index) => (
              <div
                key={value}
                className={cn(
                  "border-r border-border px-4 py-4 last:border-r-0",
                  index > 1 && "border-t border-border xl:border-t-0",
                )}
              >
                <p className="font-mono text-[9.5px] tracking-[0.12em] uppercase text-muted-foreground">
                  {label}
                </p>
                <p className="mt-2 text-sm leading-6 text-foreground">{value}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="py-20" id="environments">
          <div className="mb-12">
            <p className="ops-kicker text-foreground">09 · Environments</p>
            <h2 className="mt-6 max-w-[9ch] text-[3.8rem] leading-[0.92] sm:text-[5rem]">
              Built for high-volume hiring environments.
            </h2>
            <p className="mt-6 max-w-[44ch] text-lg leading-8 text-structure-secondary">
              Shared pattern: many roles, many sites, many shifts, short
              time-to-start. Breathe is tuned for the operational rhythm of the
              frontline, not the office.
            </p>
          </div>

          <div className="grid border-y border-foreground lg:grid-cols-3">
            {useCases.map((useCase) => (
              <article
                key={useCase.title}
                className="flex flex-col border-r border-foreground last:border-r-0"
              >
                <div className="relative aspect-[4/3] overflow-hidden border-b border-foreground bg-secondary">
                  <Image
                    src={useCase.image}
                    alt={useCase.alt}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="flex flex-1 flex-col bg-background/78 px-6 py-7">
                  <div className="flex items-center justify-between gap-4">
                    <p className="font-mono text-[10px] tracking-[0.14em] uppercase text-muted-foreground">
                      {useCase.label}
                    </p>
                  </div>
                  <h3 className="mt-4 text-[2rem] leading-[0.98] tracking-[-0.03em]">
                    {useCase.title}
                  </h3>
                  <p className="mt-4 max-w-[31ch] text-[0.95rem] leading-7 text-structure-secondary">
                    {useCase.body}
                  </p>
                  <div className="mt-auto flex flex-wrap gap-x-4 gap-y-2 border-t border-border pt-5">
                    {useCase.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-2 font-mono text-[10px] tracking-[0.12em] uppercase text-structure-secondary"
                      >
                        <span className="size-[5px] bg-highlight" />
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>

      <section
        id="final-cta"
        className="relative mt-6 border-t border-foreground bg-foreground text-background"
      >
        <div className="absolute inset-x-0 top-0 h-px bg-highlight" />
        <div className="mx-auto grid max-w-[104rem] gap-12 px-4 py-20 sm:px-6 lg:grid-cols-[1.25fr_0.75fr] lg:px-8 lg:py-24">
          <div>
            <p className="ops-kicker text-highlight-soft">10 · Book a demo</p>
            <h2 className="mt-6 max-w-[8ch] text-[4rem] leading-[0.9] text-background sm:text-[5.8rem] lg:text-[7.4rem]">
              From application to{" "}
              <span className="text-highlight">ready-to-start.</span>
            </h2>
            <p className="mt-8 max-w-[36ch] text-lg leading-8 text-background/72">
              A walkthrough on your own ATS, your own roles, your own volume.
              You leave with a scoped picture of what Breathe would run and
              where recruiters would still step in.
            </p>
          </div>

          <div className="flex flex-col gap-6 lg:items-start lg:justify-end">
            <div className="flex w-full max-w-sm flex-col gap-3">
              <Link
                href="mailto:hello@breathe.work?subject=Breathe%20demo"
                className={cn(
                  buttonVariants({ size: "lg", variant: "secondary" }),
                  "h-12 rounded-none border-highlight bg-highlight px-5 font-mono text-[11px] tracking-[0.14em] uppercase text-highlight-foreground hover:bg-background hover:text-foreground",
                )}
              >
                Book a demo
                <ArrowRight className="size-4" />
              </Link>
              <Link
                href="#mechanism"
                className={cn(
                  buttonVariants({ size: "lg", variant: "outline" }),
                  "h-12 rounded-none border-background/70 bg-transparent px-5 font-mono text-[11px] tracking-[0.14em] uppercase text-background hover:bg-background hover:text-foreground",
                )}
              >
                See how it works
                <ArrowRight className="size-4" />
              </Link>
            </div>

            <div className="grid w-full max-w-xl border border-background/14 sm:grid-cols-2">
              {[
                ["Walk-through", "On your ATS and hiring flow"],
                ["Scope", "Application → ready-to-start"],
                ["Rollout", "Fast, on top of your stack"],
                ["For", "Heads of talent and ops"],
              ].map(([label, value], index) => (
                <div
                  key={label}
                  className={cn(
                    "border-r border-background/14 px-5 py-4 last:border-r-0",
                    index > 1 && "border-t border-background/14",
                  )}
                >
                  <p className="font-mono text-[10px] tracking-[0.12em] uppercase text-highlight-soft">
                    {label}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-background/82">
                    {value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
