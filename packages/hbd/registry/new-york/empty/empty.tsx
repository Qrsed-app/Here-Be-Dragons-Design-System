import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

function Empty({
  className,
  size = "default",
  variant = "default",
  orientation = "vertical",
  ...props
}: React.ComponentProps<"div"> & {
  size?: "default" | "sm" | "lg";
  variant?: "default" | "error" | "success";
  orientation?: "vertical" | "horizontal";
}) {
  return (
    <div
      data-slot="empty"
      data-size={size}
      data-variant={variant}
      data-orientation={orientation}
      className={cn(
        "group/empty flex w-full min-w-0 flex-col items-center justify-center gap-3 rounded-lg border-dashed px-6 py-8 text-center",
        "data-[size=lg]:min-h-[60vh] data-[size=lg]:py-12 data-[size=sm]:px-4 data-[size=sm]:py-6",
        // Horizontal: the header dissolves into a two-column grid so the media spans the title,
        // description and (when present) content rows.
        "data-[orientation=horizontal]:grid data-[orientation=horizontal]:grid-cols-[auto_minmax(0,1fr)] data-[orientation=horizontal]:grid-rows-[auto_auto] data-[orientation=horizontal]:items-center data-[orientation=horizontal]:justify-items-start data-[orientation=horizontal]:gap-x-4 data-[orientation=horizontal]:gap-y-3 data-[orientation=horizontal]:p-4 data-[orientation=horizontal]:text-left data-[orientation=horizontal]:has-data-[slot=empty-content]:grid-rows-[auto_auto_auto]",
        className,
      )}
      {...props}
    />
  );
}

function EmptyHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="empty-header"
      className={cn(
        "flex flex-col items-center gap-3 text-center group-data-[orientation=horizontal]/empty:contents group-data-[orientation=horizontal]/empty:text-left",
        className,
      )}
      {...props}
    />
  );
}

const emptyMediaVariants = cva(
  "mb-1 flex shrink-0 items-center justify-center group-data-[size=sm]/empty:mb-0 group-data-[orientation=horizontal]/empty:col-start-1 group-data-[orientation=horizontal]/empty:row-[1/-1] group-data-[orientation=horizontal]/empty:mb-0 group-data-[orientation=horizontal]/empty:self-center group-data-[variant=error]/empty:text-error-border group-data-[variant=success]/empty:text-success-border [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-transparent text-muted-foreground [&>svg]:opacity-60 group-data-[variant=error]/empty:[&>svg]:opacity-80 group-data-[variant=success]/empty:[&>svg]:opacity-80 [&>svg:not([class*='size-'])]:size-16 group-data-[size=lg]/empty:[&>svg:not([class*='size-'])]:size-24 group-data-[size=sm]/empty:[&>svg:not([class*='size-'])]:size-12 group-data-[orientation=horizontal]/empty:[&>svg:not([class*='size-'])]:size-12",
        icon: "size-10 rounded-lg border border-border-subtle bg-surface-subtle text-foreground-secondary [&_svg:not([class*='size-'])]:size-6",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

function EmptyMedia({
  className,
  variant = "default",
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof emptyMediaVariants>) {
  return (
    <div
      data-slot="empty-icon"
      data-variant={variant}
      className={cn(emptyMediaVariants({ variant, className }))}
      {...props}
    />
  );
}

function EmptyTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="empty-title"
      className={cn(
        "m-0 max-w-[320px] font-display text-[length:clamp(1.0625rem,2.2vw,1.25rem)] leading-[1.1] font-bold tracking-[0.02em] text-foreground group-data-[size=lg]/empty:max-w-[480px] group-data-[size=lg]/empty:text-[length:clamp(1.375rem,3vw,1.75rem)] group-data-[size=sm]/empty:text-lg group-data-[orientation=horizontal]/empty:col-start-2",
        className,
      )}
      {...props}
    />
  );
}

function EmptyDescription({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <div
      data-slot="empty-description"
      className={cn(
        "m-0 max-w-[360px] font-serif text-[1.0625rem] leading-[1.7] text-muted-foreground group-data-[size=lg]/empty:max-w-[480px] group-data-[orientation=horizontal]/empty:col-start-2 [&>a]:underline [&>a]:underline-offset-4 [&>a:hover]:text-foreground-link-hover",
        className,
      )}
      {...props}
    />
  );
}

function EmptyContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="empty-content"
      className={cn(
        "flex w-full max-w-sm min-w-0 flex-col items-center gap-4 group-data-[orientation=horizontal]/empty:col-start-2 group-data-[orientation=horizontal]/empty:items-start",
        className,
      )}
      {...props}
    />
  );
}

export { Empty, EmptyHeader, EmptyTitle, EmptyDescription, EmptyContent, EmptyMedia };
