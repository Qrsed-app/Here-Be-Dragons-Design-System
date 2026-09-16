import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";

import { cn } from "@/lib/utils";
import { Separator } from "@/registry/new-york/separator/separator";

function ItemGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      role="list"
      data-slot="item-group"
      className={cn("group/item-group flex flex-col font-sans", className)}
      {...props}
    />
  );
}

function ItemSeparator({ className, ...props }: React.ComponentProps<typeof Separator>) {
  return (
    <Separator
      data-slot="item-separator"
      orientation="horizontal"
      variant="subtle"
      // Between two items the rule is drawn as the next item's top border instead, so it sits inside
      // that item's minimum height exactly like the pre-migration divided list.
      className={cn("my-0 [&:has(+[data-slot=item])]:h-0", className)}
      {...props}
    />
  );
}

const itemVariants = cva(
  "group/item relative flex min-h-12 flex-wrap items-center gap-3 font-sans text-[1.0625rem] leading-[1.7] text-foreground transition-colors duration-120 ease-out outline-none focus-visible:outline-2 focus-visible:outline-solid focus-visible:-outline-offset-2 focus-visible:outline-ring aria-disabled:pointer-events-none aria-disabled:cursor-not-allowed aria-disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 [[data-slot=item-separator]+&]:border-t [[data-slot=item-separator]+&]:border-border-subtle [a&]:cursor-pointer [a&]:no-underline [a&]:hover:bg-accent [button&]:w-full [button&]:cursor-pointer [button&]:text-left [button&]:hover:bg-accent [&[aria-current]:not([aria-current=false])]:bg-accent [&[aria-current]:not([aria-current=false])]:shadow-[inset_4px_0_0_var(--primary)]",
  {
    variants: {
      variant: {
        default: "bg-transparent",
        outline: "rounded-lg border border-border",
        muted: "rounded-lg bg-surface-subtle",
      },
      size: {
        default: "px-4 py-3",
        sm: "min-h-9 px-3 py-2",
        lg: "min-h-16 p-4",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Item({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof itemVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "div";
  return (
    <Comp
      data-slot="item"
      data-variant={variant}
      data-size={size}
      className={cn(itemVariants({ variant, size, className }))}
      {...props}
    />
  );
}

const itemMediaVariants = cva(
  "flex shrink-0 items-center justify-center gap-2 [&_svg]:pointer-events-none",
  {
    variants: {
      variant: {
        default: "bg-transparent",
        icon: "size-8 rounded-sm border border-border-subtle bg-surface-subtle text-foreground-secondary [&_svg:not([class*='size-'])]:size-4",
        image: "size-10 overflow-hidden rounded-sm [&_img]:size-full [&_img]:object-cover",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

function ItemMedia({
  className,
  variant = "default",
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof itemMediaVariants>) {
  return (
    <div
      data-slot="item-media"
      data-variant={variant}
      className={cn(itemMediaVariants({ variant, className }))}
      {...props}
    />
  );
}

function ItemContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="item-content"
      className={cn(
        "flex min-w-0 flex-1 flex-col gap-1 [&+[data-slot=item-content]]:flex-none",
        className,
      )}
      {...props}
    />
  );
}

function ItemTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="item-title"
      className={cn(
        // Plain text truncates to one line; a title holding elements (icon, badge) lays them out in a row.
        "max-w-full truncate font-sans text-[1.0625rem] leading-[1.35] font-medium text-foreground has-[>*]:flex has-[>*]:w-fit has-[>*]:items-center has-[>*]:gap-2",
        className,
      )}
      {...props}
    />
  );
}

function ItemDescription({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="item-description"
      className={cn(
        "truncate font-sans text-[0.8125rem] leading-[1.35] font-normal text-muted-foreground",
        "[&>a]:underline [&>a]:underline-offset-4 [&>a:hover]:text-foreground-link-hover",
        className,
      )}
      {...props}
    />
  );
}

function ItemActions({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="item-actions"
      className={cn(
        "ml-auto flex shrink-0 items-center gap-2 text-[0.8125rem] text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
}

function ItemHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="item-header"
      className={cn("flex basis-full items-center justify-between gap-2", className)}
      {...props}
    />
  );
}

function ItemFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="item-footer"
      className={cn("flex basis-full items-center justify-between gap-2", className)}
      {...props}
    />
  );
}

export {
  Item,
  ItemMedia,
  ItemContent,
  ItemActions,
  ItemGroup,
  ItemSeparator,
  ItemTitle,
  ItemDescription,
  ItemHeader,
  ItemFooter,
};
