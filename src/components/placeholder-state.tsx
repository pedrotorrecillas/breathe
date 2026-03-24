import type { ReactNode } from "react";

type PlaceholderStateProps = {
  eyebrow: string;
  title: string;
  description: string;
  children?: ReactNode;
};

export function PlaceholderState({
  eyebrow,
  title,
  description,
  children,
}: PlaceholderStateProps) {
  return (
    <section className="ops-beacon rounded-[1.75rem] border border-dashed border-slate-300/90 bg-[linear-gradient(180deg,rgba(250,251,252,0.96),rgba(243,246,249,0.92))] p-8 shadow-[0_18px_44px_rgba(15,23,42,0.04)]">
      <p className="ops-kicker relative z-10 text-slate-500">{eyebrow}</p>
      <h2 className="font-heading mt-4 text-2xl font-semibold text-slate-950">
        {title}
      </h2>
      <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
        {description}
      </p>
      <div className="ops-divider mt-6 h-px w-full" />
      {children ? <div className="relative z-10 mt-6">{children}</div> : null}
    </section>
  );
}
