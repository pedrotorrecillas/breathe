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
        <header className="brand-surface rounded-[1rem] px-4 py-3 backdrop-blur">
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
                          ? "border-primary bg-primary text-primary-foreground hover:border-structure-secondary hover:bg-structure-secondary shadow-[0_14px_28px_rgba(23,23,23,0.16)]"
                          : "border-border bg-card/84 text-muted-foreground hover:border-foreground/24 hover:bg-card hover:text-foreground",
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
                      "border-border bg-muted/72 text-muted-foreground cursor-not-allowed rounded-[0.55rem] border-dashed px-3.5",
                    )}
                  >
                    <span className="flex items-center gap-2">
                      <span>{item.label}</span>
                      <span className="text-muted-foreground text-[10px] tracking-[0.14em] uppercase">
                        Coming soon
                      </span>
                    </span>
                  </span>
                );
              })}
            </nav>

            <div className="flex flex-wrap items-center justify-between gap-3 lg:justify-end">
              <div className="min-w-0">
                <p className="text-muted-foreground text-[11px] font-medium tracking-[0.16em] uppercase">
                  {viewer.companyName}
                </p>
                <div className="text-muted-foreground mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
                  <span className="text-foreground font-medium">
                    {viewer.name}
                  </span>
                  <span className="text-border hidden sm:inline">/</span>
                  <span className="truncate">{viewer.email}</span>
                </div>
              </div>

              <form action="/auth/logout" method="post">
                <button
                  type="submit"
                  className={cn(
                    buttonVariants({ variant: "outline", size: "sm" }),
                    "border-border bg-card/84 text-muted-foreground hover:border-foreground/24 hover:bg-card hover:text-foreground rounded-[0.55rem] px-3.5",
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
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(94,126,255,0.24),transparent)]" />
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
