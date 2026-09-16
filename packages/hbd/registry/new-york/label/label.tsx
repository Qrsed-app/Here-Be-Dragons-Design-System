"use client";

import * as React from "react";
import { Label as LabelPrimitive } from "radix-ui";

import { cn } from "@/lib/utils";

function Label({ className, ...props }: React.ComponentProps<typeof LabelPrimitive.Root>) {
  return (
    <LabelPrimitive.Root
      data-slot="label"
      className={cn(
        "flex cursor-pointer items-center gap-1 font-sans text-[0.8125rem] leading-[1.7] font-medium text-foreground select-none group-data-[disabled=true]:cursor-not-allowed group-data-[disabled=true]:text-foreground-disabled peer-disabled:cursor-not-allowed peer-disabled:text-foreground-disabled",
        className,
      )}
      {...props}
    />
  );
}

export { Label };
