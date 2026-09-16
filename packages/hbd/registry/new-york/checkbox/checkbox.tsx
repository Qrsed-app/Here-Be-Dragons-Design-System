"use client";

import * as React from "react";
import { Checkbox as CheckboxPrimitive } from "radix-ui";

import { cn } from "@/lib/utils";

function Checkbox({ className, ...props }: React.ComponentProps<typeof CheckboxPrimitive.Root>) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        "peer relative size-5.5 shrink-0 cursor-pointer rounded-sm border-2 border-border-strong bg-surface-raised shadow-[2px_2px_0_var(--parchment-400)] transition-[background-color,border-color,box-shadow] duration-120 ease-out outline-none focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:border-blood-deep data-[state=checked]:bg-primary data-[state=checked]:shadow-[2px_2px_0_var(--blood-deep)] data-[state=indeterminate]:border-blood-deep data-[state=indeterminate]:bg-primary data-[state=indeterminate]:shadow-[2px_2px_0_var(--blood-deep)] aria-invalid:border-error aria-invalid:data-[state=checked]:border-error aria-invalid:data-[state=indeterminate]:border-error",
        className,
      )}
      {...props}
    >
      {/* The tick and dash are drawn in em so the glyph scales with the surrounding text,
          as the original CSS-drawn control did. */}
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="absolute inset-0 transition-none before:absolute before:top-1/2 before:left-1/2 before:h-0.5 before:w-[0.6em] before:-translate-1/2 before:bg-parchment-100 after:absolute after:top-[45%] after:left-1/2 after:h-[0.55em] after:w-[0.3em] after:-translate-1/2 after:rotate-45 after:border-r-2 after:border-b-2 after:border-parchment-100 data-[state=checked]:before:hidden data-[state=indeterminate]:after:hidden"
      />
    </CheckboxPrimitive.Root>
  );
}

export { Checkbox };
