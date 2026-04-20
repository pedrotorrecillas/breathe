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
    <section className="relative overflow-hidden rounded-[0.95rem] border border-slate-200/85 bg-white/92 p-5 shadow-[0_12px_28px_rgba(15,23,42,0.04)] md:p-6">
      <p className="ops-kicker relative z-10 text-slate-500">{eyebrow}</p>
      <h2 className="font-heading mt-3 max-w-3xl text-2xl font-semibold text-slate-950">
        {title}
      </h2>
      {description ? (
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
          {description}
        </p>
      ) : null}
      {children ? <div className="relative z-10 mt-5">{children}</div> : null}
    </section>
  );
}
