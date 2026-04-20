import type { ReactNode } from "react";

import {
  AlertTriangle,
  Inbox,
  LoaderCircle,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";

type SharedStateShellProps = {
  eyebrow: string;
  title: string;
  description: string;
  icon: LucideIcon;
  tone: "loading" | "empty" | "error";
  children?: ReactNode;
};

function SharedStateShell({
  eyebrow,
  title,
  description,
  icon: Icon,
  tone,
  children,
}: SharedStateShellProps) {
  const toneStyles = {
    loading: {
      panel: "border-highlight-soft/55 bg-highlight-soft/14",
      icon: "bg-highlight-soft/28 text-highlight",
      eyebrow: "text-highlight",
    },
    empty: {
      panel: "border-border bg-card/90",
      icon: "bg-secondary text-foreground",
      eyebrow: "text-muted-foreground",
    },
    error: {
      panel: "border-destructive/24 bg-destructive/6",
      icon: "bg-destructive/12 text-destructive",
      eyebrow: "text-destructive",
    },
  } as const;

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[1rem] border p-4 shadow-[0_12px_28px_rgba(23,23,23,0.05)] md:p-5",
        toneStyles[tone].panel,
      )}
    >
      <div className="flex items-start gap-4">
        <div className={cn("rounded-[0.95rem] p-2.5", toneStyles[tone].icon)}>
          <Icon
            className={cn("size-5", tone === "loading" && "animate-spin")}
            aria-hidden="true"
          />
        </div>
        <div className="min-w-0 flex-1">
          <p
            className={cn(
              "font-mono text-[11px] tracking-[0.22em] uppercase",
              toneStyles[tone].eyebrow,
            )}
          >
            {eyebrow}
          </p>
          <h3 className="text-foreground mt-2 text-lg font-semibold tracking-tight">
            {title}
          </h3>
          <p className="text-muted-foreground mt-2 max-w-2xl text-sm leading-6">
            {description}
          </p>
          {children ? <div className="mt-4">{children}</div> : null}
        </div>
      </div>
    </div>
  );
}

type LoadingStateProps = {
  title: string;
  description: string;
  eyebrow?: string;
  rows?: number;
};

export function LoadingState({
  title,
  description,
  eyebrow = "Loading",
  rows = 3,
}: LoadingStateProps) {
  return (
    <SharedStateShell
      eyebrow={eyebrow}
      title={title}
      description={description}
      icon={LoaderCircle}
      tone="loading"
    >
      <div className="grid gap-3" aria-hidden="true">
        {Array.from({ length: rows }).map((_, index) => (
          <div
            key={index}
            className="bg-highlight-soft/50 h-4 animate-pulse rounded-sm"
            style={{ width: `${85 - index * 12}%` }}
          />
        ))}
      </div>
    </SharedStateShell>
  );
}

type EmptyStateProps = {
  title: string;
  description: string;
  eyebrow?: string;
  children?: ReactNode;
};

export function EmptyState({
  title,
  description,
  eyebrow = "Nothing here yet",
  children,
}: EmptyStateProps) {
  return (
    <SharedStateShell
      eyebrow={eyebrow}
      title={title}
      description={description}
      icon={Inbox}
      tone="empty"
    >
      {children}
    </SharedStateShell>
  );
}

type ErrorStateProps = {
  title: string;
  description: string;
  eyebrow?: string;
  children?: ReactNode;
};

export function ErrorState({
  title,
  description,
  eyebrow = "Something went wrong",
  children,
}: ErrorStateProps) {
  return (
    <SharedStateShell
      eyebrow={eyebrow}
      title={title}
      description={description}
      icon={AlertTriangle}
      tone="error"
    >
      {children}
    </SharedStateShell>
  );
}
