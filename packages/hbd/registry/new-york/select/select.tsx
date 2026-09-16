"use client";

import * as React from "react";
import { ChevronDownIcon, ChevronUpIcon } from "lucide-react";
import { Select as SelectPrimitive } from "radix-ui";

import { cn } from "@/lib/utils";

function Select({ ...props }: React.ComponentProps<typeof SelectPrimitive.Root>) {
  return <SelectPrimitive.Root data-slot="select" {...props} />;
}

function SelectGroup({ ...props }: React.ComponentProps<typeof SelectPrimitive.Group>) {
  return <SelectPrimitive.Group data-slot="select-group" {...props} />;
}

function SelectValue({ ...props }: React.ComponentProps<typeof SelectPrimitive.Value>) {
  return <SelectPrimitive.Value data-slot="select-value" {...props} />;
}

function SelectTrigger({
  className,
  size = "default",
  onClear,
  clearLabel = "Clear selection",
  children,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Trigger> & {
  size?: "sm" | "default" | "lg";
  onClear?: () => void;
  clearLabel?: string;
}) {
  const clear = (event: React.SyntheticEvent<HTMLElement>) => {
    event.preventDefault();
    event.stopPropagation();
    onClear?.();
    event.currentTarget.parentElement?.focus();
  };

  return (
    <SelectPrimitive.Trigger
      data-slot="select-trigger"
      data-size={size}
      className={cn(
        "group/select-trigger flex w-fit cursor-pointer items-center justify-between gap-2 rounded-md border border-border-strong bg-background px-3 py-2 text-left font-sans text-[1.0625rem] whitespace-nowrap text-foreground transition-[border-color,box-shadow] duration-120 ease-out outline-none select-none focus-visible:border-input-focus focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring focus-visible:outline-solid disabled:cursor-not-allowed disabled:border-border-subtle disabled:bg-surface-subtle disabled:text-foreground-disabled aria-invalid:border-error-border aria-invalid:focus-visible:border-error-border aria-invalid:focus-visible:outline-error-border data-[placeholder]:text-muted-foreground data-[size=default]:min-h-11 data-[size=lg]:min-h-13 data-[size=lg]:px-4 data-[size=lg]:py-3 data-[size=sm]:min-h-8 data-[size=sm]:px-2 data-[size=sm]:py-1 data-[size=sm]:text-[0.8125rem] *:data-[slot=select-value]:line-clamp-1 *:data-[slot=select-value]:flex *:data-[slot=select-value]:items-center *:data-[slot=select-value]:gap-2 not-data-[placeholder]:*:data-[slot=select-value]:max-w-full not-data-[placeholder]:*:data-[slot=select-value]:rounded-sm not-data-[placeholder]:*:data-[slot=select-value]:border not-data-[placeholder]:*:data-[slot=select-value]:border-border-ink not-data-[placeholder]:*:data-[slot=select-value]:bg-surface-raised not-data-[placeholder]:*:data-[slot=select-value]:py-1 not-data-[placeholder]:*:data-[slot=select-value]:pl-2 not-data-[placeholder]:*:data-[slot=select-value]:font-display not-data-[placeholder]:*:data-[slot=select-value]:text-[0.8125rem] not-data-[placeholder]:*:data-[slot=select-value]:tracking-wider not-data-[placeholder]:*:data-[slot=select-value]:text-foreground not-data-[placeholder]:*:data-[slot=select-value]:shadow-[1px_1px_0_var(--parchment-400)] [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 [&_svg:not([class*='text-'])]:text-muted-foreground",
        // The clear button sits in the chip's widened right padding (see select-clear below).
        onClear
          ? "not-data-[placeholder]:enabled:*:data-[slot=select-value]:pr-7 not-data-[placeholder]:disabled:*:data-[slot=select-value]:pr-1"
          : "not-data-[placeholder]:*:data-[slot=select-value]:pr-1",
        className,
      )}
      {...props}
    >
      {children}
      {onClear ? (
        // A <span role="button">: a real <button> may not nest inside the trigger <button>.
        // -ml-[29px] pulls it back over the chip's padding (8px gap + 21px); mr-auto keeps
        // the chevron at the far edge.
        <span
          role="button"
          tabIndex={0}
          data-slot="select-clear"
          aria-label={clearLabel}
          className="mr-auto -ml-[29px] inline-flex size-4 shrink-0 cursor-pointer items-center justify-center rounded-sm text-muted-foreground transition-[background-color,color] duration-120 ease-out outline-none group-disabled/select-trigger:hidden group-data-[placeholder]/select-trigger:hidden hover:bg-surface-subtle hover:text-foreground-emphasis focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring focus-visible:outline-solid"
          onPointerDown={clear}
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") clear(event);
          }}
        >
          <svg viewBox="0 0 10 10" fill="none" aria-hidden="true" className="size-2.5 text-current">
            <path
              d="M2.5 2.5l5 5M7.5 2.5l-5 5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </span>
      ) : null}
      <SelectPrimitive.Icon asChild>
        <svg
          viewBox="0 0 14 14"
          fill="none"
          className="size-3.5 text-muted-foreground transition-transform duration-120 ease-out group-data-[state=open]/select-trigger:rotate-180"
        >
          <path
            d="M3 5l4 4 4-4"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  );
}

function SelectContent({
  className,
  children,
  position = "item-aligned",
  align = "center",
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Content>) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        data-slot="select-content"
        className={cn(
          "relative z-50 max-h-[min(17.5rem,var(--radix-select-content-available-height))] min-w-[8rem] origin-(--radix-select-content-transform-origin) overflow-x-hidden overflow-y-auto overscroll-contain rounded-md border border-border-subtle bg-popover font-sans text-popover-foreground shadow-lg data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95",
          position === "popper" &&
            "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1",
          className,
        )}
        position={position}
        align={align}
        {...props}
      >
        <SelectScrollUpButton />
        <SelectPrimitive.Viewport
          className={cn(
            "py-1",
            position === "popper" &&
              "h-[var(--radix-select-trigger-height)] w-full min-w-[calc(var(--radix-select-trigger-width)-2px)] scroll-my-1",
          )}
        >
          {children}
        </SelectPrimitive.Viewport>
        <SelectScrollDownButton />
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  );
}

function SelectLabel({ className, ...props }: React.ComponentProps<typeof SelectPrimitive.Label>) {
  return (
    <SelectPrimitive.Label
      data-slot="select-label"
      className={cn(
        "px-3 py-2 font-sans text-[0.6875rem] font-semibold tracking-[0.3em] text-muted-foreground uppercase",
        className,
      )}
      {...props}
    />
  );
}

function SelectItem({
  className,
  children,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Item>) {
  return (
    <SelectPrimitive.Item
      data-slot="select-item"
      className={cn(
        "relative flex min-h-10 w-full cursor-pointer items-center gap-2 py-2 pr-8 pl-3 font-sans text-[1.0625rem] text-foreground outline-hidden transition-[background-color] duration-120 ease-out select-none hover:bg-accent focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring focus-visible:outline-solid data-[disabled]:pointer-events-none data-[disabled]:cursor-not-allowed data-[disabled]:text-foreground-disabled data-[state=checked]:bg-accent data-[state=checked]:font-medium data-[state=checked]:shadow-[inset_3px_0_0_var(--gold-deep)] [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 [&_svg:not([class*='text-'])]:text-muted-foreground *:[span]:last:flex *:[span]:last:items-center *:[span]:last:gap-2",
        className,
      )}
      {...props}
    >
      <span
        data-slot="select-item-indicator"
        className="absolute right-3 flex size-3 items-center justify-center"
      >
        <SelectPrimitive.ItemIndicator>
          <svg viewBox="0 0 12 12" fill="none" className="size-3 text-foreground-gold">
            <path
              d="M2 6.5l2.5 2.5L10 3.5"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </SelectPrimitive.ItemIndicator>
      </span>
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  );
}

function SelectSeparator({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Separator>) {
  return (
    <SelectPrimitive.Separator
      data-slot="select-separator"
      className={cn("pointer-events-none my-1 h-px bg-border-subtle", className)}
      {...props}
    />
  );
}

function SelectScrollUpButton({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollUpButton>) {
  return (
    <SelectPrimitive.ScrollUpButton
      data-slot="select-scroll-up-button"
      className={cn(
        "flex cursor-default items-center justify-center py-1 text-muted-foreground",
        className,
      )}
      {...props}
    >
      <ChevronUpIcon className="size-4" />
    </SelectPrimitive.ScrollUpButton>
  );
}

function SelectScrollDownButton({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollDownButton>) {
  return (
    <SelectPrimitive.ScrollDownButton
      data-slot="select-scroll-down-button"
      className={cn(
        "flex cursor-default items-center justify-center py-1 text-muted-foreground",
        className,
      )}
      {...props}
    >
      <ChevronDownIcon className="size-4" />
    </SelectPrimitive.ScrollDownButton>
  );
}

export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
};
