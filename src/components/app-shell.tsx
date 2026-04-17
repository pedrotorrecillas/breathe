"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { type ReactNode } from "react";

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
        <header className="ops-shell overflow-hidden rounded-[1rem] px-5 py-4">
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
                      "rounded-[0.55rem] px-3.5",
                      isActive
                        ? "border-slate-950 bg-slate-950 text-white shadow-[0_14px_28px_rgba(15,23,42,0.16)] hover:bg-slate-800"
                        : "border-slate-300/90 bg-white/80 text-slate-700 hover:border-slate-400 hover:bg-white",
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
                    "cursor-not-allowed rounded-[0.55rem] border-dashed border-slate-300 bg-slate-100/70 px-3.5 text-slate-400",
                  )}
                >
                  <span className="flex items-center gap-2">
                    <span>{item.label}</span>
                    <span className="text-[10px] uppercase tracking-[0.14em] text-slate-400">
                      Coming soon
                    </span>
                  </span>
                </span>
              );
            })}
          </nav>
        </header>

        <main className="ops-shell bg-ops-canvas flex min-h-0 flex-1 flex-col overflow-hidden rounded-[1rem]">
          <div className="relative min-h-0 flex-1">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(93,123,156,0.24),transparent)]" />
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
