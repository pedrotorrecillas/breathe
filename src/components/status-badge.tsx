import type { ReactNode } from "react";

import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

export const scoreBadgeIntent = {
  Outstanding: "score-outstanding",
  Great: "score-great",
  Good: "score-good",
  Average: "score-average",
  Low: "score-low",
  Poor: "score-poor",
} as const;

export const runtimeBadgeIntent = {
  pending: "neutral",
  calling: "info",
  completed: "success",
  human_requested: "special",
  no_response: "warning",
  failed_job_condition: "danger",
  disconnected: "warning",
  error: "danger",
} as const;

const statusBadgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-[0.7rem] border px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.16em]",
  {
    variants: {
      intent: {
        neutral:
          "border-slate-300/90 bg-white/94 text-slate-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]",
        info: "border-cyan-300/85 bg-cyan-50/88 text-cyan-950",
        success: "border-emerald-300/85 bg-emerald-50/90 text-emerald-800",
        warning: "border-amber-300/85 bg-amber-50/90 text-amber-800",
        danger: "border-rose-300/85 bg-rose-50/90 text-rose-800",
        special: "border-orange-300/85 bg-orange-50/90 text-orange-900",
        "score-outstanding":
          "border-cyan-300/85 bg-cyan-50/88 text-cyan-950 shadow-[0_0_0_1px_rgba(34,211,238,0.08)]",
        "score-great":
          "border-teal-300/85 bg-teal-50/88 text-teal-900 shadow-[0_0_0_1px_rgba(20,184,166,0.06)]",
        "score-good": "border-emerald-300/85 bg-emerald-50/90 text-emerald-800",
        "score-average": "border-slate-300/90 bg-slate-100/90 text-slate-700",
        "score-low": "border-amber-300/85 bg-amber-50/90 text-amber-800",
        "score-poor": "border-rose-300/85 bg-rose-50/90 text-rose-800",
      },
      density: {
        default: "px-2.5 py-1",
        compact: "px-2 py-0.5 text-[10px]",
      },
    },
    defaultVariants: {
      intent: "neutral",
      density: "default",
    },
  },
);

type StatusBadgeProps = VariantProps<typeof statusBadgeVariants> & {
  children: ReactNode;
  dot?: boolean;
};

export function StatusBadge({
  children,
  intent,
  density,
  dot = true,
}: StatusBadgeProps) {
  return (
    <span className={cn(statusBadgeVariants({ intent, density }))}>
      {dot ? <span className="size-1.5 rounded-full bg-current/70" /> : null}
      <span>{children}</span>
    </span>
  );
}
