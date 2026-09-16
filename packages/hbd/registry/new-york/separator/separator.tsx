"use client";

import * as React from "react";
import { cva } from "class-variance-authority";
import { Separator as SeparatorPrimitive } from "radix-ui";

import { cn } from "@/lib/utils";

type SeparatorVariant = "default" | "subtle" | "strong" | "gold" | "ornamental";
type SeparatorLineStyle = "solid" | "dashed" | "double";

const separatorVariants = cva("shrink-0", {
  variants: {
    orientation: {
      horizontal: "my-6 w-full",
      vertical: "mx-2",
    },
    layout: {
      line: "",
      labelled: "flex items-center gap-3",
      ornamental: "flex items-center gap-3",
    },
    variant: {
      default: "[--separator:var(--border)]",
      subtle: "[--separator:var(--border-subtle)]",
      strong: "[--separator:var(--border-strong)]",
      gold: "[--separator:var(--gold)]",
      ornamental: "",
    },
  },
  compoundVariants: [
    { orientation: "vertical", layout: "line", class: "inline-block h-[1em] align-middle" },
    { orientation: "vertical", layout: ["labelled", "ornamental"], class: "flex-col self-stretch" },
    { orientation: "horizontal", layout: "ornamental", class: "my-8" },
  ],
  defaultVariants: {
    orientation: "horizontal",
    layout: "line",
    variant: "default",
  },
});

// The dashed rule is a gradient, not border-style: dashed, whose dash length is
// tied to the border width and looks chunky at 1px.
const separatorLineVariants = cva("", {
  variants: {
    orientation: { horizontal: "", vertical: "" },
    lineStyle: { solid: "", dashed: "", double: "", ornamental: "" },
  },
  compoundVariants: [
    { orientation: "horizontal", lineStyle: "solid", class: "h-px bg-(--separator)" },
    { orientation: "vertical", lineStyle: "solid", class: "w-px bg-(--separator)" },
    {
      orientation: "horizontal",
      lineStyle: "dashed",
      class:
        "h-px bg-[repeating-linear-gradient(to_right,var(--separator)_0,var(--separator)_4px,transparent_4px,transparent_8px)]",
    },
    {
      orientation: "vertical",
      lineStyle: "dashed",
      class:
        "w-px bg-[repeating-linear-gradient(to_bottom,var(--separator)_0,var(--separator)_4px,transparent_4px,transparent_8px)]",
    },
    {
      orientation: "horizontal",
      lineStyle: "double",
      class: "h-[3px] border-y border-(--separator)",
    },
    {
      orientation: "vertical",
      lineStyle: "double",
      class: "w-[3px] border-x border-(--separator)",
    },
    {
      orientation: "horizontal",
      lineStyle: "ornamental",
      class: "h-px bg-[linear-gradient(to_right,transparent,var(--gold-deep),transparent)]",
    },
    {
      orientation: "vertical",
      lineStyle: "ornamental",
      class: "w-px bg-[linear-gradient(to_bottom,transparent,var(--gold-deep),transparent)]",
    },
  ],
});

function Separator({
  className,
  orientation = "horizontal",
  decorative = true,
  variant = "default",
  lineStyle = "solid",
  children,
  ...props
}: React.ComponentProps<typeof SeparatorPrimitive.Root> & {
  variant?: SeparatorVariant;
  lineStyle?: SeparatorLineStyle;
}) {
  const ornamental = variant === "ornamental";
  const line = separatorLineVariants({
    orientation,
    lineStyle: ornamental ? "ornamental" : lineStyle,
  });

  if (children == null && !ornamental) {
    return (
      <SeparatorPrimitive.Root
        data-slot="separator"
        data-variant={variant}
        decorative={decorative}
        orientation={orientation}
        className={cn(separatorVariants({ orientation, variant }), line, className)}
        {...props}
      />
    );
  }

  return (
    <SeparatorPrimitive.Root
      data-slot="separator"
      data-variant={variant}
      decorative={decorative}
      orientation={orientation}
      aria-hidden={ornamental ? true : undefined}
      className={cn(
        separatorVariants({ orientation, variant, layout: ornamental ? "ornamental" : "labelled" }),
        className,
      )}
      {...props}
    >
      <span data-slot="separator-line" className={cn("flex-1", line)} />
      {children != null ? (
        <span
          data-slot={ornamental ? "separator-ornament" : "separator-label"}
          className={
            ornamental
              ? "inline-flex shrink-0 items-center text-foreground-gold"
              : "shrink-0 font-sans text-[0.8125rem] leading-[1.7] tracking-[0.3em] whitespace-nowrap text-muted-foreground uppercase"
          }
        >
          {children}
        </span>
      ) : null}
      <span data-slot="separator-line" className={cn("flex-1", line)} />
    </SeparatorPrimitive.Root>
  );
}

export { Separator };
