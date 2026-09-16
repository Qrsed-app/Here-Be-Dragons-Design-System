import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";

import { cn } from "@/lib/utils";

const cardVariants = cva(
  "group/card relative flex flex-col gap-4 overflow-hidden rounded-lg border border-border-subtle bg-card py-4 font-sans text-card-foreground shadow-sm has-data-[slot=card-footer]:pb-0 has-[>img:first-child]:pt-0 data-[size=flush]:gap-0 data-[size=flush]:py-0 data-[size=lg]:gap-6 data-[size=lg]:py-6 data-[size=lg]:has-data-[slot=card-footer]:pb-0 data-[size=sm]:gap-3 data-[size=sm]:py-3 data-[size=sm]:has-data-[slot=card-footer]:pb-0 data-[size=lg]:has-[>img:first-child]:pt-0 data-[size=sm]:has-[>img:first-child]:pt-0",
  {
    variants: {
      variant: {
        default: "",
        bordered: "border-2 border-border shadow-none",
        elevated: "shadow-md",
      },
      interactive: {
        true: "cursor-pointer no-underline transition-[box-shadow,translate] duration-120 ease-out outline-none hover:-translate-y-1 hover:shadow-md focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-offset-2 focus-visible:outline-ring active:translate-y-0 active:shadow-sm",
        false: "",
      },
    },
    defaultVariants: {
      variant: "default",
      interactive: false,
    },
  },
);

function Card({
  className,
  variant = "default",
  size = "default",
  interactive = false,
  asChild = false,
  ...props
}: React.ComponentProps<"div"> &
  VariantProps<typeof cardVariants> & {
    size?: "default" | "sm" | "lg" | "flush";
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot.Root : "div";

  return (
    <Comp
      data-slot="card"
      data-variant={variant}
      data-size={size}
      className={cn(cardVariants({ variant, interactive }), className)}
      {...props}
    />
  );
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "@container/card-header grid auto-rows-min items-start gap-1 px-4 has-data-[slot=card-description]:grid-rows-[auto_auto] group-data-[size=flush]/card:px-0 group-data-[size=lg]/card:px-6 group-data-[size=sm]/card:px-3 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-4 group-data-[size=lg]/card:[.border-b]:pb-6 group-data-[size=sm]/card:[.border-b]:pb-3",
        className,
      )}
      {...props}
    />
  );
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-title"
      className={cn(
        "m-0 font-accent text-lg leading-[1.1] font-semibold tracking-[0.02em] text-foreground",
        className,
      )}
      {...props}
    />
  );
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn("m-0 font-sans text-[0.8125rem] text-muted-foreground", className)}
      {...props}
    />
  );
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn("col-start-2 row-span-2 row-start-1 self-start justify-self-end", className)}
      {...props}
    />
  );
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={cn(
        "flex-1 px-4 font-serif text-[1.0625rem] leading-[1.7] text-foreground-secondary group-data-[size=flush]/card:px-0 group-data-[size=lg]/card:px-6 group-data-[size=sm]/card:px-3",
        className,
      )}
      {...props}
    />
  );
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn(
        "flex flex-wrap items-center gap-2 border-t border-border-subtle px-4 py-3 group-data-[size=flush]/card:border-t-0 group-data-[size=flush]/card:p-0 group-data-[size=lg]/card:px-6 group-data-[size=lg]/card:py-4 group-data-[size=sm]/card:px-3 group-data-[size=sm]/card:py-2",
        className,
      )}
      {...props}
    />
  );
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
  cardVariants,
};
