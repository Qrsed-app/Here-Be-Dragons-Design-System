"use client";

import { AspectRatio as AspectRatioPrimitive } from "radix-ui";

import { cn } from "@/lib/utils";

function AspectRatio({
  className,
  ...props
}: React.ComponentProps<typeof AspectRatioPrimitive.Root>) {
  return (
    <AspectRatioPrimitive.Root
      data-slot="aspect-ratio"
      className={cn("overflow-hidden *:size-full *:object-cover", className)}
      {...props}
    />
  );
}

export { AspectRatio };
