import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

export function Input({ className, ...props }: ComponentProps<"input">) {
  return (
    <input
      className={cn(
        "border-input bg-card/92 text-foreground placeholder:text-muted-foreground focus:border-ring focus:bg-popover focus:ring-ring/16 aria-invalid:border-destructive aria-invalid:bg-destructive/6 aria-invalid:ring-destructive/10 flex h-12 w-full rounded-[0.75rem] border px-4 text-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.72)] transition-[border-color,box-shadow,background-color] outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60 aria-invalid:ring-2",
        className,
      )}
      {...props}
    />
  );
}
