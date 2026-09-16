"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Toggle as TogglePrimitive } from "radix-ui";

import { cn } from "@/lib/utils";

const toggleVariants = cva(
  "inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-sm border-2 font-display text-[0.8125rem] leading-[1.7] font-bold tracking-[0.2em] whitespace-nowrap uppercase transition-[background-color,border-color,box-shadow,color,translate] duration-120 ease-out outline-none focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive data-[state=on]:text-primary-foreground data-[state=on]:hover:brightness-[0.92] [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "border-ink-900 bg-surface-raised text-foreground shadow-[3px_3px_0_var(--ink-900)] hover:bg-parchment-300 active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0_var(--ink-900)] data-[state=on]:border-blood-deep data-[state=on]:bg-primary data-[state=on]:shadow-[3px_3px_0_var(--blood-deep)] data-[state=on]:hover:bg-primary data-[state=on]:active:shadow-[1px_1px_0_var(--blood-deep)]",
        outline:
          "border-border-strong bg-transparent text-foreground hover:bg-accent hover:text-accent-foreground data-[state=on]:border-primary data-[state=on]:bg-primary data-[state=on]:hover:bg-primary data-[state=on]:hover:text-primary-foreground",
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

function Toggle({
  className,
  variant,
  size,
  ...props
}: React.ComponentProps<typeof TogglePrimitive.Root> & VariantProps<typeof toggleVariants>) {
  return (
    <TogglePrimitive.Root
      data-slot="toggle"
      className={cn(toggleVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Toggle, toggleVariants };
