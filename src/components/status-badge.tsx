import type { ReactNode } from "react";

import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const statusBadgeVariants = cva(
  "inline-flex items-center rounded-full border px-3 py-1 font-mono text-[11px] uppercase tracking-[0.2em]",
  {
    variants: {
      intent: {
        neutral: "border-slate-300 bg-white text-slate-700",
        success: "border-emerald-300 bg-emerald-50 text-emerald-700",
        warning: "border-amber-300 bg-amber-50 text-amber-700",
        danger: "border-rose-300 bg-rose-50 text-rose-700",
      },
    },
    defaultVariants: {
      intent: "neutral",
    },
  },
);

type StatusBadgeProps = VariantProps<typeof statusBadgeVariants> & {
  children: ReactNode;
};

export function StatusBadge({ children, intent }: StatusBadgeProps) {
  return (
    <span className={cn(statusBadgeVariants({ intent }))}>{children}</span>
  );
}
