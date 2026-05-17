import Image from "next/image";
import Link from "next/link";

import {
  ArrowRight,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  CheckCircle2,
  CircleAlert,
  CircleDashed,
  ClipboardCheck,
  DatabaseZap,
  FileCheck2,
  Headphones,
  HeartPulse,
  Inbox,
  MessageSquare,
  PackageCheck,
  ShieldCheck,
  Store,
  UserRoundCheck,
  Workflow,
} from "lucide-react";

import { cn } from "@/lib/utils";

const demoHref = "mailto:hello@nacar.ai?subject=Nacar%20demo";

const navItems = [
  { label: "Product", href: "#product" },
  { label: "Stack", href: "#stack-fit" },
  { label: "Industries", href: "#industries" },
  { label: "Method", href: "#problem" },
] as const;

const overlayCards = [
  { label: "Candidate contacted", icon: MessageSquare },
  { label: "Interview scheduled", icon: CalendarDays },
  { label: "Recruiter review needed", icon: CircleAlert },
] as const;

const frictionPoints = [
  "Qualified candidates wait too long for first contact and screening.",
  "Recruiters lose hours coordinating slots, reminders, and reschedules.",
  "Document collection and verification sit in manual queues.",
  "ATS updates happen late, creating blind spots across sites and shifts.",
] as const;

const stages = [
  "Applied",
  "Contacted",
  "Qualified",
  "Scheduled",
  "Review",
  "Docs",
  "Ready",
] as const;

const candidates = [
  {
    name: "Maya R.",
    role: "Retail associate",
    context: "Madrid · Weekend shift",
    stage: "Scheduled",
    sync: "Synced",
  },
  {
    name: "Daniel K.",
    role: "Forklift operator",
    context: "Valencia · Night shift",
    stage: "Review needed",
    sync: "Pending review",
  },
  {
    name: "Sara M.",
    role: "Contact center agent",
    context: "Remote · Training cohort",
    stage: "Docs",
    sync: "Synced",
  },
] as const;

const automationBlocks = [
  ["Screening", "Running"],
  ["Availability", "Running"],
  ["Scheduling", "Queued"],
  ["Docs", "Waiting"],
] as const;

const actionLog = [
  "Sent WhatsApp screening link to 18 new applicants.",
  "Matched Maya R. to Saturday interview slot.",
  "Flagged Daniel K. for forklift licence review.",
  "Wrote stage changes back to ATS of record.",
] as const;

const stackLayers = [
  {
    label: "Existing systems",
    title: "ATS, calendars, comms, HRIS",
    body: "Nacar reads and writes through the tools already running your recruiting operation.",
    icon: DatabaseZap,
  },
  {
    label: "Operating layer",
    title: "Nacar orchestration",
    body: "Agent workflows move candidates across stages, trigger checks, and escalate exceptions.",
    icon: Workflow,
    active: true,
  },
  {
    label: "Recruiter control",
    title: "Judgment stays with the team",
    body: "Recruiters approve edge cases with the candidate context already assembled.",
    icon: ShieldCheck,
  },
] as const;

const industries = [
  {
    label: "Retail",
    title: "Seasonal stores and storefront turnover",
    body: "Move applicants through screening, availability, and interview booking before the hiring window closes.",
    image: "/landing/img-2-loading-dock.jpg",
    icon: Store,
  },
  {
    label: "Logistics",
    title: "Warehouse ramp-up and shift qualification",
    body: "Coordinate high applicant volume across sites, shifts, licences, and start-date constraints.",
    image: "/landing/img-1-warehouse-aisle.jpg",
    icon: PackageCheck,
  },
  {
    label: "Hospitality",
    title: "Multi-location scheduling constraints",
    body: "Handle short-response cycles, availability checks, and manager review without inbox chasing.",
    image: "/landing/img-3-kitchen-line.jpg",
    icon: Building2,
  },
  {
    label: "Healthcare operations",
    title: "Admin desks and clinical support staffing",
    body: "Collect credentials, route exceptions, and keep documentation moving with auditability.",
    image: "/landing/img-4-production-line.jpg",
    icon: HeartPulse,
  },
  {
    label: "Contact centers",
    title: "Class-based hiring and training cohorts",
    body: "Batch candidates into screening, interview, and onboarding flows without manual spreadsheet control.",
    image: null,
    icon: Headphones,
  },
  {
    label: "Staffing agencies",
    title: "Rapid deployment to client sites",
    body: "Keep candidate status, client requirements, and recruiter review aligned across many requisitions.",
    image: null,
    icon: BriefcaseBusiness,
  },
] as const;

function NacarLogo({ inverse = false }: { inverse?: boolean }) {
  return (
    <span className="flex items-center gap-2.5" aria-label="Nacar">
      <span
        className={cn(
          "flex h-8 w-6 items-center justify-center",
          inverse && "brightness-0 invert",
        )}
      >
        <Image
          src="/brand/nacar-mark.svg"
          alt=""
          width={24}
          height={42}
          priority
          className="h-8 w-auto"
        />
      </span>
      <span className="brand-wordmark text-[1.35rem] leading-none font-medium lowercase">
        nacar
      </span>
    </span>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-muted-foreground font-mono text-[11px] font-medium tracking-[0.14em] uppercase">
      {children}
    </p>
  );
}

function PrimaryButton({
  href,
  children,
  inverse = false,
}: {
  href: string;
  children: React.ReactNode;
  inverse?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "focus-visible:ring-ring/30 inline-flex h-11 items-center justify-center gap-2 border px-5 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none",
        inverse
          ? "border-background bg-background text-foreground hover:bg-card"
          : "border-primary bg-primary text-primary-foreground hover:bg-highlight",
      )}
    >
      {children}
      <ArrowRight className="size-4" aria-hidden="true" />
    </Link>
  );
}

export default function Home() {
  return (
    <main
      id="top"
      className="brand-stage nacar-paper text-foreground min-h-screen"
    >
      <header className="border-border/80 bg-background/88 fixed inset-x-0 top-0 z-50 border-b backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-[118rem] items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="#top" className="shrink-0">
            <NacarLogo />
          </Link>

          <nav
            className="hidden items-center gap-8 md:flex"
            aria-label="Main navigation"
          >
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-muted-foreground hover:text-foreground font-mono text-[11px] font-medium tracking-[0.14em] uppercase"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <PrimaryButton href={demoHref}>Book a demo</PrimaryButton>
        </div>
      </header>

      <section className="bg-foreground text-background relative min-h-[100svh] overflow-hidden pt-16">
        <div className="absolute inset-0 top-16">
          <Image
            src="/landing/img-4-production-line.jpg"
            alt="High-volume operational workplace with multiple shift workers"
            fill
            priority
            sizes="100vw"
            className="nacar-media-treatment object-cover"
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(23,23,19,0.78)_0%,rgba(23,23,19,0.48)_38%,rgba(23,23,19,0.12)_68%,rgba(23,23,19,0.02)_100%)]" />
          <div className="absolute inset-x-0 bottom-0 h-40 bg-[linear-gradient(180deg,transparent,rgba(23,23,19,0.72))]" />
        </div>

        <div className="relative z-10 mx-auto grid min-h-[calc(100svh-4rem)] max-w-[118rem] grid-cols-1 items-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-12 lg:px-8">
          <div className="max-w-[42rem] lg:col-span-6">
            <Label>AI candidate operations</Label>
            <h1 className="text-background mt-5 text-[3.5rem] leading-[0.95] font-medium sm:text-[5.4rem] lg:text-[6.8rem]">
              AI agents for faster high-volume hiring
            </h1>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <PrimaryButton href={demoHref} inverse>
                Book a demo
              </PrimaryButton>
              <Link
                href="#product"
                className="border-background/45 bg-background/8 text-background hover:bg-background/15 focus-visible:ring-background/30 inline-flex h-11 items-center justify-center gap-2 border px-5 text-sm font-medium backdrop-blur transition-colors focus-visible:ring-2 focus-visible:outline-none"
              >
                See how it works
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </div>
          </div>

          <div className="flex flex-col items-start gap-3 lg:col-span-5 lg:col-start-8 lg:items-end">
            {overlayCards.map(({ label, icon: Icon }, index) => (
              <div
                key={label}
                className={cn(
                  "border-background/20 bg-background/18 text-background flex w-full max-w-[20rem] items-center gap-3 border px-4 py-3 shadow-[0_18px_46px_rgba(0,0,0,0.18)] backdrop-blur-md",
                  index === 1 && "lg:mr-12",
                )}
              >
                <Icon
                  className="text-highlight-soft size-4"
                  aria-hidden="true"
                />
                <span className="text-sm font-medium">{label}</span>
                {index === 0 && (
                  <span className="bg-highlight-soft ml-auto size-2" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-border bg-background border-b">
        <div className="mx-auto grid max-w-[118rem] gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1.2fr_0.8fr] lg:px-8">
          <p className="text-structure-secondary max-w-[48rem] text-xl leading-8 sm:text-2xl sm:leading-9">
            Automate the work between application and hire, so recruiters can
            move more qualified candidates before they go cold.
          </p>
          <div className="border-border border-l pl-6">
            <Label>Operational proof</Label>
            <p className="mt-3 max-w-[32rem] text-2xl leading-8">
              From a team that automated 300,000 interviews per month.
            </p>
          </div>
        </div>
      </section>

      <section id="problem" className="border-border bg-card/70 border-b">
        <div className="mx-auto grid max-w-[118rem] gap-10 px-4 py-20 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:px-8">
          <div>
            <Label>Where volume breaks</Label>
            <h2 className="mt-5 max-w-[34rem] text-[3rem] leading-none font-medium sm:text-[4.4rem]">
              Delays cause candidate drop-off.
            </h2>
            <p className="text-muted-foreground mt-6 max-w-[34rem] text-base leading-7">
              In high-volume hiring, the expensive failure is not a lack of
              applicants. It is losing qualified people while teams manually
              coordinate the next step.
            </p>
          </div>

          <div className="border-border border-t">
            {frictionPoints.map((point, index) => (
              <div
                key={point}
                className="border-border grid grid-cols-[4rem_1fr] border-b py-5"
              >
                <span className="text-muted-foreground font-mono text-[11px] tracking-[0.14em] uppercase">
                  0{index + 1}
                </span>
                <p className="text-lg leading-7">{point}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="product" className="border-border bg-background border-b">
        <div className="mx-auto max-w-[118rem] px-4 py-24 sm:px-6 lg:px-8">
          <div className="mx-auto mb-12 max-w-3xl text-center">
            <Label>The operating surface</Label>
            <h2 className="mt-5 text-[3rem] leading-none font-medium sm:text-[4.8rem]">
              The workflow moves itself.
            </h2>
            <p className="text-muted-foreground mt-5 text-base leading-7">
              Nacar maps each candidate journey, activates the right workflow
              blocks, and writes outcomes back to your system of record.
            </p>
          </div>

          <div className="border-foreground bg-card shadow-shell overflow-hidden border">
            <div className="border-border bg-background/70 flex flex-col gap-4 border-b px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
                <NacarLogo />
                <span className="bg-border h-5 w-px" />
                <span className="text-muted-foreground font-mono text-[11px] tracking-[0.14em] uppercase">
                  General retail hire · Madrid · 42 open shifts
                </span>
              </div>
              <div className="text-muted-foreground flex items-center gap-2 text-sm">
                <CheckCircle2
                  className="text-highlight size-4"
                  aria-hidden="true"
                />
                ATS sync active
              </div>
            </div>

            <div className="grid min-h-[42rem] lg:grid-cols-[1.1fr_0.78fr_0.62fr]">
              <div className="border-border border-b p-5 lg:border-r lg:border-b-0">
                <div className="mb-6 grid gap-4 sm:grid-cols-3">
                  {[
                    ["Role", "Retail associate"],
                    ["Site", "Madrid Norte"],
                    ["Shift", "Weekend close"],
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      className="border-border bg-background/60 border p-4"
                    >
                      <p className="text-muted-foreground font-mono text-[10px] tracking-[0.14em] uppercase">
                        {label}
                      </p>
                      <p className="mt-2 text-sm font-medium">{value}</p>
                    </div>
                  ))}
                </div>

                <div className="relative mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-7">
                  {stages.map((stage, index) => (
                    <div
                      key={stage}
                      className={cn(
                        "border-border bg-background relative border px-3 py-4",
                        index < 4 && "border-highlight/50 bg-highlight/5",
                        stage === "Review" &&
                          "border-foreground bg-foreground text-background",
                      )}
                    >
                      <span className="font-mono text-[10px] tracking-[0.14em] uppercase opacity-60">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <p className="mt-3 text-sm font-medium">{stage}</p>
                    </div>
                  ))}
                </div>

                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <Label>Candidate queue</Label>
                    <span className="text-muted-foreground text-sm">
                      Live intake
                    </span>
                  </div>
                  <div className="divide-border border-border divide-y border">
                    {candidates.map((candidate) => (
                      <div
                        key={candidate.name}
                        className="bg-card grid gap-3 px-4 py-4 sm:grid-cols-[1fr_auto]"
                      >
                        <div>
                          <p className="font-medium">{candidate.name}</p>
                          <p className="text-muted-foreground mt-1 text-sm">
                            {candidate.role} · {candidate.context}
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                          <span className="border-border bg-background text-muted-foreground border px-2 py-1 font-mono text-[10px] tracking-[0.12em] uppercase">
                            {candidate.stage}
                          </span>
                          <span
                            className={cn(
                              "border px-2 py-1 font-mono text-[10px] tracking-[0.12em] uppercase",
                              candidate.sync === "Synced"
                                ? "border-highlight/40 text-highlight"
                                : "border-foreground/30 text-foreground",
                            )}
                          >
                            {candidate.sync}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="border-border border-b p-5 lg:border-r lg:border-b-0">
                <Label>Automation blocks running</Label>
                <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                  {automationBlocks.map(([label, state]) => (
                    <div
                      key={label}
                      className="border-border bg-background border p-4"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <p className="font-medium">{label}</p>
                        {state === "Running" ? (
                          <CheckCircle2
                            className="text-highlight size-4"
                            aria-hidden="true"
                          />
                        ) : (
                          <CircleDashed
                            className="text-muted-foreground size-4"
                            aria-hidden="true"
                          />
                        )}
                      </div>
                      <p className="text-muted-foreground mt-3 font-mono text-[10px] tracking-[0.14em] uppercase">
                        {state}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="border-foreground bg-foreground text-background mt-6 border p-5">
                  <p className="text-highlight-soft font-mono text-[10px] tracking-[0.14em] uppercase">
                    Next best action
                  </p>
                  <p className="mt-4 text-2xl leading-7">
                    Ask recruiter to confirm Daniel K. licence exception.
                  </p>
                  <p className="text-background/72 mt-4 text-sm leading-6">
                    The candidate meets availability and location criteria, but
                    one credential needs human approval before interview.
                  </p>
                </div>

                <div className="mt-6">
                  <Label>Action log</Label>
                  <div className="mt-4 space-y-4">
                    {actionLog.map((item, index) => (
                      <div
                        key={item}
                        className="grid grid-cols-[3.5rem_1fr] gap-3"
                      >
                        <span className="text-muted-foreground font-mono text-[10px] tracking-[0.12em] uppercase">
                          14:{22 - index * 3}
                        </span>
                        <p className="text-sm leading-6">{item}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <aside className="bg-background/60 p-5">
                <Label>Recruiter review</Label>
                <div className="border-border bg-card mt-5 border p-5">
                  <div className="flex items-center gap-3">
                    <UserRoundCheck
                      className="text-highlight size-5"
                      aria-hidden="true"
                    />
                    <div>
                      <p className="font-medium">Daniel K.</p>
                      <p className="text-muted-foreground text-sm">
                        Forklift operator
                      </p>
                    </div>
                  </div>
                  <div className="mt-5 space-y-3 text-sm">
                    <p className="flex items-center gap-2">
                      <CheckCircle2
                        className="text-highlight size-4"
                        aria-hidden="true"
                      />
                      Availability matched
                    </p>
                    <p className="flex items-center gap-2">
                      <CheckCircle2
                        className="text-highlight size-4"
                        aria-hidden="true"
                      />
                      Location matched
                    </p>
                    <p className="flex items-center gap-2">
                      <CircleAlert
                        className="text-foreground size-4"
                        aria-hidden="true"
                      />
                      Licence expiry needs review
                    </p>
                  </div>
                  <div className="mt-6 grid gap-2">
                    <button className="border-primary bg-primary text-primary-foreground h-10 border px-3 text-sm font-medium">
                      Approve and schedule
                    </button>
                    <button className="border-border bg-background h-10 border px-3 text-sm font-medium">
                      Request document
                    </button>
                  </div>
                </div>

                <div className="border-border bg-card mt-5 border p-5">
                  <Label>ATS write-back</Label>
                  <div className="text-muted-foreground mt-4 space-y-3 text-sm">
                    <p className="flex items-center gap-2">
                      <Inbox className="size-4" aria-hidden="true" />
                      Candidate status
                    </p>
                    <p className="flex items-center gap-2">
                      <ClipboardCheck className="size-4" aria-hidden="true" />
                      Review reason
                    </p>
                    <p className="flex items-center gap-2">
                      <FileCheck2 className="size-4" aria-hidden="true" />
                      Document request
                    </p>
                  </div>
                </div>
              </aside>
            </div>
          </div>
        </div>
      </section>

      <section id="stack-fit" className="border-border bg-card/70 border-b">
        <div className="mx-auto grid max-w-[118rem] gap-12 px-4 py-24 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:px-8">
          <div>
            <Label>Stack fit</Label>
            <h2 className="mt-5 max-w-[36rem] text-[3rem] leading-none font-medium sm:text-[4.4rem]">
              Automation on top of your ATS, not around it.
            </h2>
            <p className="text-muted-foreground mt-6 max-w-[34rem] text-base leading-7">
              Nacar is not an ATS replacement. It is the operational layer that
              moves the work between stages while the system of record remains
              intact.
            </p>
          </div>

          <div className="space-y-4">
            {stackLayers.map((layer) => {
              const active = "active" in layer && layer.active === true;
              const Icon = layer.icon;

              return (
                <article
                  key={layer.title}
                  className={cn(
                    "grid gap-5 border p-6 sm:grid-cols-[3rem_1fr]",
                    active
                      ? "border-foreground bg-foreground text-background"
                      : "border-border bg-background",
                  )}
                >
                  <Icon
                    className={cn(
                      "size-6",
                      active ? "text-highlight-soft" : "text-highlight",
                    )}
                    aria-hidden="true"
                  />
                  <div>
                    <p
                      className={cn(
                        "font-mono text-[10px] tracking-[0.14em] uppercase",
                        active
                          ? "text-highlight-soft"
                          : "text-muted-foreground",
                      )}
                    >
                      {layer.label}
                    </p>
                    <h3 className="mt-2 text-3xl leading-none font-medium">
                      {layer.title}
                    </h3>
                    <p
                      className={cn(
                        "mt-3 max-w-[46rem] text-sm leading-6",
                        active ? "text-background/72" : "text-muted-foreground",
                      )}
                    >
                      {layer.body}
                    </p>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section id="industries" className="border-border bg-background border-b">
        <div className="mx-auto max-w-[118rem] px-4 py-24 sm:px-6 lg:px-8">
          <div className="mb-12 flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div>
              <Label>Use cases</Label>
              <h2 className="mt-5 max-w-[42rem] text-[3rem] leading-none font-medium sm:text-[4.4rem]">
                Built for high-volume hiring environments.
              </h2>
            </div>
            <p className="text-muted-foreground max-w-[30rem] text-base leading-7">
              Different environments, same pressure: many applicants, tight
              start windows, and too many handoffs across teams and tools.
            </p>
          </div>

          <div className="border-border bg-border grid gap-px overflow-hidden border md:grid-cols-2 xl:grid-cols-3">
            {industries.map(({ label, title, body, image, icon: Icon }) => (
              <article key={label} className="bg-card">
                <div className="bg-secondary relative aspect-[16/9] overflow-hidden">
                  {image ? (
                    <>
                      <Image
                        src={image}
                        alt=""
                        fill
                        loading="eager"
                        sizes="(min-width: 1280px) 33vw, (min-width: 768px) 50vw, 100vw"
                        className="nacar-media-treatment object-cover"
                      />
                      <div className="bg-foreground/8 absolute inset-0" />
                    </>
                  ) : (
                    <div className="flex h-full items-center justify-center bg-[linear-gradient(135deg,rgba(255,253,248,0.55),rgba(216,209,195,0.78))]">
                      <Icon
                        className="text-highlight/70 size-10"
                        aria-hidden="true"
                      />
                    </div>
                  )}
                </div>
                <div className="p-6">
                  <div className="mb-5 flex items-center justify-between">
                    <Label>{label}</Label>
                    <Icon
                      className="text-highlight size-5"
                      aria-hidden="true"
                    />
                  </div>
                  <h3 className="text-3xl leading-none font-medium">{title}</h3>
                  <p className="text-muted-foreground mt-4 text-sm leading-6">
                    {body}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="final-cta" className="bg-foreground text-background">
        <div className="mx-auto grid max-w-[118rem] gap-10 px-4 py-20 sm:px-6 lg:grid-cols-[1fr_auto] lg:items-center lg:px-8">
          <div>
            <Label>Start with one hiring flow</Label>
            <h2 className="text-background mt-5 max-w-[48rem] text-[3rem] leading-none font-medium sm:text-[4.6rem]">
              Move high-volume hiring forward.
            </h2>
            <p className="text-background/72 mt-5 max-w-[36rem] text-base leading-7">
              Run candidate operations across roles, sites, and shifts without
              adding recruiter load.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
            <PrimaryButton href={demoHref} inverse>
              Book a demo
            </PrimaryButton>
            <Link
              href="#product"
              className="border-background/35 text-background hover:bg-background/10 inline-flex h-11 items-center justify-center gap-2 border px-5 text-sm font-medium transition-colors"
            >
              See product surface
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      <footer className="bg-background">
        <div className="mx-auto grid max-w-[118rem] gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1fr_auto] lg:px-8">
          <div>
            <NacarLogo />
            <p className="text-muted-foreground mt-4 max-w-[22rem] text-sm leading-6">
              Automating the operational complexity of high-volume hiring.
            </p>
          </div>
          <nav className="text-muted-foreground grid grid-cols-2 gap-x-12 gap-y-3 text-sm sm:grid-cols-4">
            <Link href="#product" className="hover:text-foreground">
              Product
            </Link>
            <Link href="#industries" className="hover:text-foreground">
              Industries
            </Link>
            <Link href="/privacy" className="hover:text-foreground">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-foreground">
              Terms of Service
            </Link>
          </nav>
        </div>
        <div className="border-border border-t">
          <div className="text-muted-foreground mx-auto flex max-w-[118rem] flex-col gap-2 px-4 py-5 text-xs sm:px-6 md:flex-row md:justify-between lg:px-8">
            <span>© 2026 Nacar Intelligence. All rights reserved.</span>
            <span>Built for in-house and staffing high-volume teams.</span>
          </div>
        </div>
      </footer>
    </main>
  );
}
