import type { HTMLAttributes } from "react";

import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const alertVariants = cva(
  "relative w-full rounded-[0.85rem] border px-4 py-3 text-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.72)]",
  {
    variants: {
      variant: {
        default: "border-border bg-card/96 text-foreground",
        success: "border-emerald-300/85 bg-emerald-50/92 text-emerald-900",
        destructive: "border-rose-300/85 bg-rose-50/92 text-rose-900",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

function Alert({
  className,
  variant,
  ...props
}: HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants>) {
  return <div role="alert" className={cn(alertVariants({ variant }), className)} {...props} />;
}

function AlertTitle({
  className,
  ...props
}: HTMLAttributes<HTMLHeadingElement>) {
  return <h5 className={cn("font-medium leading-none tracking-tight", className)} {...props} />;
}

function AlertDescription({
  className,
  ...props
}: HTMLAttributes<HTMLParagraphElement>) {
  return <div className={cn("mt-1.5 text-sm leading-6", className)} {...props} />;
}

export { Alert, AlertDescription, AlertTitle };
