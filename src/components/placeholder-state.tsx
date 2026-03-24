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
    <section className="rounded-[1.75rem] border border-dashed border-slate-300 bg-slate-50/80 p-8">
      <p className="font-mono text-xs tracking-[0.24em] text-slate-500 uppercase">
        {eyebrow}
      </p>
      <h2 className="font-heading mt-4 text-2xl font-semibold text-slate-950">
        {title}
      </h2>
      <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
        {description}
      </p>
      {children ? <div className="mt-6">{children}</div> : null}
    </section>
  );
}
