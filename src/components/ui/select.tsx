import type { ComponentProps } from "react";

import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

export function Select({
  className,
  children,
  ...props
}: ComponentProps<"select">) {
  return (
    <div className="relative">
      <select
        className={cn(
          "border-input bg-card/92 text-foreground focus:border-ring focus:bg-popover focus:ring-ring/16 aria-invalid:border-destructive aria-invalid:bg-destructive/6 aria-invalid:ring-destructive/10 flex h-12 w-full appearance-none rounded-[0.75rem] border px-4 pr-11 text-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.72)] transition-[border-color,box-shadow,background-color] outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60 aria-invalid:ring-2",
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        className="text-muted-foreground pointer-events-none absolute top-1/2 right-4 size-4 -translate-y-1/2"
        aria-hidden="true"
      />
    </div>
  );
}
