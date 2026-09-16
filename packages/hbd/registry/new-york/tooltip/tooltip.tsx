"use client";

import * as React from "react";
import { Tooltip as TooltipPrimitive } from "radix-ui";

import { cn } from "@/lib/utils";

function TooltipProvider({
  delayDuration = 0,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Provider>) {
  return (
    <TooltipPrimitive.Provider
      data-slot="tooltip-provider"
      delayDuration={delayDuration}
      {...props}
    />
  );
}

function Tooltip({ ...props }: React.ComponentProps<typeof TooltipPrimitive.Root>) {
  return <TooltipPrimitive.Root data-slot="tooltip" {...props} />;
}

function TooltipTrigger({ ...props }: React.ComponentProps<typeof TooltipPrimitive.Trigger>) {
  return <TooltipPrimitive.Trigger data-slot="tooltip-trigger" {...props} />;
}

function TooltipContent({
  className,
  sideOffset = 8,
  children,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Content>) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        data-slot="tooltip-content"
        sideOffset={sideOffset}
        className={cn(
          "group/tooltip-content relative z-50 w-fit max-w-[240px] origin-(--radix-tooltip-content-transform-origin) animate-in rounded-sm bg-foreground px-2 py-1 font-sans text-[0.6875rem] leading-[1.35] font-normal tracking-normal break-words whitespace-normal normal-case text-foreground-inverse shadow-md duration-120 ease-out fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0",
          className,
        )}
        {...props}
      >
        {children}
        {/* A CSS border triangle centred on the edge facing the trigger, not Radix's Arrow: that
            one adds its height to sideOffset and anti-aliases its diagonals differently. */}
        <span
          data-slot="tooltip-arrow"
          aria-hidden="true"
          className="pointer-events-none absolute size-0 border-6 border-transparent group-data-[side=bottom]/tooltip-content:-top-3 group-data-[side=bottom]/tooltip-content:left-1/2 group-data-[side=bottom]/tooltip-content:-translate-x-1/2 group-data-[side=bottom]/tooltip-content:border-b-foreground group-data-[side=left]/tooltip-content:top-1/2 group-data-[side=left]/tooltip-content:-right-3 group-data-[side=left]/tooltip-content:-translate-y-1/2 group-data-[side=left]/tooltip-content:border-l-foreground group-data-[side=right]/tooltip-content:top-1/2 group-data-[side=right]/tooltip-content:-left-3 group-data-[side=right]/tooltip-content:-translate-y-1/2 group-data-[side=right]/tooltip-content:border-r-foreground group-data-[side=top]/tooltip-content:-bottom-3 group-data-[side=top]/tooltip-content:left-1/2 group-data-[side=top]/tooltip-content:-translate-x-1/2 group-data-[side=top]/tooltip-content:border-t-foreground"
        />
      </TooltipPrimitive.Content>
    </TooltipPrimitive.Portal>
  );
}

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider };
