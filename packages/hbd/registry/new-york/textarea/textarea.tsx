import * as React from "react";
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils";

const textareaVariants = cva(
  [
    "flex field-sizing-content max-h-100 w-full resize-y appearance-none overflow-y-auto rounded-md border border-border-strong bg-background font-sans leading-[1.7] text-foreground transition-[border-color,box-shadow] duration-120 ease-out outline-none placeholder:text-muted-foreground",
    // outline-solid: outline-none zeroes --tw-outline-style, which outline-2 alone would inherit.
    "focus-visible:border-input-focus focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring focus-visible:outline-solid",
    "aria-invalid:border-error-border aria-invalid:text-foreground-emphasis aria-invalid:focus-visible:border-error-border aria-invalid:focus-visible:outline-error-border",
    "data-[valid=true]:border-success-border data-[valid=true]:text-forest-700 data-[valid=true]:focus-visible:border-success-border data-[valid=true]:focus-visible:outline-success-border",
    "disabled:cursor-not-allowed disabled:border-border-subtle disabled:bg-surface-subtle disabled:text-foreground-disabled",
    "[&[readonly]]:cursor-default [&[readonly]]:bg-surface-subtle",
  ],
  {
    variants: {
      size: {
        sm: "min-h-8 px-2 py-1 text-[0.8125rem]",
        default: "min-h-24 px-3 py-2 text-[1.0625rem]",
        lg: "min-h-13 px-4 py-3 text-[1.0625rem]",
      },
    },
    defaultVariants: {
      size: "default",
    },
  },
);

function Textarea({
  className,
  size = "default",
  ...props
}: React.ComponentProps<"textarea"> & { size?: "sm" | "default" | "lg" }) {
  return (
    <textarea
      data-slot="textarea"
      data-size={size}
      className={cn(textareaVariants({ size }), className)}
      {...props}
    />
  );
}

export { Textarea };
