import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type FormFieldProps = {
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
};

export function FormField({
  label,
  hint,
  error,
  required = false,
  children,
}: FormFieldProps) {
  return (
    <label
      className={cn(
        "grid gap-2 rounded-[1.25rem] border border-transparent p-1",
        error && "border-rose-200/80 bg-rose-50/40",
      )}
    >
      <span className="flex items-center gap-2">
        <span className="text-sm font-medium text-slate-900">{label}</span>
        {required ? (
          <span className="ops-kicker rounded-full border border-slate-300 bg-slate-100 px-2 py-0.5 text-slate-500">
            Required
          </span>
        ) : null}
      </span>
      {children}
      {error ? (
        <span className="text-xs text-rose-700">{error}</span>
      ) : hint ? (
        <span className="text-xs text-slate-500">{hint}</span>
      ) : null}
    </label>
  );
}
