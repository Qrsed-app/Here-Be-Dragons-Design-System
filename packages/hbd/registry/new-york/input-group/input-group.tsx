"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";
import { Button } from "@/registry/new-york/button/button";
import { Input } from "@/registry/new-york/input/input";
import { Textarea } from "@/registry/new-york/textarea/textarea";

function InputGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="input-group"
      role="group"
      className={cn(
        "group/input-group relative flex w-full min-w-0 items-center rounded-md border border-border-strong bg-background font-sans transition-[border-color,box-shadow] duration-120 ease-out outline-none",
        "has-[>textarea]:h-auto",

        // Variants based on alignment.
        "has-[>[data-align=inline-start]]:[&>input]:pl-0",
        "has-[>[data-align=inline-end]]:[&>input]:pr-0",
        "has-[>[data-align=block-start]]:h-auto has-[>[data-align=block-start]]:flex-col has-[>[data-align=block-start]]:[&>input]:pb-3",
        "has-[>[data-align=block-end]]:h-auto has-[>[data-align=block-end]]:flex-col has-[>[data-align=block-end]]:[&>input]:pt-3",

        // Focus state. outline-solid: the control's outline-none would otherwise leave no style.
        "has-[[data-slot=input-group-control]:focus-visible]:border-input-focus has-[[data-slot=input-group-control]:focus-visible]:outline-2 has-[[data-slot=input-group-control]:focus-visible]:outline-offset-2 has-[[data-slot=input-group-control]:focus-visible]:outline-ring has-[[data-slot=input-group-control]:focus-visible]:outline-solid",

        // Error and success states. Tailwind orders same-kind has-[] variants by their
        // selector text, which puts these after the focus rules above.
        "has-[[data-slot][aria-invalid=true]]:border-error-border has-[[data-slot=input-group-control][aria-invalid=true]:focus-visible]:outline-error-border",
        "has-[[data-slot][data-valid=true]]:border-success-border has-[[data-slot=input-group-control][data-valid=true]:focus-visible]:outline-success-border",

        // Disabled and read-only surfaces.
        "has-[[data-slot=input-group-control]:disabled]:border-border-subtle has-[[data-slot=input-group-control]:disabled]:bg-surface-subtle",
        "has-[[data-slot=input-group-control][readonly]]:bg-surface-subtle",

        className,
      )}
      {...props}
    />
  );
}

const inputGroupAddonVariants = cva(
  "flex h-auto cursor-text items-center justify-center gap-2 py-1.5 font-sans text-[1.0625rem] leading-[1.7] font-normal text-muted-foreground select-none group-data-[disabled=true]/input-group:opacity-50 [&>kbd]:rounded-sm [&>svg:not([class*='size-'])]:size-4",
  {
    variants: {
      align: {
        // The old absolutely positioned prefix sat 12px from the outer border edge and the
        // text started at 37px: an 11px inset inside the 1px border plus a 36px minimum slot
        // reproduces both, while longer addons still keep an 8px gap to the text.
        "inline-start": "order-first min-w-9 justify-start ps-[11px] pe-2",
        "inline-end": "order-last min-w-9 justify-end ps-2 pe-[11px]",
        "block-start":
          "order-first w-full justify-start px-3 pt-3 group-has-[>input]/input-group:pt-2.5 [.border-b]:pb-3",
        "block-end":
          "order-last w-full justify-start px-3 pb-3 group-has-[>input]/input-group:pb-2.5 [.border-t]:pt-3",
      },
    },
    defaultVariants: {
      align: "inline-start",
    },
  },
);

function InputGroupAddon({
  className,
  align = "inline-start",
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof inputGroupAddonVariants>) {
  return (
    <div
      role="group"
      data-slot="input-group-addon"
      data-align={align}
      className={cn(inputGroupAddonVariants({ align }), className)}
      onClick={(e) => {
        if ((e.target as HTMLElement).closest("button")) {
          return;
        }
        e.currentTarget.parentElement?.querySelector("input")?.focus();
      }}
      {...props}
    />
  );
}

const inputGroupButtonVariants = cva(
  "flex items-center gap-2 py-0 shadow-none focus-visible:outline-solid",
  {
    variants: {
      size: {
        xs: "h-6 gap-1 rounded-sm px-2 leading-none has-[>svg]:px-2 [&_svg:not([class*='size-'])]:size-3.5",
        sm: "h-8 gap-1.5 rounded-sm px-2.5 leading-none has-[>svg]:px-2.5",
        "icon-xs": "size-6 rounded-sm p-0 has-[>svg]:p-0 [&_svg:not([class*='size-'])]:size-[18px]",
        "icon-sm": "size-8 rounded-sm p-0 has-[>svg]:p-0",
      },
    },
    defaultVariants: {
      size: "xs",
    },
  },
);

function InputGroupButton({
  className,
  type = "button",
  variant = "ghost",
  size = "xs",
  ...props
}: Omit<React.ComponentProps<typeof Button>, "size"> &
  VariantProps<typeof inputGroupButtonVariants>) {
  return (
    <Button
      type={type}
      data-size={size}
      variant={variant}
      className={cn(
        inputGroupButtonVariants({ size }),
        variant === "ghost" && "text-muted-foreground hover:bg-transparent hover:text-foreground",
        className,
      )}
      {...props}
    />
  );
}

function InputGroupText({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      className={cn(
        "flex items-center gap-2 font-sans text-[1.0625rem] leading-[1.7] text-muted-foreground [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      {...props}
    />
  );
}

function InputGroupInput({ className, ...props }: React.ComponentProps<typeof Input>) {
  return (
    <Input
      data-slot="input-group-control"
      className={cn(
        "min-h-0 flex-1 rounded-none border-0 bg-transparent focus-visible:outline-none",
        className,
      )}
      {...props}
    />
  );
}

function InputGroupTextarea({ className, ...props }: React.ComponentProps<typeof Textarea>) {
  return (
    <Textarea
      data-slot="input-group-control"
      className={cn(
        "flex-1 resize-none rounded-none border-0 bg-transparent py-3 focus-visible:outline-none",
        className,
      )}
      {...props}
    />
  );
}

export {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupText,
  InputGroupInput,
  InputGroupTextarea,
};
