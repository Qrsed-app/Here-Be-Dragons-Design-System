"use client";

import * as React from "react";
import { Progress as ProgressPrimitive } from "radix-ui";

import { cn } from "@/lib/utils";

const progressFill = {
  default: "bg-primary",
  success: "bg-success",
  warning: "bg-warning",
  error: "bg-error",
} as const;

const progressSize = {
  sm: "h-1",
  default: "h-2",
  lg: "h-3",
} as const;

function Progress({
  className,
  value,
  max = 100,
  variant = "default",
  size = "default",
  indeterminate = false,
  striped = false,
  segments,
  ...props
}: React.ComponentProps<typeof ProgressPrimitive.Root> & {
  variant?: keyof typeof progressFill;
  size?: keyof typeof progressSize;
  indeterminate?: boolean;
  striped?: boolean;
  segments?: number;
}) {
  const percent = Math.min(Math.max(((value ?? 0) / max) * 100, 0), 100);
  const offset = 100 - percent;
  const segmentCount = segments && segments > 0 ? Math.trunc(segments) : 0;
  const filledSegments = Math.round((percent / 100) * segmentCount);

  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      data-variant={variant}
      data-size={size}
      value={indeterminate ? null : value}
      max={max}
      className={cn(
        "relative w-full overflow-hidden rounded-full bg-surface-subtle",
        progressSize[size],
        segmentCount > 0 && "flex gap-1 overflow-visible rounded-none bg-transparent",
        className,
      )}
      {...props}
    >
      {segmentCount > 0 ? (
        Array.from({ length: segmentCount }, (_, i) => (
          <div
            key={i}
            data-slot="progress-segment"
            data-filled={i < filledSegments ? "true" : "false"}
            className={cn(
              "h-full flex-1 rounded-full bg-surface-subtle transition-colors duration-120 ease-out",
              i < filledSegments && progressFill[variant],
            )}
          />
        ))
      ) : (
        <ProgressPrimitive.Indicator
          data-slot="progress-indicator"
          className={cn(
            "h-full w-full flex-1 rounded-full transition-transform duration-350 ease-out",
            progressFill[variant],
            indeterminate && "w-2/5 animate-hbd-progress-indeterminate motion-reduce:animate-none",
            striped &&
              !indeterminate &&
              "animate-hbd-progress-stripe bg-[image:repeating-linear-gradient(45deg,transparent,transparent_8px,rgba(255,255,255,0.15)_8px,rgba(255,255,255,0.15)_16px)] bg-[length:32px_32px] motion-reduce:animate-none",
          )}
          style={
            indeterminate
              ? undefined
              : {
                  transform: `translateX(-${offset}%)`,
                  // The indicator is full-width and slid left, so shift the stripe tile back by
                  // the same distance to keep it anchored to the visible fill's left edge.
                  backgroundPositionX: striped
                    ? `calc(${offset}% + ${offset * 0.32}px)`
                    : undefined,
                }
          }
        />
      )}
    </ProgressPrimitive.Root>
  );
}

export { Progress };
