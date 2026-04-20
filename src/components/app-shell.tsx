"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { type ReactNode } from "react";

import { buttonVariants } from "@/components/ui/button-variants";
import { navigationItems } from "@/lib/navigation";
import { cn } from "@/lib/utils";

type AppShellProps = {
  children: ReactNode;
  viewer: {
    companyName: string;
    email: string;
    name: string;
  };
};

export function AppShell({ children, viewer }: AppShellProps) {
  const pathname = usePathname();

  return (
    <div className="bg-ops-grid min-h-screen bg-transparent px-4 py-4 lg:px-6">
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-[96rem] flex-col gap-4">
        <header className="rounded-[1rem] border border-slate-200/80 bg-white/88 px-4 py-3 shadow-[0_10px_26px_rgba(15,23,42,0.045)] backdrop-blur">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
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

            <div className="flex flex-wrap items-center justify-between gap-3 lg:justify-end">
              <div className="min-w-0">
                <p className="text-[11px] font-medium tracking-[0.16em] text-slate-500 uppercase">
                  {viewer.companyName}
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-slate-600">
                  <span className="font-medium text-slate-950">{viewer.name}</span>
                  <span className="hidden text-slate-300 sm:inline">/</span>
                  <span className="truncate">{viewer.email}</span>
                </div>
              </div>

              <form action="/auth/logout" method="post">
                <button
                  type="submit"
                  className={cn(
                    buttonVariants({ variant: "outline", size: "sm" }),
                    "rounded-[0.55rem] border-slate-300/90 bg-white/80 px-3.5 text-slate-700 hover:border-slate-400 hover:bg-white",
                  )}
                >
                  Log out
                </button>
              </form>
            </div>
          </div>
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
