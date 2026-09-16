"use client";

import * as React from "react";
import { Switch as SwitchPrimitive } from "radix-ui";

import { cn } from "@/lib/utils";

function Switch({
  className,
  size = "default",
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root> & {
  size?: "sm" | "default" | "lg";
}) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      data-size={size}
      className={cn(
        "peer group/switch inline-flex shrink-0 cursor-pointer items-center rounded-full px-[3px] transition-[background-color] duration-120 ease-in-out outline-none enabled:hover:brightness-[0.92] focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-50 data-[size=default]:h-6 data-[size=default]:w-11 data-[size=lg]:h-7 data-[size=lg]:w-13 data-[size=sm]:h-5 data-[size=sm]:w-9 data-[state=checked]:bg-primary data-[state=unchecked]:bg-border-strong",
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className="pointer-events-none block rounded-full bg-background shadow-sm ring-0 transition-transform duration-120 ease-in-out group-data-[size=default]/switch:size-4.5 group-data-[size=lg]/switch:size-5.5 group-data-[size=sm]/switch:size-3.5 data-[state=unchecked]:translate-x-0 group-data-[size=default]/switch:data-[state=checked]:translate-x-5 group-data-[size=lg]/switch:data-[state=checked]:translate-x-6 group-data-[size=sm]/switch:data-[state=checked]:translate-x-4"
      />
    </SwitchPrimitive.Root>
  );
}

export { Switch };
