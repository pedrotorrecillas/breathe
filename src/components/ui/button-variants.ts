import { cva } from "class-variance-authority";

export const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-[0.75rem] border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20 active:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "border-primary bg-primary text-primary-foreground shadow-[0_14px_34px_rgba(23,23,23,0.16)] hover:border-structure-secondary hover:bg-structure-secondary",
        outline:
          "border-border bg-card/88 text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.74)] hover:border-foreground/30 hover:bg-card hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground",
        secondary:
          "border-highlight-soft/55 bg-highlight-soft/18 text-foreground hover:border-highlight/40 hover:bg-highlight-soft/28 aria-expanded:bg-highlight-soft/28 aria-expanded:text-foreground",
        ghost:
          "hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground",
        destructive:
          "border border-destructive/28 bg-destructive/8 text-destructive hover:bg-destructive/12 focus-visible:border-destructive/40 focus-visible:ring-destructive/20",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default:
          "h-8 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        xs: "h-6 gap-1 rounded-[0.625rem] px-2 text-xs in-data-[slot=button-group]:rounded-[0.625rem] has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-7 gap-1 rounded-[0.625rem] px-2.5 text-[0.8rem] in-data-[slot=button-group]:rounded-[0.625rem] has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-9 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3",
        icon: "size-8",
        "icon-xs":
          "size-6 rounded-[0.625rem] in-data-[slot=button-group]:rounded-[0.625rem] [&_svg:not([class*='size-'])]:size-3",
        "icon-sm":
          "size-7 rounded-[0.625rem] in-data-[slot=button-group]:rounded-[0.625rem]",
        "icon-lg": "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);
