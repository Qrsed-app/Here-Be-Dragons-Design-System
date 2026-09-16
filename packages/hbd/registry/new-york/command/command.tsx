"use client";

import * as React from "react";
import { Command as CommandPrimitive } from "cmdk";
import { SearchIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/registry/new-york/dialog/dialog";

function Command({ className, ...props }: React.ComponentProps<typeof CommandPrimitive>) {
  return (
    <CommandPrimitive
      data-slot="command"
      className={cn(
        "flex h-full w-full flex-col overflow-hidden rounded-md bg-popover font-sans text-popover-foreground",
        className,
      )}
      {...props}
    />
  );
}

function CommandDialog({
  title = "Command Palette",
  description = "Search for a command to run...",
  children,
  className,
  showCloseButton = true,
  ...props
}: React.ComponentProps<typeof Dialog> & {
  title?: string;
  description?: string;
  className?: string;
  showCloseButton?: boolean;
}) {
  return (
    <Dialog {...props}>
      <DialogHeader className="sr-only">
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{description}</DialogDescription>
      </DialogHeader>
      <DialogContent
        // The dialog's close button normally claims a header row; here it floats over the right end
        // of the search band instead.
        className={cn(
          "gap-0 overflow-hidden p-0 [&>[data-slot=dialog-close]]:absolute [&>[data-slot=dialog-close]]:top-2.5 [&>[data-slot=dialog-close]]:right-3 [&>[data-slot=dialog-close]]:m-0",
          className,
        )}
        showCloseButton={showCloseButton}
      >
        <Command
          className={cn(
            "rounded-none **:data-[slot=command-input-wrapper]:h-14 **:data-[slot=command-input-wrapper]:bg-transparent **:data-[slot=command-list]:max-h-[min(22rem,60vh)]",
            showCloseButton && "**:data-[slot=command-input-wrapper]:pr-14",
          )}
        >
          {children}
        </Command>
      </DialogContent>
    </Dialog>
  );
}

function CommandInput({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Input>) {
  return (
    <div
      data-slot="command-input-wrapper"
      className="flex h-11 items-center gap-2 border-b border-border-subtle bg-background px-3"
    >
      <SearchIcon className="size-4 shrink-0 text-muted-foreground" />
      <CommandPrimitive.Input
        data-slot="command-input"
        className={cn(
          "flex h-10 w-full min-w-0 bg-transparent py-1 font-sans text-[1.0625rem] text-foreground outline-hidden placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:text-foreground-disabled",
          className,
        )}
        {...props}
      />
    </div>
  );
}

function CommandList({ className, ...props }: React.ComponentProps<typeof CommandPrimitive.List>) {
  return (
    <CommandPrimitive.List
      data-slot="command-list"
      className={cn(
        "max-h-[280px] scroll-py-1 overflow-x-hidden overflow-y-auto overscroll-contain",
        className,
      )}
      {...props}
    />
  );
}

function CommandEmpty({ ...props }: React.ComponentProps<typeof CommandPrimitive.Empty>) {
  return (
    <CommandPrimitive.Empty
      data-slot="command-empty"
      className="px-4 py-3 text-center font-sans text-[1.0625rem] text-muted-foreground"
      {...props}
    />
  );
}

function CommandGroup({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Group>) {
  return (
    <CommandPrimitive.Group
      data-slot="command-group"
      className={cn(
        "overflow-hidden py-1 text-foreground [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-2 [&_[cmdk-group-heading]]:font-sans [&_[cmdk-group-heading]]:text-[0.6875rem] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:tracking-[0.3em] [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group-heading]]:uppercase",
        className,
      )}
      {...props}
    />
  );
}

function CommandSeparator({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Separator>) {
  return (
    <CommandPrimitive.Separator
      data-slot="command-separator"
      className={cn("h-px bg-border-subtle", className)}
      {...props}
    />
  );
}

// `data-checked` is a Here Be Dragons styling hook: mark the item holding the current value to get
// the select's gold-edged "chosen" row. `data-selected` is cmdk's keyboard/pointer highlight.
function CommandItem({ className, ...props }: React.ComponentProps<typeof CommandPrimitive.Item>) {
  return (
    <CommandPrimitive.Item
      data-slot="command-item"
      className={cn(
        "relative flex min-h-10 cursor-pointer items-center gap-2 px-3 py-2 font-sans text-[1.0625rem] text-foreground outline-hidden transition-[background-color] duration-120 ease-out select-none hover:bg-accent data-[checked=true]:bg-accent data-[checked=true]:font-medium data-[checked=true]:shadow-[inset_3px_0_0_var(--gold-deep)] data-[disabled=true]:pointer-events-none data-[disabled=true]:cursor-not-allowed data-[disabled=true]:text-foreground-disabled data-[selected=true]:outline-2 data-[selected=true]:-outline-offset-2 data-[selected=true]:outline-ring data-[selected=true]:outline-solid [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 [&_svg:not([class*='text-'])]:text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
}

function CommandShortcut({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="command-shortcut"
      className={cn(
        "ml-auto shrink-0 font-mono text-[0.6875rem] tracking-normal text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
}

export {
  Command,
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
  CommandSeparator,
};
