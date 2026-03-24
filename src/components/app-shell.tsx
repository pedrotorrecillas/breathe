"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { type ReactNode } from "react";

import { LayoutDashboard, Sparkles } from "lucide-react";

import { buttonVariants } from "@/components/ui/button-variants";
import { navigationItems } from "@/lib/navigation";
import { cn } from "@/lib/utils";

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-transparent px-4 py-4 lg:px-6">
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-7xl flex-col gap-5">
        <header className="rounded-[2rem] border border-white/70 bg-white/82 px-5 py-4 shadow-[0_24px_70px_rgba(15,23,42,0.08)] backdrop-blur">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex items-start gap-4">
              <div className="rounded-[1.25rem] bg-slate-950 p-3 text-white shadow-[0_14px_30px_rgba(15,23,42,0.18)]">
                <LayoutDashboard className="size-5" />
              </div>
              <div className="space-y-1">
                <p className="font-mono text-xs tracking-[0.24em] text-sky-800 uppercase">
                  Clara recruiter shell
                </p>
                <h1 className="text-lg font-semibold text-slate-950">
                  Brand placeholder and workspace navigation
                </h1>
                <p className="max-w-2xl text-sm leading-6 text-slate-600">
                  Jobs is the only live MVP area for now. The reference
                  navigation stays visible so the broader product structure is
                  already established.
                </p>
              </div>
            </div>

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
                        isActive &&
                          "bg-slate-950 text-white hover:bg-slate-800",
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
                      "cursor-not-allowed rounded-full px-4 text-slate-400",
                    )}
                  >
                    <span className="flex items-center gap-2">
                      <span>{item.label}</span>
                      <span className="text-[10px] tracking-[0.2em] text-slate-400 uppercase">
                        later
                      </span>
                    </span>
                  </span>
                );
              })}
            </nav>
          </div>
        </header>

        <main className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[2rem] border border-slate-200/70 bg-white/78 shadow-[0_28px_80px_rgba(15,23,42,0.08)] backdrop-blur">
          <div className="flex items-center justify-between border-b border-slate-200/80 px-6 py-4">
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 font-mono text-[11px] tracking-[0.22em] text-sky-900 uppercase">
                <Sparkles className="size-3.5" />
                Jobs MVP
              </span>
              <span className="text-sm text-slate-500">
                Desktop-first recruiter workspace
              </span>
            </div>
            <span className="font-mono text-xs tracking-[0.22em] text-slate-400 uppercase">
              Clara / Breath
            </span>
          </div>

          <div className="min-h-0 flex-1">{children}</div>
        </main>
      </div>
    </div>
  );
}
