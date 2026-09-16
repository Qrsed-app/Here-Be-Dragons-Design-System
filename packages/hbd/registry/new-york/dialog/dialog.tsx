"use client";

import * as React from "react";
import { Dialog as DialogPrimitive } from "radix-ui";

import { cn } from "@/lib/utils";
import { Button } from "@/registry/new-york/button/button";

function Dialog({ ...props }: React.ComponentProps<typeof DialogPrimitive.Root>) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />;
}

function DialogTrigger({ ...props }: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />;
}

function DialogPortal({ ...props }: React.ComponentProps<typeof DialogPrimitive.Portal>) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />;
}

function DialogClose({ ...props }: React.ComponentProps<typeof DialogPrimitive.Close>) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />;
}

function DialogOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      data-slot="dialog-overlay"
      className={cn(
        "fixed inset-0 z-50 bg-[rgba(26,20,16,0.7)] duration-200 ease-out data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0",
        className,
      )}
      {...props}
    />
  );
}

function CloseGlyph() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function DialogContent({
  className,
  children,
  showCloseButton = true,
  size = "default",
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & {
  showCloseButton?: boolean;
  size?: "sm" | "default" | "lg" | "full";
}) {
  return (
    <DialogPortal data-slot="dialog-portal">
      <DialogOverlay />
      <DialogPrimitive.Content
        data-slot="dialog-content"
        data-size={size}
        className={cn(
          // Header and footer bleed to the edges with negative margins, so loose body children get
          // the 16px/24px body padding without a wrapper element.
          // Centred with auto margins, not translate(-50%): a fractional translate blurs edges and text.
          // With nothing focusable inside, Radix focuses the box itself, which shows the ring.
          "group/dialog-content fixed inset-0 z-50 m-auto grid h-fit max-h-[90vh] w-full max-w-[min(560px,calc(100%-2rem))] gap-4 overflow-y-auto overscroll-contain rounded-lg bg-background px-6 py-4 font-sans text-[1.0625rem] leading-[1.7] text-foreground shadow-xl duration-200 ease-out outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring focus-visible:outline-solid data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-97 data-[state=closed]:slide-out-to-bottom-4 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-97 data-[state=open]:slide-in-from-bottom-4",
          "data-[size=sm]:max-w-[min(400px,calc(100%-2rem))] data-[size=lg]:max-w-[min(720px,calc(100%-2rem))] data-[size=full]:h-full data-[size=full]:max-h-full data-[size=full]:max-w-full data-[size=full]:grid-rows-[auto_1fr] data-[size=full]:rounded-none",
          className,
        )}
        {...props}
      >
        {children}
        {showCloseButton && (
          <DialogPrimitive.Close data-slot="dialog-close" asChild>
            {/* Shares grid row 1 with the header so it centres on the title row, however many lines
                the title wraps to. The row starts below the header's top padding (-mt-4), so only
                the 12px+1px bottom padding and border need offsetting: mb-[13px]. */}
            <Button
              variant="secondary"
              size="icon"
              className="col-start-1 row-start-1 mb-[13px] self-center justify-self-end focus-visible:outline-solid"
            >
              <CloseGlyph />
              <span className="sr-only">Close</span>
            </Button>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </DialogPortal>
  );
}

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-header"
      className={cn(
        // With the close button: at least as tall as the 36px button, and clear of it.
        "-mx-6 -mt-4 flex flex-col justify-center gap-2 border-b border-border-subtle px-6 pt-4 pb-3 text-left group-has-[>[data-slot=dialog-close]]/dialog-content:col-start-1 group-has-[>[data-slot=dialog-close]]/dialog-content:row-start-1 group-has-[>[data-slot=dialog-close]]/dialog-content:min-h-[65px] group-has-[>[data-slot=dialog-close]]/dialog-content:pr-[76px]",
        className,
      )}
      {...props}
    />
  );
}

function DialogFooter({
  className,
  showCloseButton = false,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  showCloseButton?: boolean;
}) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        "-mx-6 -mb-4 flex flex-wrap justify-end gap-2 border-t border-border-subtle px-6 pt-3 pb-4",
        className,
      )}
      {...props}
    >
      {children}
      {showCloseButton && (
        <DialogPrimitive.Close asChild>
          <Button variant="outline">Close</Button>
        </DialogPrimitive.Close>
      )}
    </div>
  );
}

function DialogTitle({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn(
        "m-0 min-w-0 font-accent text-[length:clamp(1.0625rem,2.2vw,1.25rem)] leading-[1.35] font-bold tracking-[0.02em] text-foreground",
        className,
      )}
      {...props}
    />
  );
}

function DialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn("text-sm leading-normal text-muted-foreground", className)}
      {...props}
    />
  );
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
};
