import * as React from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { buttonVariants, type Button } from "@/registry/new-york/button/button";

function Pagination({ className, ...props }: React.ComponentProps<"nav">) {
  return (
    <nav
      role="navigation"
      aria-label="pagination"
      data-slot="pagination"
      className={cn("mx-auto flex w-full items-center justify-center font-sans", className)}
      {...props}
    />
  );
}

function PaginationContent({ className, ...props }: React.ComponentProps<"ul">) {
  return (
    <ul
      data-slot="pagination-content"
      className={cn("m-0 flex list-none flex-row items-center gap-1 p-0", className)}
      {...props}
    />
  );
}

function PaginationItem({ className, ...props }: React.ComponentProps<"li">) {
  return (
    <li
      data-slot="pagination-item"
      className={cn("flex items-center justify-center", className)}
      {...props}
    />
  );
}

type PaginationLinkProps = {
  isActive?: boolean;
} & Pick<React.ComponentProps<typeof Button>, "size"> &
  React.ComponentProps<"a">;

function PaginationLink({ className, isActive, size = "icon", ...props }: PaginationLinkProps) {
  return (
    <a
      aria-current={isActive ? "page" : undefined}
      data-slot="pagination-link"
      data-active={isActive}
      className={cn(
        buttonVariants({ variant: isActive ? "outline" : "ghost", size }),
        "h-9 gap-1 rounded-md border border-transparent bg-transparent p-0 font-sans text-[0.8125rem] leading-[1.7] font-medium tracking-normal whitespace-nowrap text-foreground-secondary normal-case transition-[background-color,color,border-color] duration-120 ease-out select-none hover:bg-surface-subtle hover:text-foreground focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
        typeof size === "string" && size.startsWith("icon") ? "w-9" : "min-w-9 px-2",
        // The boundary arrows stay focusable with aria-disabled, as the HBD pagination always has.
        "aria-disabled:pointer-events-none aria-disabled:bg-transparent aria-disabled:text-foreground-disabled aria-disabled:opacity-100",
        "data-[active=true]:pointer-events-none data-[active=true]:cursor-default data-[active=true]:border-blood-deep data-[active=true]:bg-primary data-[active=true]:font-semibold data-[active=true]:text-primary-foreground",
        className,
      )}
      {...props}
    />
  );
}

// strokeWidth 2.4 on the 24px grid is the 1.6px stroke of the HBD chevron at 16px.
function PaginationPrevious({ className, ...props }: React.ComponentProps<typeof PaginationLink>) {
  return (
    <PaginationLink aria-label="Go to previous page" className={cn(className)} {...props}>
      <ChevronLeftIcon strokeWidth={2.4} />
      <span className="sr-only">Previous</span>
    </PaginationLink>
  );
}

function PaginationNext({ className, ...props }: React.ComponentProps<typeof PaginationLink>) {
  return (
    <PaginationLink aria-label="Go to next page" className={cn(className)} {...props}>
      <ChevronRightIcon strokeWidth={2.4} />
      <span className="sr-only">Next</span>
    </PaginationLink>
  );
}

// The doubled chevrons are the HBD glyph, drawn on the 12px grid the rest of the row uses.
function DoubleChevron({ back }: { back?: boolean }) {
  return (
    <svg
      className="size-3"
      viewBox="0 0 12 12"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={back ? "M10 2L6 6l4 4M5 2L1 6l4 4" : "M2 2l4 4-4 4M7 2l4 4-4 4"} />
    </svg>
  );
}

function PaginationFirst({ className, ...props }: React.ComponentProps<typeof PaginationLink>) {
  return (
    <PaginationLink aria-label="Go to first page" className={cn(className)} {...props}>
      <DoubleChevron back />
      <span className="sr-only">First</span>
    </PaginationLink>
  );
}

function PaginationLast({ className, ...props }: React.ComponentProps<typeof PaginationLink>) {
  return (
    <PaginationLink aria-label="Go to last page" className={cn(className)} {...props}>
      <DoubleChevron />
      <span className="sr-only">Last</span>
    </PaginationLink>
  );
}

function PaginationEllipsis({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      aria-hidden
      data-slot="pagination-ellipsis"
      className={cn(
        "flex size-9 cursor-default items-center justify-center font-sans text-[0.8125rem] leading-[1.7] text-muted-foreground select-none",
        className,
      )}
      {...props}
    >
      …<span className="sr-only">More pages</span>
    </span>
  );
}

function PaginationInfo({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="pagination-info"
      className={cn(
        "font-sans text-[0.8125rem] leading-[1.7] whitespace-nowrap text-foreground-secondary",
        className,
      )}
      {...props}
    />
  );
}

export {
  Pagination,
  PaginationContent,
  PaginationLink,
  PaginationItem,
  PaginationPrevious,
  PaginationNext,
  PaginationFirst,
  PaginationLast,
  PaginationEllipsis,
  PaginationInfo,
};
