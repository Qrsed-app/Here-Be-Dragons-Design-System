"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

function Table({
  className,
  size = "default",
  bordered = false,
  striped = false,
  ...props
}: React.ComponentProps<"table"> & {
  size?: "default" | "sm" | "lg";
  bordered?: boolean;
  striped?: boolean;
}) {
  return (
    <div
      data-slot="table-container"
      data-size={size}
      data-bordered={bordered || undefined}
      data-striped={striped || undefined}
      className="group/table relative w-full overflow-x-auto overscroll-x-contain rounded-md font-sans data-bordered:border data-bordered:border-border-subtle"
    >
      <table
        data-slot="table"
        className={cn(
          "w-full caption-bottom font-sans text-[1.0625rem] text-foreground",
          className,
        )}
        {...props}
      />
    </div>
  );
}

function TableHeader({ className, ...props }: React.ComponentProps<"thead">) {
  return (
    <thead
      data-slot="table-header"
      className={cn(
        "[&_tr]:border-b-2 [&_tr]:border-border-subtle [&_tr]:hover:bg-transparent",
        className,
      )}
      {...props}
    />
  );
}

function TableBody({ className, ...props }: React.ComponentProps<"tbody">) {
  return (
    <tbody
      data-slot="table-body"
      className={cn(
        "[&>tr]:h-12 [&>tr]:bg-background group-data-[size=lg]/table:[&>tr]:h-16 group-data-[size=sm]/table:[&>tr]:h-9 group-data-striped/table:[&>tr:nth-child(even)]:bg-surface-subtle group-data-striped/table:[&>tr:nth-child(even)]:hover:bg-surface-raised",
        className,
      )}
      {...props}
    />
  );
}

function TableFooter({ className, ...props }: React.ComponentProps<"tfoot">) {
  return (
    <tfoot
      data-slot="table-footer"
      className={cn(
        "border-t-2 border-border-subtle bg-surface-subtle font-medium [&>tr]:last:border-b-0",
        className,
      )}
      {...props}
    />
  );
}

function TableRow({ className, ...props }: React.ComponentProps<"tr">) {
  return (
    <tr
      data-slot="table-row"
      className={cn(
        "border-b border-border-subtle transition-colors duration-120 ease-out hover:bg-accent has-aria-expanded:bg-accent aria-disabled:pointer-events-none aria-disabled:opacity-50 data-[state=selected]:bg-[color-mix(in_srgb,var(--primary)_8%,var(--background))]",
        className,
      )}
      {...props}
    />
  );
}

function TableHead({ className, ...props }: React.ComponentProps<"th">) {
  return (
    <th
      data-slot="table-head"
      className={cn(
        "sticky top-0 z-10 h-10 bg-background px-4 text-left align-middle font-display text-[0.8125rem] font-bold tracking-[0.3em] whitespace-nowrap text-muted-foreground uppercase select-none outline-none focus-visible:outline-2 focus-visible:outline-solid focus-visible:-outline-offset-2 focus-visible:outline-ring group-data-[size=sm]/table:px-3 group-data-[size=sm]/table:text-[0.6875rem]",
        // Sortable headers carry aria-sort; the active one turns blood red and a trailing svg is the sort glyph.
        "aria-[sort=ascending]:text-foreground-emphasis aria-[sort=descending]:text-foreground-emphasis [&[aria-sort]]:cursor-pointer [&[aria-sort]]:hover:bg-accent [&[aria-sort]]:hover:text-foreground",
        "[&>svg]:ml-1 [&>svg]:inline-block [&>svg]:align-middle [&>svg]:text-muted-foreground [&>svg]:transition-[rotate,color] [&>svg]:duration-120 [&>svg]:ease-out [&>svg:not([class*='size-'])]:size-3 aria-[sort=ascending]:[&>svg]:text-foreground-emphasis aria-[sort=descending]:[&>svg]:rotate-180 aria-[sort=descending]:[&>svg]:text-foreground-emphasis",
        // A selection checkbox keeps the pre-migration touch target (12px above, below and before the box, 8px after,
        // 4px under), so checkbox rows are 51px tall at every size — sized by content so collapsed borders split alike.
        "[&:has([role=checkbox])]:w-[54px] [&:has([role=checkbox])]:px-3 [&:has([role=checkbox])]:pb-1 [&:has([role=checkbox])]:text-left [&>[role=checkbox]]:my-3 [&>[role=checkbox]]:mr-2 [&>[role=checkbox]]:align-top",
        className,
      )}
      {...props}
    />
  );
}

function TableCell({ className, ...props }: React.ComponentProps<"td">) {
  return (
    <td
      data-slot="table-cell"
      className={cn(
        "max-w-32 truncate px-4 align-middle text-foreground outline-none focus-visible:outline-2 focus-visible:outline-solid focus-visible:-outline-offset-2 focus-visible:outline-ring group-data-[size=sm]/table:px-3 group-data-[size=sm]/table:text-[0.8125rem] [&:has([role=checkbox])]:w-[54px] [&:has([role=checkbox])]:px-3 [&:has([role=checkbox])]:pb-1 [&:has([role=checkbox])]:text-left [&>[role=checkbox]]:my-3 [&>[role=checkbox]]:mr-2 [&>[role=checkbox]]:align-top",
        className,
      )}
      {...props}
    />
  );
}

function TableCaption({ className, ...props }: React.ComponentProps<"caption">) {
  return (
    <caption
      data-slot="table-caption"
      className={cn("mt-4 font-sans text-[0.8125rem] text-muted-foreground", className)}
      {...props}
    />
  );
}

export { Table, TableHeader, TableBody, TableFooter, TableHead, TableRow, TableCell, TableCaption };
