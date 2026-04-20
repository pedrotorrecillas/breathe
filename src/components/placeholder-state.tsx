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
    <section className="brand-surface relative overflow-hidden rounded-[0.95rem] p-5 md:p-6">
      <p className="ops-kicker text-muted-foreground relative z-10">
        {eyebrow}
      </p>
      <h2 className="font-heading text-foreground mt-3 max-w-3xl text-2xl font-semibold">
        {title}
      </h2>
      {description ? (
        <p className="text-muted-foreground mt-2 max-w-2xl text-sm leading-6">
          {description}
        </p>
      ) : null}
      {children ? <div className="relative z-10 mt-5">{children}</div> : null}
    </section>
  );
}
