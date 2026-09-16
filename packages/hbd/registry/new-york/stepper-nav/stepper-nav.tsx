import * as React from "react";
import { Slot } from "radix-ui";

import { cn } from "@/lib/utils";

function StepperNav({
  className,
  orientation = "horizontal",
  ...props
}: React.ComponentProps<"nav"> & { orientation?: "horizontal" | "vertical" }) {
  return (
    <nav
      data-slot="stepper-nav"
      data-orientation={orientation}
      aria-label="Progress"
      className={cn("group/stepper-nav w-full font-sans", className)}
      {...props}
    />
  );
}

function StepperNavList({ className, ...props }: React.ComponentProps<"ol">) {
  return (
    <ol
      data-slot="stepper-nav-list"
      className={cn(
        "m-0 flex list-none p-0 group-data-[orientation=horizontal]/stepper-nav:flex-row group-data-[orientation=horizontal]/stepper-nav:items-start group-data-[orientation=vertical]/stepper-nav:flex-col",
        className,
      )}
      {...props}
    />
  );
}

type StepStatus = "upcoming" | "active" | "completed" | "error";

function StepperNavItem({
  className,
  status = "upcoming",
  ...props
}: React.ComponentProps<"li"> & { status?: StepStatus }) {
  return (
    <li
      data-slot="stepper-nav-item"
      data-status={status}
      aria-current={status === "active" ? "step" : undefined}
      className={cn(
        "group/stepper-nav-item relative flex group-data-[orientation=horizontal]/stepper-nav:min-w-0 group-data-[orientation=horizontal]/stepper-nav:flex-1 group-data-[orientation=horizontal]/stepper-nav:flex-col group-data-[orientation=horizontal]/stepper-nav:items-center group-data-[orientation=vertical]/stepper-nav:flex-row group-data-[orientation=vertical]/stepper-nav:items-center group-data-[orientation=vertical]/stepper-nav:gap-3 group-data-[orientation=vertical]/stepper-nav:not-last:mb-4",
        className,
      )}
      {...props}
    />
  );
}

function StepperNavIndicator({
  className,
  asChild = false,
  ...props
}: React.ComponentProps<"div"> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "div";

  return (
    <Comp
      data-slot="stepper-nav-indicator"
      className={cn(
        "relative z-[1] m-0 inline-flex size-8 shrink-0 appearance-none items-center justify-center rounded-full border-2 p-0 font-sans text-[0.8125rem] leading-none font-semibold transition-[background-color,color,border-color] duration-200 ease-out outline-none focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4",
        "group-data-[status=upcoming]/stepper-nav-item:border-border-strong group-data-[status=upcoming]/stepper-nav-item:bg-surface-subtle group-data-[status=upcoming]/stepper-nav-item:text-muted-foreground",
        "group-data-[status=active]/stepper-nav-item:border-primary group-data-[status=active]/stepper-nav-item:bg-primary group-data-[status=active]/stepper-nav-item:text-primary-foreground",
        "group-data-[status=completed]/stepper-nav-item:border-primary group-data-[status=completed]/stepper-nav-item:bg-primary group-data-[status=completed]/stepper-nav-item:text-primary-foreground",
        "group-data-[status=error]/stepper-nav-item:border-error-border group-data-[status=error]/stepper-nav-item:bg-error group-data-[status=error]/stepper-nav-item:text-error-foreground",
        // A button indicator (a step you can jump back to) dims on hover, as the non-linear stepper did.
        "[&:is(button)]:cursor-pointer [&:is(button)]:hover:brightness-92",
        className,
      )}
      {...props}
    />
  );
}

function StepperNavSeparator({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="stepper-nav-separator"
      aria-hidden="true"
      className={cn(
        "absolute z-0 bg-border group-data-[status=completed]/stepper-nav-item:bg-primary",
        // Horizontal: between this indicator's right edge and the next one's left edge.
        "group-data-[orientation=horizontal]/stepper-nav:top-4 group-data-[orientation=horizontal]/stepper-nav:right-[calc(-50%+20px)] group-data-[orientation=horizontal]/stepper-nav:left-[calc(50%+20px)] group-data-[orientation=horizontal]/stepper-nav:h-0.5",
        // Vertical: dropped from below the indicator to the next step's indicator.
        "group-data-[orientation=vertical]/stepper-nav:top-9 group-data-[orientation=vertical]/stepper-nav:bottom-[-4px] group-data-[orientation=vertical]/stepper-nav:left-4 group-data-[orientation=vertical]/stepper-nav:w-0.5 group-data-[orientation=vertical]/stepper-nav:-translate-x-px",
        className,
      )}
      {...props}
    />
  );
}

function StepperNavContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="stepper-nav-content"
      className={cn(
        "group-data-[orientation=horizontal]/stepper-nav:mt-2 group-data-[orientation=horizontal]/stepper-nav:w-full group-data-[orientation=horizontal]/stepper-nav:px-1 group-data-[orientation=horizontal]/stepper-nav:text-center group-data-[orientation=vertical]/stepper-nav:py-0",
        className,
      )}
      {...props}
    />
  );
}

function StepperNavTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="stepper-nav-title"
      className={cn(
        "font-sans text-[0.8125rem] leading-[1.35] font-medium text-foreground group-data-[orientation=horizontal]/stepper-nav:text-center",
        "group-data-[status=upcoming]/stepper-nav-item:text-muted-foreground",
        "group-data-[status=active]/stepper-nav-item:font-semibold group-data-[status=active]/stepper-nav-item:text-foreground-emphasis",
        "group-data-[status=error]/stepper-nav-item:text-foreground-emphasis",
        className,
      )}
      {...props}
    />
  );
}

function StepperNavDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="stepper-nav-description"
      className={cn(
        "mt-1 font-sans text-[0.6875rem] leading-[1.35] text-muted-foreground group-data-[orientation=horizontal]/stepper-nav:text-center",
        className,
      )}
      {...props}
    />
  );
}

export {
  StepperNav,
  StepperNavList,
  StepperNavItem,
  StepperNavIndicator,
  StepperNavSeparator,
  StepperNavContent,
  StepperNavTitle,
  StepperNavDescription,
};
