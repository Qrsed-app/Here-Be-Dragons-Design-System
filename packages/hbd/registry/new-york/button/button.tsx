import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-sm border-2 font-display text-[0.8125rem] leading-[1.7] font-bold tracking-[0.2em] whitespace-nowrap uppercase no-underline transition-[background-color,border-color,box-shadow,color,translate] duration-120 ease-out outline-none focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-offset-2 focus-visible:outline-ring disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 aria-invalid:border-destructive [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "border-blood-deep bg-primary text-parchment-100 shadow-[3px_3px_0_var(--blood-deep)] hover:bg-primary-hover active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0_var(--blood-deep)]",
        destructive:
          "border-crimson-900 bg-destructive text-destructive-foreground shadow-[3px_3px_0_var(--crimson-900)] hover:bg-destructive-hover active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0_var(--crimson-900)]",
        outline:
          "border-border-strong text-foreground hover:bg-accent hover:text-accent-foreground",
        secondary:
          "border-ink-900 bg-surface-raised text-foreground shadow-[3px_3px_0_var(--ink-900)] hover:bg-parchment-300 active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0_var(--ink-900)]",
        ghost: "border-transparent text-foreground hover:bg-accent hover:text-accent-foreground",
        link: "border-transparent text-foreground-link underline-offset-4 hover:text-foreground-link-hover hover:underline",
        gold: "border-gold-deep bg-gold text-ink-900 shadow-[3px_3px_0_var(--gold-deep)] hover:bg-gold-bright active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0_var(--gold-deep)]",
      },
      size: {
        default: "px-6 py-3",
        sm: "px-4 py-2",
        lg: "px-8 py-4 text-[1.0625rem]",
        icon: "aspect-square p-2",
        "icon-sm": "aspect-square p-1 [&_svg:not([class*='size-'])]:size-3",
        "icon-lg": "aspect-square p-3 [&_svg:not([class*='size-'])]:size-6",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot.Root : "button";

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
