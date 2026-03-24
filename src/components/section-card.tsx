import type { ReactNode } from "react";

type SectionCardProps = {
  title: string;
  kicker?: string;
  children: ReactNode;
};

export function SectionCard({ title, kicker, children }: SectionCardProps) {
  return (
    <section className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-[0_16px_48px_rgba(15,23,42,0.05)]">
      {kicker ? (
        <p className="font-mono text-xs tracking-[0.22em] text-slate-500 uppercase">
          {kicker}
        </p>
      ) : null}
      <h2 className="font-heading mt-3 text-xl font-semibold text-slate-950">
        {title}
      </h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}
