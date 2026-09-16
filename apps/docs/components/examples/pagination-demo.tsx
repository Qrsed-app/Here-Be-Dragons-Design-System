"use client";

import * as React from "react";

import { Button } from "@/registry/new-york/button/button";
import { Input } from "@/registry/new-york/input/input";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationInfo,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/registry/new-york/pagination/pagination";

/** The page range the pre-migration pagination drew: 1, the current page ± siblings, and the last. */
function pageRange(page: number, total: number, siblings = 1): Array<number | "ellipsis"> {
  if (total <= 1) return [1];
  const out: Array<number | "ellipsis"> = [1];
  const left = Math.max(2, page - siblings);
  const right = Math.min(total - 1, page + siblings);
  if (left > 2) out.push("ellipsis");
  for (let i = left; i <= right; i++) out.push(i);
  if (right < total - 1) out.push("ellipsis");
  out.push(total);
  return out;
}

export function PaginationControlledDemo() {
  const [page, setPage] = React.useState(4);
  const total = 10;
  const go = (next: number) => (event: React.MouseEvent) => {
    event.preventDefault();
    setPage(Math.max(1, Math.min(next, total)));
  };

  return (
    <div className="flex w-full flex-col items-center gap-3">
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious href="#" aria-disabled={page === 1} onClick={go(page - 1)} />
          </PaginationItem>
          {pageRange(page, total).map((entry, i) =>
            entry === "ellipsis" ? (
              <PaginationItem key={`ellipsis-${i}`}>
                <PaginationEllipsis />
              </PaginationItem>
            ) : (
              <PaginationItem key={entry}>
                <PaginationLink
                  href="#"
                  isActive={entry === page}
                  aria-label={
                    entry === page ? `Page ${entry}, current page` : `Go to page ${entry}`
                  }
                  onClick={go(entry)}
                >
                  {entry}
                </PaginationLink>
              </PaginationItem>
            ),
          )}
          <PaginationItem>
            <PaginationNext href="#" aria-disabled={page === total} onClick={go(page + 1)} />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
      <p className="m-0 font-sans text-sm text-muted-foreground">
        Current page: <strong className="text-foreground">{page}</strong>
      </p>
    </div>
  );
}

const selectClass =
  "h-9 rounded-md border border-border-strong bg-background px-1 font-sans text-[0.8125rem] font-medium text-foreground outline-none focus-visible:border-input-focus focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

export function PaginationToolbarDemo() {
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(20);
  const [goto, setGoto] = React.useState("");
  const totalRecords = 248;
  const total = Math.max(1, Math.ceil(totalRecords / pageSize));
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(totalRecords, page * pageSize);

  return (
    <div className="grid w-full grid-cols-[1fr_auto_auto] items-center gap-2">
      <div className="flex min-w-0 items-center gap-2">
        <PaginationInfo className="tabular-nums" aria-live="polite">
          Showing {from}–{to} of {totalRecords}
        </PaginationInfo>
        <span aria-hidden className="text-muted-foreground select-none">
          ·
        </span>
        <label className="flex items-center gap-1 font-sans text-[0.8125rem] whitespace-nowrap text-foreground-secondary">
          Show
          <select
            className={selectClass}
            value={pageSize}
            aria-label="Items per page"
            onChange={(event) => {
              setPageSize(Number(event.target.value));
              setPage(1);
            }}
          >
            {[10, 20, 50, 100].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
          per page
        </label>
      </div>

      <Pagination className="mx-0 w-auto">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              href="#"
              aria-disabled={page === 1}
              onClick={(event) => {
                event.preventDefault();
                setPage((p) => Math.max(1, p - 1));
              }}
            />
          </PaginationItem>
          <PaginationItem>
            <PaginationInfo className="px-2" aria-live="polite">
              Page {page} of {total}
            </PaginationInfo>
          </PaginationItem>
          <PaginationItem>
            <PaginationNext
              href="#"
              aria-disabled={page === total}
              onClick={(event) => {
                event.preventDefault();
                setPage((p) => Math.min(total, p + 1));
              }}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>

      <form
        className="flex items-center gap-1 font-sans text-[0.8125rem] whitespace-nowrap text-foreground-secondary"
        onSubmit={(event) => {
          event.preventDefault();
          const n = Number.parseInt(goto, 10);
          if (Number.isFinite(n)) setPage(Math.max(1, Math.min(n, total)));
          setGoto("");
        }}
      >
        <label htmlFor="pagination-goto">Page</label>
        <Input
          id="pagination-goto"
          type="number"
          min={1}
          max={total}
          inputMode="numeric"
          value={goto}
          onChange={(event) => setGoto(event.target.value)}
          className="h-9 min-h-0 w-[3.375rem] px-1 text-center font-mono text-[0.8125rem] font-medium [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        />
        <Button
          type="submit"
          variant="ghost"
          className="h-9 border-transparent px-2 font-sans text-[0.8125rem] font-medium tracking-normal text-foreground-secondary normal-case hover:bg-surface-subtle hover:text-foreground"
        >
          Go
        </Button>
      </form>
    </div>
  );
}
