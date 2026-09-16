import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex h-5 w-fit min-w-5 shrink-0 items-center justify-center gap-1 overflow-hidden rounded-full border border-transparent px-1 align-middle font-sans text-[0.6875rem] leading-none font-semibold tracking-normal whitespace-nowrap transition-[color,box-shadow] outline-none focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-offset-2 focus-visible:outline-ring aria-invalid:border-destructive [&>svg]:pointer-events-none [&>svg]:size-3",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground [a&]:hover:bg-primary-hover",
        secondary:
          "border-border-strong bg-surface-subtle text-foreground [a&]:hover:bg-surface-raised",
        destructive: "bg-error text-error-foreground [a&]:hover:bg-primary-hover",
        outline:
          "border-border-strong text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground",
        ghost: "text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground",
        link: "text-foreground-link underline-offset-4 [a&]:hover:text-foreground-link-hover [a&]:hover:underline",
        success: "bg-success text-success-foreground",
        warning: "bg-warning text-warning-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

function Badge({
  className,
  variant = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "span";

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
