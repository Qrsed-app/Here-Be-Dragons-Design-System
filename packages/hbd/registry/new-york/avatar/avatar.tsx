"use client";

import * as React from "react";
import { Avatar as AvatarPrimitive } from "radix-ui";

import { cn } from "@/lib/utils";

function Avatar({
  className,
  size = "default",
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Root> & {
  size?: "default" | "xs" | "sm" | "lg" | "xl" | "2xl";
}) {
  return (
    <AvatarPrimitive.Root
      data-slot="avatar"
      data-size={size}
      className={cn(
        "group/avatar relative inline-flex size-10 shrink-0 items-center justify-center rounded-full border-2 border-background bg-surface-subtle align-middle text-muted-foreground select-none data-[size=2xl]:size-20 data-[size=lg]:size-12 data-[size=sm]:size-8 data-[size=xl]:size-16 data-[size=xs]:size-6",
        className,
      )}
      {...props}
    />
  );
}

function AvatarImage({ className, ...props }: React.ComponentProps<typeof AvatarPrimitive.Image>) {
  return (
    <AvatarPrimitive.Image
      data-slot="avatar-image"
      className={cn("aspect-square size-full rounded-full object-cover object-center", className)}
      {...props}
    />
  );
}

function AvatarFallback({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Fallback>) {
  return (
    <AvatarPrimitive.Fallback
      data-slot="avatar-fallback"
      className={cn(
        "flex size-full items-center justify-center rounded-full bg-surface-subtle font-sans text-[0.8125rem] font-semibold text-muted-foreground group-data-[size=2xl]/avatar:text-xl group-data-[size=lg]/avatar:text-[0.9375rem] group-data-[size=sm]/avatar:text-[0.6875rem] group-data-[size=xl]/avatar:text-lg group-data-[size=xs]/avatar:text-[0.5625rem] [&>svg]:size-[55%] [&>svg]:shrink-0",
        className,
      )}
      {...props}
    />
  );
}

function AvatarBadge({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="avatar-badge"
      className={cn(
        "absolute right-0 bottom-0 z-10 inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground ring-2 ring-background select-none",
        "group-data-[size=xs]/avatar:size-2 group-data-[size=xs]/avatar:[&>svg]:hidden",
        "group-data-[size=sm]/avatar:size-2.5 group-data-[size=sm]/avatar:[&>svg]:size-2",
        "group-data-[size=default]/avatar:size-3 group-data-[size=default]/avatar:[&>svg]:size-2",
        "group-data-[size=lg]/avatar:size-3.5 group-data-[size=lg]/avatar:[&>svg]:size-2.5",
        "group-data-[size=xl]/avatar:size-4 group-data-[size=xl]/avatar:[&>svg]:size-3",
        "group-data-[size=2xl]/avatar:size-5 group-data-[size=2xl]/avatar:[&>svg]:size-3.5",
        className,
      )}
      {...props}
    />
  );
}

function AvatarGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="avatar-group"
      className={cn(
        // Row-reversed like the pre-migration group: the first child sits at the right and each
        // avatar overlaps the one to its right, so a trailing count renders leftmost.
        "group/avatar-group inline-flex flex-row-reverse *:not-last:-ml-2",
        className,
      )}
      {...props}
    />
  );
}

function AvatarGroupCount({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="avatar-group-count"
      className={cn(
        "relative inline-flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-background bg-surface-subtle align-middle font-sans text-[0.8125rem] font-semibold tracking-normal text-foreground-secondary select-none group-has-data-[size=2xl]/avatar-group:size-20 group-has-data-[size=lg]/avatar-group:size-12 group-has-data-[size=sm]/avatar-group:size-8 group-has-data-[size=xl]/avatar-group:size-16 group-has-data-[size=xs]/avatar-group:size-6 [&>svg]:size-4 group-has-data-[size=xs]/avatar-group:[&>svg]:size-3 group-has-data-[size=sm]/avatar-group:[&>svg]:size-3 group-has-data-[size=lg]/avatar-group:[&>svg]:size-5 group-has-data-[size=xl]/avatar-group:[&>svg]:size-6 group-has-data-[size=2xl]/avatar-group:[&>svg]:size-8",
        className,
      )}
      {...props}
    />
  );
}

export { Avatar, AvatarImage, AvatarFallback, AvatarBadge, AvatarGroup, AvatarGroupCount };
