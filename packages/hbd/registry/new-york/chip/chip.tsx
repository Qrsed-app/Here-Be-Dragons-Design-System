"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { XIcon } from "lucide-react";
import { Slot, Toggle as TogglePrimitive } from "radix-ui";

import { cn } from "@/lib/utils";

const chipVariants = cva(
  "inline-flex h-7 max-w-[200px] items-center gap-1 rounded-full border border-transparent px-3 align-middle font-sans font-medium whitespace-nowrap [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "border-border-strong bg-surface-subtle text-foreground",
        primary: "bg-primary text-primary-foreground",
        success: "bg-success text-success-foreground",
        warning: "bg-warning text-warning-foreground",
        destructive: "bg-error text-error-foreground",
      },
      size: {
        sm: "h-[22px] px-2 text-[0.6875rem] leading-none",
        default: "text-[0.8125rem] leading-none",
        lg: "h-9 px-4 text-[1.0625rem] leading-none",
      },
      outline: {
        true: "bg-transparent",
        false: "",
      },
    },
    compoundVariants: [
      { outline: true, variant: "default", className: "border-border-strong text-foreground" },
      { outline: true, variant: "primary", className: "border-primary text-foreground-emphasis" },
      {
        outline: true,
        variant: "success",
        className: "border-success-border text-success-border",
      },
      {
        outline: true,
        variant: "warning",
        className: "border-warning-icon text-warning-icon",
      },
      {
        outline: true,
        variant: "destructive",
        className: "border-error-border text-error-border",
      },
    ],
    defaultVariants: {
      variant: "default",
      size: "default",
      outline: false,
    },
  },
);

function Chip({
  className,
  variant = "default",
  size = "default",
  outline = false,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof chipVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot.Root : "span";

  return (
    <Comp
      data-slot="chip"
      data-variant={variant}
      data-size={size}
      className={cn(chipVariants({ variant, size, outline, className }))}
      {...props}
    />
  );
}

// content-box + p-2 + -mr-2: a 32px hit area around a 16px glyph without
// changing the chip's painted size.
function ChipRemove({ className, children, ...props }: React.ComponentProps<"button">) {
  return (
    <button
      type="button"
      data-slot="chip-remove"
      aria-label="Remove"
      className={cn(
        "-mr-2 box-content inline-flex size-4 shrink-0 cursor-pointer items-center justify-center rounded-full p-2 leading-none text-muted-foreground transition-[color,background-color] duration-120 ease-out outline-none hover:bg-[rgba(0,0,0,0.06)] hover:text-foreground focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-offset-2 focus-visible:outline-ring [&_svg]:block [&_svg]:size-full",
        className,
      )}
      {...props}
    >
      {children ?? <XIcon strokeWidth={3} />}
    </button>
  );
}

function ChipToggle({
  className,
  variant = "default",
  size = "default",
  outline = false,
  ...props
}: React.ComponentProps<typeof TogglePrimitive.Root> & VariantProps<typeof chipVariants>) {
  return (
    <TogglePrimitive.Root
      data-slot="chip-toggle"
      data-variant={variant}
      data-size={size}
      className={cn(
        chipVariants({ variant, size, outline }),
        "cursor-pointer transition-[background-color,color,border-color] duration-120 ease-out outline-none select-none hover:brightness-95 focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-offset-2 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-50 data-[state=on]:border-primary data-[state=on]:bg-primary data-[state=on]:text-primary-foreground",
        className,
      )}
      {...props}
    />
  );
}

export { Chip, ChipRemove, ChipToggle, chipVariants };
