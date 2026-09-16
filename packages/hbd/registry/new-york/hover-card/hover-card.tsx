"use client";

import * as React from "react";
import { HoverCard as HoverCardPrimitive } from "radix-ui";

import { cn } from "@/lib/utils";

function HoverCard({ ...props }: React.ComponentProps<typeof HoverCardPrimitive.Root>) {
  return <HoverCardPrimitive.Root data-slot="hover-card" {...props} />;
}

function HoverCardTrigger({ ...props }: React.ComponentProps<typeof HoverCardPrimitive.Trigger>) {
  return <HoverCardPrimitive.Trigger data-slot="hover-card-trigger" {...props} />;
}

function HoverCardContent({
  className,
  align = "center",
  sideOffset = 8,
  showArrow = true,
  children,
  ...props
}: React.ComponentProps<typeof HoverCardPrimitive.Content> & {
  showArrow?: boolean;
}) {
  return (
    <HoverCardPrimitive.Portal data-slot="hover-card-portal">
      <HoverCardPrimitive.Content
        data-slot="hover-card-content"
        align={align}
        sideOffset={sideOffset}
        className={cn(
          "group/hover-card-content relative z-50 w-64 origin-(--radix-hover-card-content-transform-origin) rounded-lg border border-border-subtle bg-popover px-4 py-3 font-sans text-[1.0625rem] leading-[1.7] text-popover-foreground shadow-lg outline-hidden duration-120 ease-out data-[side=bottom]:slide-in-from-bottom-1 data-[side=left]:slide-in-from-left-1 data-[side=right]:slide-in-from-right-1 data-[side=top]:slide-in-from-top-1 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0",
          className,
        )}
        {...props}
      >
        {children}
        {showArrow && (
          // The Popover's CSS border triangle, centred on the edge facing the trigger.
          <span
            data-slot="hover-card-arrow"
            aria-hidden="true"
            className="pointer-events-none absolute size-0 border-8 border-transparent group-data-[side=bottom]/hover-card-content:-top-4 group-data-[side=bottom]/hover-card-content:left-1/2 group-data-[side=bottom]/hover-card-content:-translate-x-1/2 group-data-[side=bottom]/hover-card-content:border-b-popover group-data-[side=left]/hover-card-content:top-1/2 group-data-[side=left]/hover-card-content:-right-4 group-data-[side=left]/hover-card-content:-translate-y-1/2 group-data-[side=left]/hover-card-content:border-l-popover group-data-[side=right]/hover-card-content:top-1/2 group-data-[side=right]/hover-card-content:-left-4 group-data-[side=right]/hover-card-content:-translate-y-1/2 group-data-[side=right]/hover-card-content:border-r-popover group-data-[side=top]/hover-card-content:-bottom-4 group-data-[side=top]/hover-card-content:left-1/2 group-data-[side=top]/hover-card-content:-translate-x-1/2 group-data-[side=top]/hover-card-content:border-t-popover"
          />
        )}
      </HoverCardPrimitive.Content>
    </HoverCardPrimitive.Portal>
  );
}

export { HoverCard, HoverCardTrigger, HoverCardContent };
