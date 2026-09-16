import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const alertVariants = cva(
  [
    "group/alert relative grid w-full grid-cols-[0_1fr] items-start gap-y-1 overflow-hidden rounded-md border-l-4 border-transparent px-4 py-3 font-sans text-[1.0625rem] leading-[1.7]",
    // Icon column: an svg (16px, top-aligned) or an AlertIcon glyph box (24px, centred); an AlertAction adds a trailing column.
    "has-[>svg]:grid-cols-[calc(var(--spacing)*4)_1fr] has-[>svg]:gap-x-3 has-data-[slot=alert-icon]:grid-cols-[calc(var(--spacing)*6)_1fr] has-data-[slot=alert-icon]:gap-x-3",
    "has-data-[slot=alert-action]:grid-cols-[0_1fr_auto] has-[>svg]:has-data-[slot=alert-action]:grid-cols-[calc(var(--spacing)*4)_1fr_auto] has-data-[slot=alert-icon]:has-data-[slot=alert-action]:grid-cols-[calc(var(--spacing)*6)_1fr_auto]",
    "[&>svg]:mt-1 [&>svg]:size-4 [&>svg]:text-current",
    // Banner and inline: title and description wrap as whole boxes in a row, as the pre-migration body did.
    // The icon and the action are taken out of that row and sit in padding reserved for them.
    "data-[layout=banner]:sticky data-[layout=banner]:top-0 data-[layout=banner]:z-50 data-[layout=banner]:flex data-[layout=banner]:flex-wrap data-[layout=banner]:content-start data-[layout=banner]:items-center data-[layout=banner]:gap-2 data-[layout=banner]:rounded-none data-[layout=banner]:border-b data-[layout=banner]:border-l-0 data-[layout=banner]:border-b-current data-[layout=banner]:px-[clamp(1rem,4vw,3rem)] data-[layout=banner]:py-2",
    "data-[layout=banner]:has-[>svg]:pl-[calc(clamp(1rem,4vw,3rem)+28px)] data-[layout=banner]:has-data-[slot=alert-action]:min-h-[49px] data-[layout=banner]:has-data-[slot=alert-action]:pr-[calc(clamp(1rem,4vw,3rem)+52px)]",
    "data-[layout=banner]:[&>svg]:absolute data-[layout=banner]:[&>svg]:top-3 data-[layout=banner]:[&>svg]:left-[clamp(1rem,4vw,3rem)] data-[layout=banner]:[&>svg]:mt-0",
    "data-[layout=inline]:flex data-[layout=inline]:flex-wrap data-[layout=inline]:content-start data-[layout=inline]:items-center data-[layout=inline]:gap-2 data-[layout=inline]:rounded-sm data-[layout=inline]:border-l-2 data-[layout=inline]:px-3 data-[layout=inline]:py-2 data-[layout=inline]:text-[0.8125rem]",
    "data-[layout=inline]:has-[>svg]:pl-8 data-[layout=inline]:has-data-[slot=alert-action]:min-h-12 data-[layout=inline]:has-data-[slot=alert-action]:pr-15",
    "data-[layout=inline]:[&>svg]:absolute data-[layout=inline]:[&>svg]:top-1/2 data-[layout=inline]:[&>svg]:left-3 data-[layout=inline]:[&>svg]:mt-0 data-[layout=inline]:[&>svg]:size-3 data-[layout=inline]:[&>svg]:-translate-y-1/2",
  ],
  {
    variants: {
      variant: {
        default: "border-l-border-ink bg-surface-subtle text-foreground",
        destructive: "border-l-error-border bg-error text-error-foreground",
        info: "border-l-info-border bg-info text-info-foreground",
        success: "border-l-success-border bg-success text-success-foreground",
        warning: "border-l-warning-border bg-warning text-warning-foreground",
        error: "border-l-error-border bg-error text-error-foreground",
        "sage-advice":
          "border-2 border-dashed border-border-gold bg-[rgba(184,137,59,0.08)] text-foreground-secondary [&>svg]:text-foreground-gold",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

function Alert({
  className,
  variant = "default",
  layout = "default",
  ...props
}: React.ComponentProps<"div"> &
  VariantProps<typeof alertVariants> & {
    layout?: "default" | "banner" | "inline";
  }) {
  return (
    <div
      data-slot="alert"
      data-variant={variant}
      data-layout={layout}
      role="alert"
      className={cn(alertVariants({ variant }), className)}
      {...props}
    />
  );
}

function AlertTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-title"
      className={cn(
        "col-start-2 leading-[1.35] font-semibold",
        "group-data-[variant=sage-advice]/alert:font-display group-data-[variant=sage-advice]/alert:text-[0.6875rem] group-data-[variant=sage-advice]/alert:font-bold group-data-[variant=sage-advice]/alert:tracking-[0.3em] group-data-[variant=sage-advice]/alert:text-foreground-gold group-data-[variant=sage-advice]/alert:uppercase",
        className,
      )}
      {...props}
    />
  );
}

function AlertDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-description"
      className={cn(
        "col-start-2 leading-[1.7] group-data-[layout=inline]/alert:leading-[1.35] [&_p]:m-0",
        "group-data-[variant=sage-advice]/alert:font-serif group-data-[variant=sage-advice]/alert:text-[0.9375rem] group-data-[variant=sage-advice]/alert:leading-[1.6] group-data-[variant=sage-advice]/alert:italic",
        className,
      )}
      {...props}
    />
  );
}

function AlertIcon({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="alert-icon"
      aria-hidden="true"
      className={cn(
        // An explicit row line, not row-span: a spanning item with an auto start is placed after the description.
        "col-start-1 row-start-1 inline-flex size-6 shrink-0 items-center justify-center self-center text-current group-has-data-[slot=alert-title]/alert:group-has-data-[slot=alert-description]/alert:row-[1/span_2] group-data-[variant=sage-advice]/alert:text-foreground-gold",
        className,
      )}
      {...props}
    />
  );
}

function AlertAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-action"
      className={cn(
        "col-start-3 row-start-1 -my-2 ml-3 -mr-2 flex items-start gap-2 self-start group-has-data-[slot=alert-title]/alert:group-has-data-[slot=alert-description]/alert:row-[1/span_2] group-has-data-[slot=alert-icon]/alert:ml-0 group-has-[>svg]/alert:ml-0",
        "group-data-[layout=banner]/alert:absolute group-data-[layout=banner]/alert:top-0 group-data-[layout=banner]/alert:right-[calc(clamp(1rem,4vw,3rem)-8px)] group-data-[layout=banner]/alert:m-0",
        "group-data-[layout=inline]/alert:absolute group-data-[layout=inline]/alert:top-0 group-data-[layout=inline]/alert:right-1 group-data-[layout=inline]/alert:m-0",
        className,
      )}
      {...props}
    />
  );
}

export { Alert, AlertTitle, AlertDescription, AlertIcon, AlertAction, alertVariants };
