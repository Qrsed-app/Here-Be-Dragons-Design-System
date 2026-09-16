import * as React from "react";
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils";

const inputVariants = cva(
  [
    "w-full min-w-0 appearance-none rounded-md border border-border-strong bg-background font-sans leading-[1.7] text-foreground transition-[border-color,box-shadow] duration-120 ease-out outline-none selection:bg-primary selection:text-primary-foreground placeholder:text-muted-foreground file:inline-flex file:h-7 file:border-0 file:bg-transparent file:font-sans file:text-sm file:font-medium file:text-foreground",
    // outline-solid: outline-none zeroes --tw-outline-style, which outline-2 alone would inherit.
    "focus-visible:border-input-focus focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring focus-visible:outline-solid",
    "aria-invalid:border-error-border aria-invalid:text-foreground-emphasis aria-invalid:focus-visible:border-error-border aria-invalid:focus-visible:outline-error-border",
    "data-[valid=true]:border-success-border data-[valid=true]:text-forest-700 data-[valid=true]:focus-visible:border-success-border data-[valid=true]:focus-visible:outline-success-border",
    "disabled:cursor-not-allowed disabled:border-border-subtle disabled:bg-surface-subtle disabled:text-foreground-disabled",
    // An attribute selector, not read-only:, which also matches disabled and file inputs.
    "[&[readonly]]:cursor-default [&[readonly]]:bg-surface-subtle",
  ],
  {
    variants: {
      size: {
        sm: "min-h-8 px-2 py-1 text-[0.8125rem]",
        default: "min-h-11 px-3 py-2 text-[1.0625rem]",
        lg: "min-h-13 px-4 py-3 text-[1.0625rem]",
      },
    },
    defaultVariants: {
      size: "default",
    },
  },
);

// `size` replaces the native character-width attribute, which has no effect on a
// w-full input anyway; upstream NativeSelect makes the same trade.
function Input({
  className,
  type,
  size = "default",
  ...props
}: Omit<React.ComponentProps<"input">, "size"> & { size?: "sm" | "default" | "lg" }) {
  return (
    <input
      type={type}
      data-slot="input"
      data-size={size}
      className={cn(inputVariants({ size }), className)}
      {...props}
    />
  );
}

export { Input };
