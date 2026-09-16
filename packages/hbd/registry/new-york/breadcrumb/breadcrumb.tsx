import * as React from "react";
import { Slot } from "radix-ui";

import { cn } from "@/lib/utils";

function Breadcrumb({ ...props }: React.ComponentProps<"nav">) {
  return <nav aria-label="breadcrumb" data-slot="breadcrumb" {...props} />;
}

function BreadcrumbList({ className, ...props }: React.ComponentProps<"ol">) {
  return (
    <ol
      data-slot="breadcrumb-list"
      className={cn("m-0 flex list-none flex-wrap items-center gap-1 p-0 break-words", className)}
      {...props}
    />
  );
}

function BreadcrumbItem({ className, ...props }: React.ComponentProps<"li">) {
  return (
    <li
      data-slot="breadcrumb-item"
      className={cn("inline-flex items-center gap-1", className)}
      {...props}
    />
  );
}

function BreadcrumbLink({
  asChild,
  className,
  ...props
}: React.ComponentProps<"a"> & {
  asChild?: boolean;
}) {
  const Comp = asChild ? Slot.Root : "a";

  return (
    <Comp
      data-slot="breadcrumb-link"
      className={cn(
        "border-b border-transparent font-display text-[0.8125rem] tracking-wider whitespace-nowrap text-foreground-secondary no-underline transition-[color,border-bottom-color] duration-120 ease-out outline-none hover:border-foreground hover:text-foreground focus-visible:border-transparent focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
        className,
      )}
      {...props}
    />
  );
}

function BreadcrumbPage({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="breadcrumb-page"
      role="link"
      aria-disabled="true"
      aria-current="page"
      className={cn(
        "cursor-default font-display text-[0.8125rem] tracking-wider whitespace-nowrap text-foreground",
        className,
      )}
      {...props}
    />
  );
}

function BreadcrumbSeparator({ children, className, ...props }: React.ComponentProps<"li">) {
  return (
    <li
      data-slot="breadcrumb-separator"
      role="presentation"
      aria-hidden="true"
      className={cn(
        "px-1 text-xs leading-none text-muted-foreground select-none [&>svg]:size-3.5",
        className,
      )}
      {...props}
    >
      {children ?? "›"}
    </li>
  );
}

function BreadcrumbEllipsis({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="breadcrumb-ellipsis"
      role="presentation"
      aria-hidden="true"
      className={cn(
        "inline-flex min-h-6 min-w-6 items-center justify-center px-1 font-display text-[0.8125rem] tracking-wider text-foreground-secondary",
        className,
      )}
      {...props}
    >
      …<span className="sr-only">More</span>
    </span>
  );
}

export {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbEllipsis,
};
