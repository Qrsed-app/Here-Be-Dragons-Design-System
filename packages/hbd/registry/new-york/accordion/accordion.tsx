"use client";

import * as React from "react";
import { ChevronDownIcon } from "lucide-react";
import { Accordion as AccordionPrimitive } from "radix-ui";

import { cn } from "@/lib/utils";

function Accordion({ className, ...props }: React.ComponentProps<typeof AccordionPrimitive.Root>) {
  return (
    <AccordionPrimitive.Root
      data-slot="accordion"
      className={cn("flex w-full flex-col", className)}
      {...props}
    />
  );
}

function AccordionItem({
  className,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Item>) {
  return (
    <AccordionPrimitive.Item data-slot="accordion-item" className={cn(className)} {...props} />
  );
}

function AccordionTrigger({
  className,
  children,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Trigger>) {
  return (
    <AccordionPrimitive.Header className="flex">
      <AccordionPrimitive.Trigger
        data-slot="accordion-trigger"
        className={cn(
          "flex min-h-12 flex-1 cursor-pointer items-center justify-between gap-3 bg-transparent p-4 text-left font-sans text-[1.0625rem] leading-[1.35] font-semibold tracking-[0.4px] text-foreground transition-[background-color] duration-120 ease-out outline-none hover:bg-surface-subtle focus-visible:outline-solid focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 data-[state=open]:bg-surface-subtle data-[state=open]:text-foreground-emphasis [&[data-state=open]>svg]:rotate-180",
          className,
        )}
        {...props}
      >
        {children}
        {/* strokeWidth 3 on the 24px grid is the 2px stroke of the HBD chevron at 16px. */}
        <ChevronDownIcon
          strokeWidth={3}
          className="pointer-events-none size-4 shrink-0 text-muted-foreground transition-transform duration-120 ease-out"
        />
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  );
}

function AccordionContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Content>) {
  return (
    <AccordionPrimitive.Content
      data-slot="accordion-content"
      className="overflow-hidden duration-350 ease-out data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down"
      {...props}
    >
      <div
        className={cn(
          "px-4 pt-0 pb-4 font-serif text-[1.0625rem] leading-[1.7] text-foreground-secondary",
          className,
        )}
      >
        {children}
      </div>
    </AccordionPrimitive.Content>
  );
}

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent };
