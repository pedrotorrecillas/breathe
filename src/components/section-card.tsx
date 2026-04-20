import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type SectionCardProps = {
  title: string;
  kicker?: string;
  description?: string;
  actions?: ReactNode;
  footer?: ReactNode;
  tone?: "default" | "strong" | "subtle";
  children: ReactNode;
};

const toneStyles = {
  default: "ops-panel",
  strong: "ops-panel-strong",
  subtle:
    "border border-border/82 bg-card/96 shadow-[0_12px_32px_rgba(23,23,23,0.045)]",
} as const;

export function SectionCard({
  title,
  kicker,
  description,
  actions,
  footer,
  tone = "default",
  children,
}: SectionCardProps) {
  return (
    <section className={cn("rounded-[1rem] p-4 md:p-5", toneStyles[tone])}>
      <div className="border-border/78 flex flex-col gap-3 border-b pb-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          {kicker ? (
            <p className="ops-kicker text-muted-foreground">{kicker}</p>
          ) : null}
          <h2 className="font-heading text-foreground mt-2 text-xl font-semibold">
            {title}
          </h2>
          {description ? (
            <p className="text-muted-foreground mt-2 max-w-3xl text-sm leading-6">
              {description}
            </p>
          ) : null}
        </div>
        {actions ? <div className="shrink-0">{actions}</div> : null}
      </div>

      <div className="mt-4">{children}</div>

      {footer ? (
        <div className="border-border/78 mt-4 border-t pt-4">{footer}</div>
      ) : null}
    </section>
  );
}

type DataPointProps = {
  label: string;
  value: string | number;
  detail?: string;
};

export function DataPoint({ label, value, detail }: DataPointProps) {
  return (
    <div className="border-border/84 bg-card/88 rounded-[0.7rem] border px-3 py-3 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.72)]">
      <p className="ops-kicker text-muted-foreground">{label}</p>
      <p className="text-foreground mt-2 text-[1.55rem] leading-none font-semibold tracking-tight">
        {value}
      </p>
      {detail ? (
        <p className="text-muted-foreground mt-1 text-[11px] leading-5">
          {detail}
        </p>
      ) : null}
    </div>
  );
}

type DetailPanelProps = {
  title: string;
  kicker?: string;
  description?: string;
  children: ReactNode;
};

export function DetailPanel({
  title,
  kicker,
  description,
  children,
}: DetailPanelProps) {
  return (
    <aside className="ops-panel-strong border-l-highlight rounded-[0.95rem] border-l-[3px] p-4 md:p-5">
      <div className="border-border/78 border-b pb-4">
        {kicker ? <p className="ops-kicker text-highlight">{kicker}</p> : null}
        <h2 className="font-heading text-foreground mt-2 text-xl font-semibold">
          {title}
        </h2>
        {description ? (
          <p className="text-muted-foreground mt-2 text-sm leading-6">
            {description}
          </p>
        ) : null}
      </div>
      <div className="mt-4">{children}</div>
    </aside>
  );
}
