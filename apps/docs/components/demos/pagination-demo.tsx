"use client";

import * as React from "react";
import { Pagination } from "@/registry/new-york/pagination/pagination";

/**
 * Uncontrolled full pagination — clicking a page or prev/next updates the
 * internal page state and animates the slide. `defaultPage` seeds the start.
 */
export function PaginationFullDemo() {
  return <Pagination total={10} defaultPage={4} aria-label="Search results" />;
}

/** Compact variant — prev/next around a live "Page N of M" label. */
export function PaginationCompactDemo() {
  return <Pagination variant="compact" total={8} defaultPage={3} />;
}

/** Simple variant — arrow-only prev/next. */
export function PaginationSimpleDemo() {
  return <Pagination variant="simple" total={8} defaultPage={3} />;
}

/** First/last jump buttons plus a wider page range via `siblings`. */
export function PaginationFirstLastDemo() {
  return <Pagination total={20} defaultPage={10} siblings={2} showFirstLast />;
}

/**
 * Fully controlled — the current page lives in React. `onPageChange` gives the
 * new page; the value below stays in sync with the control.
 */
export function PaginationControlledDemo() {
  const [page, setPage] = React.useState(1);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "var(--hbd-space-3, 0.75rem)",
        alignItems: "flex-start",
      }}
    >
      <Pagination page={page} total={12} onPageChange={setPage} />
      <span style={{ font: "var(--hbd-font-ui, inherit)" }}>Current page: {page}</span>
    </div>
  );
}

/**
 * Full toolbar — records readout, a page-size select, and the "Page … Go"
 * cluster. Page-size changes reset the page to 1 and fire onPageSizeChange.
 */
export function PaginationToolbarDemo() {
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(20);
  const totalRecords = 248;
  const total = Math.max(1, Math.ceil(totalRecords / pageSize));

  return (
    <Pagination
      page={page}
      total={total}
      totalRecords={totalRecords}
      pageSize={pageSize}
      pageSizeOptions={[10, 20, 50, 100]}
      showGoto
      onPageChange={setPage}
      onPageSizeChange={({ pageSize: next }) => {
        setPageSize(next);
        setPage(1);
      }}
    />
  );
}
