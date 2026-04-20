import type { ReactNode } from "react";

type PlaceholderStateProps = {
  eyebrow?: string;
  title: string;
  titleSuffix?: ReactNode;
  description?: string;
  children?: ReactNode;
};

export function PlaceholderState({
  eyebrow,
  title,
  titleSuffix,
  description,
  children,
}: PlaceholderStateProps) {
  return (
    <section className="brand-surface relative overflow-hidden rounded-[0.95rem] p-5 md:p-6">
      {eyebrow ? (
        <p className="ops-kicker text-muted-foreground relative z-10">
          {eyebrow}
        </p>
      ) : null}
      <div className="relative z-10 flex flex-wrap items-center gap-3">
        <h2
          className={[
            "text-foreground max-w-3xl text-2xl font-semibold tracking-tight",
            eyebrow ? "mt-3" : "",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          {title}
        </h2>
        {titleSuffix ? (
          <div className={eyebrow ? "mt-3" : ""}>{titleSuffix}</div>
        ) : null}
      </div>
      {description ? (
        <p className="text-muted-foreground mt-2 max-w-2xl text-sm leading-6">
          {description}
        </p>
      ) : null}
      {children ? <div className="relative z-10 mt-5">{children}</div> : null}
    </section>
  );
}
