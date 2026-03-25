import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return (
    <textarea
      className={cn(
        "flex min-h-32 w-full rounded-[0.75rem] border border-slate-300/90 bg-white/94 px-4 py-3 text-sm text-slate-950 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)] transition-[border-color,box-shadow,background-color] outline-none placeholder:text-slate-400 focus:border-cyan-400 focus:bg-white focus:ring-2 focus:ring-cyan-100 disabled:cursor-not-allowed disabled:opacity-60 aria-invalid:border-rose-400 aria-invalid:bg-rose-50/72 aria-invalid:ring-2 aria-invalid:ring-rose-100",
        className,
      )}
      {...props}
    />
  );
}
