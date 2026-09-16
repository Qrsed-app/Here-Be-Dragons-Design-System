import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

// The default size deliberately uses h-/w- rather than size-*: Button sizes icons with
// [&_svg:not([class*='size-'])]:size-4, so a default Spinner inside a Button shrinks to
// the icon size and takes the button's text colour, like upstream's Loader2Icon does.
const spinnerVariants = cva(
  "inline-block shrink-0 animate-hbd-spin align-baseline in-data-[slot=button]:text-current",
  {
    variants: {
      variant: {
        default: "text-primary",
        muted: "text-muted-foreground",
        inherit: "text-current",
      },
      size: {
        sm: "size-4",
        default: "h-6 w-6",
        lg: "size-10",
        xl: "size-16",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Spinner({
  className,
  variant = "default",
  size = "default",
  ...props
}: React.ComponentProps<"svg"> & VariantProps<typeof spinnerVariants>) {
  return (
    <svg
      role="status"
      aria-label="Loading"
      viewBox="0 0 24 24"
      fill="none"
      data-variant={variant}
      data-size={size}
      className={cn(spinnerVariants({ variant, size, className }))}
      {...props}
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        strokeWidth="2"
        className={cn(
          variant === "inherit" ? "stroke-current [stroke-opacity:0.2]" : "stroke-border-subtle",
          "in-data-[slot=button]:stroke-current in-data-[slot=button]:[stroke-opacity:0.2]",
        )}
      />
      {/* 47 + 16 ≈ 2πr: a 75% arc, started at 12 o'clock by the -90° rotation. */}
      <circle
        cx="12"
        cy="12"
        r="10"
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray="47 16"
        transform="rotate(-90 12 12)"
        className="stroke-current"
      />
    </svg>
  );
}

export { Spinner, spinnerVariants };
