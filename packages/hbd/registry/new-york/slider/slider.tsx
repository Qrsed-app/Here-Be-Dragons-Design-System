"use client";

import * as React from "react";
import { Slider as SliderPrimitive } from "radix-ui";

import { cn } from "@/lib/utils";

const sliderThumbSize = {
  sm: "size-4",
  default: "size-5",
  lg: "size-6",
} as const;

function Slider({
  className,
  defaultValue,
  value,
  min = 0,
  max = 100,
  size = "default",
  ...props
}: React.ComponentProps<typeof SliderPrimitive.Root> & {
  size?: keyof typeof sliderThumbSize;
}) {
  const _values = React.useMemo(
    () => (Array.isArray(value) ? value : Array.isArray(defaultValue) ? defaultValue : [min, max]),
    [value, defaultValue, min, max],
  );

  return (
    <SliderPrimitive.Root
      data-slot="slider"
      data-size={size}
      defaultValue={defaultValue}
      value={value}
      min={min}
      max={max}
      className={cn(
        // h-12 / w-12: the 48px rail is the touch target (SC 2.5.8); the visible track is 4px.
        "group/slider relative flex w-full cursor-pointer touch-none items-center select-none data-[disabled]:cursor-not-allowed data-[orientation=horizontal]:h-12 data-[orientation=vertical]:h-full data-[orientation=vertical]:min-h-44 data-[orientation=vertical]:w-12 data-[orientation=vertical]:flex-col",
        className,
      )}
      {...props}
    >
      <SliderPrimitive.Track
        data-slot="slider-track"
        className="relative grow overflow-hidden rounded-full bg-border-strong data-[disabled]:opacity-50 data-[orientation=horizontal]:h-1 data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full data-[orientation=vertical]:w-1"
      >
        <SliderPrimitive.Range
          data-slot="slider-range"
          className="absolute rounded-full bg-primary group-aria-invalid/slider:bg-error-border data-[orientation=horizontal]:h-full data-[orientation=vertical]:w-full"
        />
      </SliderPrimitive.Track>
      {Array.from({ length: _values.length }, (_, index) => (
        <SliderPrimitive.Thumb
          data-slot="slider-thumb"
          key={index}
          className={cn(
            "block shrink-0 cursor-pointer rounded-full border-2 border-primary bg-background shadow-sm transition-[box-shadow,scale] duration-120 ease-out outline-none group-aria-invalid/slider:border-error-border focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:scale-115 active:shadow-md data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50",
            sliderThumbSize[size],
          )}
        />
      ))}
    </SliderPrimitive.Root>
  );
}

export { Slider };
