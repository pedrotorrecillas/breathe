"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { type ReactNode } from "react";

import {
  Activity,
  LayoutDashboard,
  Radar,
  Sparkles,
  Workflow,
} from "lucide-react";

import { buttonVariants } from "@/components/ui/button-variants";
import { navigationItems } from "@/lib/navigation";
import { cn } from "@/lib/utils";

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();

  return (
    <div className="bg-ops-grid min-h-screen bg-transparent px-4 py-4 lg:px-6">
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-[90rem] flex-col gap-5">
        <header className="ops-shell overflow-hidden rounded-[2rem] px-5 py-5">
          <div className="flex flex-col gap-5 border-b border-slate-200/80 pb-5 xl:flex-row xl:items-start xl:justify-between">
            <div className="flex items-start gap-4">
              <div className="rounded-[1.25rem] border border-white/70 bg-[linear-gradient(180deg,rgba(18,25,39,1),rgba(34,48,71,0.96))] p-3 text-white shadow-[0_20px_40px_rgba(15,23,42,0.2)]">
                <LayoutDashboard className="size-5" aria-hidden="true" />
              </div>
              <div className="space-y-2">
                <p className="ops-kicker text-cyan-900">
                  Luminous Ops / Recruiter shell
                </p>
                <h1 className="text-lg font-semibold text-slate-950">
                  Hiring infrastructure control plane
                </h1>
                <p className="max-w-2xl text-sm leading-6 text-slate-600">
                  Jobs is the live operating surface. The shell carries the
                  system frame now so future recruiter workflows can plug into
                  one consistent visual layer.
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 xl:min-w-[26rem]">
              <div className="rounded-[1.4rem] border border-slate-200/80 bg-white/70 px-4 py-3">
                <p className="ops-kicker text-slate-500">Throughput</p>
                <div className="mt-3 flex items-center gap-3">
                  <Workflow
                    className="size-4 text-cyan-700"
                    aria-hidden="true"
                  />
                  <div>
                    <p className="text-base font-semibold text-slate-950">
                      Applicant flow live
                    </p>
                    <p className="text-xs text-slate-500">
                      Queue-first routing
                    </p>
                  </div>
                </div>
              </div>
              <div className="rounded-[1.4rem] border border-slate-200/80 bg-white/70 px-4 py-3">
                <p className="ops-kicker text-slate-500">Signal</p>
                <div className="mt-3 flex items-center gap-3">
                  <Radar className="size-4 text-cyan-700" aria-hidden="true" />
                  <div>
                    <p className="text-base font-semibold text-slate-950">
                      Scoring system
                    </p>
                    <p className="text-xs text-slate-500">
                      Human review intact
                    </p>
                  </div>
                </div>
              </div>
              <div className="rounded-[1.4rem] border border-slate-200/80 bg-[linear-gradient(180deg,rgba(19,27,41,0.98),rgba(29,41,60,0.96))] px-4 py-3 text-white shadow-[0_18px_40px_rgba(15,23,42,0.16)]">
                <p className="ops-kicker text-cyan-200">System</p>
                <div className="mt-3 flex items-center gap-3">
                  <Activity
                    className="size-4 text-cyan-300"
                    aria-hidden="true"
                  />
                  <div>
                    <p className="text-base font-semibold">
                      Voice runtime ready
                    </p>
                    <p className="text-xs text-slate-300">
                      Production-shaped shell
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4 pt-5 xl:flex-row xl:items-center xl:justify-between">
            <nav
              aria-label="Recruiter primary navigation"
              className="flex flex-wrap items-center gap-2"
            >
              {navigationItems.map((item) => {
                const isActive =
                  item.href === "/jobs"
                    ? pathname === item.href || pathname.startsWith("/jobs/")
                    : pathname === item.href;

                if (item.enabled) {
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      aria-current={isActive ? "page" : undefined}
                      className={cn(
                        buttonVariants({
                          variant: isActive ? "default" : "outline",
                          size: "sm",
                        }),
                        "rounded-full px-4",
                        isActive
                          ? "border-slate-950 bg-slate-950 text-white shadow-[0_14px_28px_rgba(15,23,42,0.16)] hover:bg-slate-800"
                          : "border-slate-300/90 bg-white/75 text-slate-700 hover:border-slate-400 hover:bg-white",
                      )}
                    >
                      {item.label}
                    </Link>
                  );
                }

                return (
                  <span
                    key={item.href}
                    aria-disabled="true"
                    className={cn(
                      buttonVariants({ variant: "outline", size: "sm" }),
                      "cursor-not-allowed rounded-full border-dashed border-slate-300 bg-slate-100/70 px-4 text-slate-400",
                    )}
                  >
                    <span className="flex items-center gap-2">
                      <span>{item.label}</span>
                      <span className="ops-kicker text-slate-400">later</span>
                    </span>
                  </span>
                );
              })}
            </nav>

            <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
              <span className="inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-cyan-50/90 px-3 py-1 text-cyan-950">
                <Sparkles className="size-3.5" aria-hidden="true" />
                <span className="ops-kicker text-cyan-900">Jobs MVP</span>
              </span>
              <span className="ops-kicker text-slate-400">Breath / Clara</span>
            </div>
          </div>
        </header>

        <main className="ops-shell bg-ops-canvas flex min-h-0 flex-1 flex-col overflow-hidden rounded-[2rem]">
          <div className="flex flex-col gap-4 border-b border-slate-200/80 px-6 py-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-2 rounded-full border border-cyan-200/80 bg-white/80 px-3 py-1 font-mono text-[11px] tracking-[0.22em] text-cyan-950 uppercase">
                <Sparkles className="size-3.5" aria-hidden="true" />
                Recruiter surface
              </span>
              <span className="text-sm text-slate-500">
                Operational UI for high-volume hiring decisions
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-2.5 w-2.5 rounded-full bg-cyan-500 shadow-[0_0_0_6px_rgba(6,182,212,0.12)]" />
              <span className="ops-kicker text-slate-500">
                System frame active
              </span>
            </div>
          </div>

          <div className="relative min-h-0 flex-1">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(93,123,156,0.3),transparent)]" />
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
