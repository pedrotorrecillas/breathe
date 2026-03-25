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
    "border border-slate-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(246,249,252,0.9))] shadow-[0_12px_32px_rgba(15,23,42,0.045)]",
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
    <section className={cn("rounded-[1rem] p-5 md:p-6", toneStyles[tone])}>
      <div className="flex flex-col gap-4 border-b border-slate-200/80 pb-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          {kicker ? (
            <p className="ops-kicker text-slate-500">{kicker}</p>
          ) : null}
          <h2 className="font-heading mt-3 text-xl font-semibold text-slate-950">
            {title}
          </h2>
          {description ? (
            <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-600">
              {description}
            </p>
          ) : null}
        </div>
        {actions ? <div className="shrink-0">{actions}</div> : null}
      </div>

      <div className="mt-5">{children}</div>

      {footer ? (
        <div className="mt-5 border-t border-slate-200/80 pt-4">{footer}</div>
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
    <div className="rounded-[0.7rem] border border-slate-200/85 bg-white/88 px-3 py-2.5 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.88)]">
      <p className="ops-kicker text-slate-500">{label}</p>
      <p className="mt-2 text-[1.55rem] leading-none font-semibold tracking-tight text-slate-950">
        {value}
      </p>
      {detail ? (
        <p className="mt-1 text-[11px] leading-5 text-slate-500">{detail}</p>
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
    <aside className="ops-panel-strong rounded-[0.95rem] border-l-[3px] border-l-cyan-400 p-5 md:p-6">
      <div className="border-b border-slate-200/80 pb-4">
        {kicker ? <p className="ops-kicker text-cyan-900">{kicker}</p> : null}
        <h2 className="font-heading mt-3 text-xl font-semibold text-slate-950">
          {title}
        </h2>
        {description ? (
          <p className="mt-2 text-sm leading-7 text-slate-600">
            {description}
          </p>
        ) : null}
      </div>
      <div className="mt-5">{children}</div>
    </aside>
  );
}
