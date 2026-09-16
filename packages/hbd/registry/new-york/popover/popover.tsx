"use client";

import * as React from "react";
import { Popover as PopoverPrimitive } from "radix-ui";

import { cn } from "@/lib/utils";

function Popover({ ...props }: React.ComponentProps<typeof PopoverPrimitive.Root>) {
  return <PopoverPrimitive.Root data-slot="popover" {...props} />;
}

function PopoverTrigger({ ...props }: React.ComponentProps<typeof PopoverPrimitive.Trigger>) {
  return <PopoverPrimitive.Trigger data-slot="popover-trigger" {...props} />;
}

function PopoverContent({
  className,
  align = "center",
  sideOffset = 8,
  showArrow = true,
  children,
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Content> & {
  showArrow?: boolean;
}) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        data-slot="popover-content"
        align={align}
        sideOffset={sideOffset}
        className={cn(
          // Header and footer bleed to the edges with negative margins, so loose body content gets
          // the 12px/16px body padding without a wrapper element.
          // With nothing focusable inside, Radix focuses the panel itself, which shows the ring.
          "group/popover-content relative z-50 flex max-w-[320px] min-w-[200px] origin-(--radix-popover-content-transform-origin) flex-col gap-3 rounded-lg border border-border-subtle bg-popover px-4 py-3 font-sans text-[1.0625rem] leading-[1.7] text-popover-foreground shadow-lg outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring focus-visible:outline-solid duration-120 ease-out data-[side=bottom]:slide-in-from-bottom-1 data-[side=left]:slide-in-from-left-1 data-[side=right]:slide-in-from-right-1 data-[side=top]:slide-in-from-top-1 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0",
          className,
        )}
        {...props}
      >
        {children}
        {showArrow && <PopoverArrowTriangle />}
      </PopoverPrimitive.Content>
    </PopoverPrimitive.Portal>
  );
}

// A CSS border triangle centred on the panel edge that faces the trigger. It is not Radix's
// Arrow: that one adds its own height to sideOffset and is drawn as an SVG polygon.
function PopoverArrowTriangle() {
  return (
    <span
      data-slot="popover-arrow"
      aria-hidden="true"
      className="pointer-events-none absolute size-0 border-8 border-transparent group-data-[side=bottom]/popover-content:-top-4 group-data-[side=bottom]/popover-content:left-1/2 group-data-[side=bottom]/popover-content:-translate-x-1/2 group-data-[side=bottom]/popover-content:border-b-popover group-data-[side=left]/popover-content:top-1/2 group-data-[side=left]/popover-content:-right-4 group-data-[side=left]/popover-content:-translate-y-1/2 group-data-[side=left]/popover-content:border-l-popover group-data-[side=right]/popover-content:top-1/2 group-data-[side=right]/popover-content:-left-4 group-data-[side=right]/popover-content:-translate-y-1/2 group-data-[side=right]/popover-content:border-r-popover group-data-[side=top]/popover-content:-bottom-4 group-data-[side=top]/popover-content:left-1/2 group-data-[side=top]/popover-content:-translate-x-1/2 group-data-[side=top]/popover-content:border-t-popover"
    />
  );
}

function PopoverAnchor({ ...props }: React.ComponentProps<typeof PopoverPrimitive.Anchor>) {
  return <PopoverPrimitive.Anchor data-slot="popover-anchor" {...props} />;
}

function PopoverClose({ ...props }: React.ComponentProps<typeof PopoverPrimitive.Close>) {
  return <PopoverPrimitive.Close data-slot="popover-close" {...props} />;
}

function PopoverHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="popover-header"
      className={cn(
        // A PopoverClose inside the header sits beside the title, in an implicit second column.
        "-mx-4 -mt-3 grid grid-cols-[minmax(0,1fr)] items-center gap-x-2 gap-y-1 border-b border-border-subtle px-4 pt-3 pb-2 *:col-start-1 [&>[data-slot=popover-close]]:col-start-2 [&>[data-slot=popover-close]]:row-start-1",
        className,
      )}
      {...props}
    />
  );
}

function PopoverTitle({ className, ...props }: React.ComponentProps<"h2">) {
  return (
    <div
      data-slot="popover-title"
      className={cn(
        "font-sans text-[0.8125rem] leading-[1.35] font-semibold tracking-[0.02em] text-foreground",
        className,
      )}
      {...props}
    />
  );
}

function PopoverDescription({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="popover-description"
      className={cn("text-sm leading-normal text-muted-foreground", className)}
      {...props}
    />
  );
}

function PopoverFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="popover-footer"
      className={cn(
        "-mx-4 -mb-3 flex flex-wrap justify-end gap-2 border-t border-border-subtle px-4 pt-2 pb-3",
        className,
      )}
      {...props}
    />
  );
}

export {
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverAnchor,
  PopoverHeader,
  PopoverTitle,
  PopoverDescription,
  PopoverClose,
  PopoverFooter,
};
