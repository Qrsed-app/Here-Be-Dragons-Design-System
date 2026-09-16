"use client";

import * as React from "react";
import { type VariantProps } from "class-variance-authority";
import { ToggleGroup as ToggleGroupPrimitive } from "radix-ui";

import { cn } from "@/lib/utils";
import { toggleVariants } from "@/registry/new-york/toggle/toggle";

const ToggleGroupContext = React.createContext<
  VariantProps<typeof toggleVariants> & {
    spacing?: number;
  }
>({
  size: "default",
  variant: "default",
  spacing: 0,
});

function ToggleGroup({
  className,
  variant,
  size,
  spacing = 0,
  children,
  ...props
}: React.ComponentProps<typeof ToggleGroupPrimitive.Root> &
  VariantProps<typeof toggleVariants> & {
    spacing?: number;
  }) {
  return (
    <ToggleGroupPrimitive.Root
      data-slot="toggle-group"
      data-variant={variant}
      data-size={size}
      data-spacing={spacing}
      style={{ "--gap": spacing } as React.CSSProperties}
      className={cn(
        "group/toggle-group flex w-fit items-center gap-[--spacing(var(--gap))] rounded-md data-[orientation=vertical]:flex-col data-[orientation=vertical]:items-stretch",
        spacing === 0 &&
          (variant === "outline"
            ? "rounded-sm shadow-[3px_3px_0_var(--border-strong)]"
            : "overflow-hidden border border-border-strong"),
        className,
      )}
      {...props}
    >
      <ToggleGroupContext.Provider value={{ variant, size, spacing }}>
        {children}
      </ToggleGroupContext.Provider>
    </ToggleGroupPrimitive.Root>
  );
}

function ToggleGroupItem({
  className,
  children,
  variant,
  size,
  ...props
}: React.ComponentProps<typeof ToggleGroupPrimitive.Item> & VariantProps<typeof toggleVariants>) {
  const context = React.useContext(ToggleGroupContext);
  const itemVariant = context.variant || variant;
  const joined = context.spacing === 0;

  return (
    <ToggleGroupPrimitive.Item
      data-slot="toggle-group-item"
      data-variant={itemVariant}
      data-size={context.size || size}
      data-spacing={context.spacing}
      className={cn(
        toggleVariants({
          variant: itemVariant,
          size: context.size || size,
        }),
        "w-auto min-w-0 shrink-0 focus:z-10 focus-visible:z-10",
        joined &&
          "rounded-none shadow-none active:translate-x-0 active:translate-y-0 active:shadow-none data-[state=on]:active:shadow-none group-data-[orientation=vertical]/toggle-group:w-full",
        joined &&
          (itemVariant === "outline"
            ? "border-l-0 first:border-l-2 first:rounded-l-sm last:rounded-r-sm group-data-[orientation=vertical]/toggle-group:border-t-0 group-data-[orientation=vertical]/toggle-group:border-l-2 group-data-[orientation=vertical]/toggle-group:first:rounded-none group-data-[orientation=vertical]/toggle-group:first:rounded-t-sm group-data-[orientation=vertical]/toggle-group:first:border-t-2 group-data-[orientation=vertical]/toggle-group:last:rounded-none group-data-[orientation=vertical]/toggle-group:last:rounded-b-sm"
            : "border-0 border-r border-border-subtle last:border-r-0 data-[state=on]:border-border-subtle group-data-[orientation=vertical]/toggle-group:border-r-0 group-data-[orientation=vertical]/toggle-group:border-b group-data-[orientation=vertical]/toggle-group:last:border-b-0"),
        className,
      )}
      {...props}
    >
      {children}
    </ToggleGroupPrimitive.Item>
  );
}

export { ToggleGroup, ToggleGroupItem };
