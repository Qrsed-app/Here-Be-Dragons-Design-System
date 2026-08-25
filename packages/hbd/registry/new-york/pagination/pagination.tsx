"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Select } from "@/registry/new-york/select/select";

// Ported from ds/components/hbd-pagination.js + ds/styles/components/pagination.css.
//
// Numbered page-navigation control. The host element IS the <nav> landmark
// (role="navigation" + aria-label), exactly as the Light-DOM WC. Three
// variants:
//   full     — numbered pages with prev/next + ellipsis (default)
//   compact  — prev/next + "Page N of M" live label
//   simple   — arrow-only prev/next
//
// Two render modes:
//   button   — items are <button>s; clicks fire onChange/onPageChange and
//              update the controlled `page` (default)
//   link     — items are <a href> when `hrefPrefix` is set; the current
//              page renders as <span aria-current="page">
//
// Disabled prev/next at boundaries are kept FOCUSABLE with aria-disabled
// so keyboard users discover the boundary; clicks are no-ops.
//
// Controlled-first: page + onPageChange + defaultPage via an inline
// useControllableState helper (mirrors the WC's `page` attribute). The
// page-size dropdown REUSES the ported @hbd/select; its change resets the
// page to 1 and fires onPageSizeChange, matching the WC exactly.

// ── useControllableState (inline, controlled-first w/ uncontrolled fallback)
function useControllableState<T>({
  value,
  defaultValue,
  onChange,
}: {
  value?: T;
  defaultValue: T;
  onChange?: (value: T) => void;
}): [T, (next: T) => void, (next: T) => void] {
  const [uncontrolled, setUncontrolled] = React.useState<T>(defaultValue);
  const isControlled = value !== undefined;
  const state = isControlled ? (value as T) : uncontrolled;

  const setState = React.useCallback(
    (next: T) => {
      if (!isControlled) setUncontrolled(next);
      onChange?.(next);
    },
    [isControlled, onChange],
  );

  // Silent uncontrolled reset: updates internal state WITHOUT firing onChange.
  // Mirrors the WC's page-size handler, which sets the `page` attribute back
  // to 1 directly and only dispatches hbd:page-size-change — never hbd:change.
  // When controlled, the parent owns `page` and resets it via onPageSizeChange.
  const setSilent = React.useCallback(
    (next: T) => {
      if (!isControlled) setUncontrolled(next);
    },
    [isControlled],
  );

  return [state, setState, setSilent];
}

export type PaginationVariant = "full" | "compact" | "simple";

// detail payload carried by the legacy hbd:change event.
export interface PaginationChangeDetail {
  page: number;
  total: number;
}

// detail payload carried by the legacy hbd:page-size-change event.
export interface PaginationPageSizeChangeDetail {
  pageSize: number;
  page: number;
  total: number;
}

export interface PaginationProps extends Omit<
  React.HTMLAttributes<HTMLElement>,
  "onChange" | "role"
> {
  /** Controlled current page (1-based). */
  page?: number;
  /** Uncontrolled initial page (1-based). */
  defaultPage?: number;
  /** Total number of pages. */
  total?: number;
  /** Sibling pages shown either side of the current page. */
  siblings?: number;
  /** Visual/behaviour variant. */
  variant?: PaginationVariant;
  /** When set, items render as <a href> with this prefix + the page number. */
  hrefPrefix?: string;
  /** Show first/last jump buttons. */
  showFirstLast?: boolean;
  /** Show the "Page [input] Go" goto cluster (full variant only). */
  showGoto?: boolean;
  /** Total records, for the "Showing X–Y of Z" info readout. */
  totalRecords?: number;
  /** Current page size; required alongside pageSizeOptions to render the select. */
  pageSize?: number;
  /** Page-size choices; required alongside pageSize to render the select. */
  pageSizeOptions?: number[];
  /** Fired on page change with the {page, total} detail (hbd:change). */
  onChange?: (detail: PaginationChangeDetail) => void;
  /** Convenience callback receiving just the new page number. */
  onPageChange?: (page: number) => void;
  /** Fired when the page-size select changes (hbd:page-size-change). */
  onPageSizeChange?: (detail: PaginationPageSizeChangeDetail) => void;
}

const PrevArrow = () => (
  <span className="hbd-pagination__icon" aria-hidden="true">
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <path
        d="M8 2L4 6l4 4"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  </span>
);

const NextArrow = () => (
  <span className="hbd-pagination__icon" aria-hidden="true">
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <path
        d="M4 2l4 4-4 4"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  </span>
);

const FirstArrow = () => (
  <span className="hbd-pagination__icon" aria-hidden="true">
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <path
        d="M10 2L6 6l4 4M5 2L1 6l4 4"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  </span>
);

const LastArrow = () => (
  <span className="hbd-pagination__icon" aria-hidden="true">
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <path
        d="M2 2l4 4-4 4M7 2l4 4-4 4"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  </span>
);

// ── Page-range algorithm (mirrors _getPageRange) ────────────────────────
// Always show: 1, total, current, ±siblings around current. Fill gaps with
// '…' when gap > 1. Ellipsis entries are encoded as the literal "…".
function getPageRange(page: number, total: number, siblings: number): Array<number | "…"> {
  const cur = Math.max(1, Math.min(page, total));
  if (total <= 1) return [1];

  const range: Array<number | "…"> = [];
  const left = Math.max(2, cur - siblings);
  const right = Math.min(total - 1, cur + siblings);

  range.push(1);
  if (left > 2) range.push("…");
  for (let i = left; i <= right; i++) range.push(i);
  if (right < total - 1) range.push("…");
  if (total > 1) range.push(total);
  return range;
}

let uidCounter = 0;

const Pagination = React.forwardRef<HTMLElement, PaginationProps>(
  (
    {
      className,
      page: pageProp,
      defaultPage,
      total: totalProp,
      siblings: siblingsProp,
      variant: variantProp = "full",
      hrefPrefix,
      showFirstLast = false,
      showGoto = false,
      totalRecords,
      pageSize,
      pageSizeOptions,
      "aria-label": ariaLabel,
      onChange,
      onPageChange,
      onPageSizeChange,
      ...props
    },
    ref,
  ) => {
    const uid = React.useMemo(() => `hbd-pagination-${++uidCounter}`, []);

    // Normalise inputs the way the WC getters do.
    const total =
      Number.isFinite(totalProp) && (totalProp as number) > 0 ? Math.floor(totalProp as number) : 1;
    const siblings =
      Number.isFinite(siblingsProp) && (siblingsProp as number) >= 0
        ? Math.floor(siblingsProp as number)
        : 1;
    const variant: PaginationVariant = ["full", "compact", "simple"].includes(variantProp)
      ? variantProp
      : "full";
    const isLink = hrefPrefix != null;

    const normalisePage = (p: number) => (Number.isFinite(p) && p > 0 ? Math.floor(p) : 1);

    const [page, setPage, setPageSilent] = useControllableState<number>({
      value: pageProp != null ? normalisePage(pageProp) : undefined,
      defaultValue: defaultPage != null ? normalisePage(defaultPage) : 1,
      onChange: onPageChange,
    });

    const resolvedTotalRecords =
      Number.isFinite(totalRecords) && (totalRecords as number) >= 0
        ? Math.floor(totalRecords as number)
        : null;
    const resolvedPageSize =
      Number.isFinite(pageSize) && (pageSize as number) > 0 ? Math.floor(pageSize as number) : null;
    const resolvedPageSizeOptions = React.useMemo(() => {
      if (!Array.isArray(pageSizeOptions)) return null;
      const cleaned = pageSizeOptions
        .map((v) => Math.floor(Number(v)))
        .filter((v) => Number.isFinite(v) && v > 0);
      return cleaned.length ? cleaned : null;
    }, [pageSizeOptions]);

    const hostRef = React.useRef<HTMLElement>(null);
    React.useImperativeHandle(ref, () => hostRef.current as HTMLElement);

    // Direction class for the slide-in animation + the per-cell pop. Mirrors
    // the WC's _pendingDirection / .is-paging-* / .is-just-activated logic.
    const [pagingDir, setPagingDir] = React.useState<"forward" | "backward" | null>(null);
    const [poppedPage, setPoppedPage] = React.useState<number | null>(null);
    const pendingFocusRef = React.useRef<number | null>(null);

    const goToButton = React.useCallback(
      (target: number) => {
        const host = hostRef.current;
        if (!host) return;
        const active = host.querySelector<HTMLElement>(
          `button.hbd-pagination__link[data-page="${target}"]`,
        );
        if (active) {
          active.focus({ preventScroll: false });
          return;
        }
        if (target <= 1) {
          host
            .querySelector<HTMLElement>("button.hbd-pagination__prev")
            ?.focus({ preventScroll: false });
          return;
        }
        if (target >= total) {
          host
            .querySelector<HTMLElement>("button.hbd-pagination__next")
            ?.focus({ preventScroll: false });
        }
      },
      [total],
    );

    // After a navigation re-render: restore focus to the new current page
    // button (or prev/next at the boundary), matching _focusPageButton.
    React.useEffect(() => {
      if (pendingFocusRef.current == null) return;
      const target = pendingFocusRef.current;
      pendingFocusRef.current = null;
      const raf = requestAnimationFrame(() => goToButton(target));
      return () => cancelAnimationFrame(raf);
    }, [page, goToButton]);

    const navigate = React.useCallback(
      (rawNext: number) => {
        const next = Math.max(1, Math.min(rawNext, total));
        if (next === page) return;
        pendingFocusRef.current = next;
        setPagingDir(next > page ? "forward" : "backward");
        setPoppedPage(next);
        setPage(next);
        onChange?.({ page: next, total });
      },
      [page, total, setPage, onChange],
    );

    const range = getPageRange(page, total, siblings);

    // Widest possible page-cells row → fixed --_pages-width so prev/next
    // never shift. maxCells = min(total, 2*siblings + 5). (Mirrors
    // _pagesWidthStyle.)
    const maxCells = Math.max(1, Math.min(total, 2 * siblings + 5));
    const pagesWidth = `calc(${maxCells} * var(--hbd-pagination-item-size) + ${Math.max(
      0,
      maxCells - 1,
    )} * var(--hbd-space-1))`;

    const hasExtras =
      variant === "full" &&
      (showGoto ||
        resolvedTotalRecords != null ||
        (resolvedPageSize != null && resolvedPageSizeOptions != null));

    // ── Item renderers ──────────────────────────────────────────────────
    const renderRangeItem = (entry: number | "…", index: number) => {
      if (entry === "…") {
        return (
          <li className="hbd-pagination__item" key={`ellipsis-${index}`}>
            <span className="hbd-pagination__ellipsis" aria-hidden="true">
              …
            </span>
          </li>
        );
      }
      const isActive = entry === page;
      const linkCls = cn("hbd-pagination__link", isActive && "is-active");

      if (isLink) {
        if (isActive) {
          return (
            <li className="hbd-pagination__item" key={`page-${entry}`}>
              <span
                className={cn(linkCls, poppedPage === entry && "is-just-activated")}
                aria-current="page"
                aria-label={`Page ${entry}, current page`}
                onAnimationEnd={() => poppedPage === entry && setPoppedPage(null)}
              >
                {entry}
              </span>
            </li>
          );
        }
        return (
          <li className="hbd-pagination__item" key={`page-${entry}`}>
            <a
              className={linkCls}
              href={`${hrefPrefix}${entry}`}
              aria-label={`Go to page ${entry}`}
            >
              {entry}
            </a>
          </li>
        );
      }

      return (
        <li className="hbd-pagination__item" key={`page-${entry}`}>
          <button
            type="button"
            className={cn(linkCls, isActive && poppedPage === entry && "is-just-activated")}
            data-page={entry}
            aria-label={isActive ? `Page ${entry}, current page` : `Go to page ${entry}`}
            aria-current={isActive ? "page" : undefined}
            onClick={() => navigate(entry)}
            onAnimationEnd={() => isActive && poppedPage === entry && setPoppedPage(null)}
          >
            {entry}
          </button>
        </li>
      );
    };

    type NavKind = "prev" | "next" | "first" | "last";
    const renderNav = (kind: NavKind) => {
      const isPrevLike = kind === "prev" || kind === "first";
      const disabledAtBoundary = isPrevLike ? page <= 1 : page >= total;
      const baseClass = isPrevLike ? "hbd-pagination__prev" : "hbd-pagination__next";
      const extraClass =
        kind === "first" ? "hbd-pagination__first" : kind === "last" ? "hbd-pagination__last" : "";
      const cls = cn(baseClass, extraClass, disabledAtBoundary && "is-disabled");

      const arrow =
        kind === "prev" ? (
          <PrevArrow />
        ) : kind === "next" ? (
          <NextArrow />
        ) : kind === "first" ? (
          <FirstArrow />
        ) : (
          <LastArrow />
        );
      const ariaLabel =
        kind === "prev"
          ? "Previous page"
          : kind === "next"
            ? "Next page"
            : kind === "first"
              ? "First page"
              : "Last page";

      const targetPage =
        kind === "first" ? 1 : kind === "last" ? total : kind === "prev" ? page - 1 : page + 1;

      if (isLink) {
        if (disabledAtBoundary) {
          return (
            <li className="hbd-pagination__item">
              <span className={cls} aria-label={ariaLabel} aria-disabled="true">
                {arrow}
              </span>
            </li>
          );
        }
        return (
          <li className="hbd-pagination__item">
            <a className={cls} href={`${hrefPrefix}${targetPage}`} aria-label={ariaLabel}>
              {arrow}
            </a>
          </li>
        );
      }

      return (
        <li className="hbd-pagination__item">
          <button
            type="button"
            className={cls}
            data-nav={kind}
            aria-label={ariaLabel}
            aria-disabled={disabledAtBoundary ? "true" : "false"}
            onClick={() => {
              if (disabledAtBoundary) return;
              navigate(targetPage);
            }}
          >
            {arrow}
          </button>
        </li>
      );
    };

    // ── Goto cluster ────────────────────────────────────────────────────
    const gotoInputRef = React.useRef<HTMLInputElement>(null);
    const submitGoto = () => {
      const input = gotoInputRef.current;
      if (!input) return;
      const n = parseInt(input.value, 10);
      if (!Number.isFinite(n)) return;
      const next = Math.max(1, Math.min(n, total));
      input.value = "";
      if (next !== page) navigate(next);
    };

    const renderGoto = () => {
      if (!showGoto) return null;
      return (
        <span className="hbd-pagination__goto">
          <label className="hbd-pagination__goto-label" htmlFor={`goto-${uid}`}>
            Page
          </label>
          <input
            ref={gotoInputRef}
            type="number"
            id={`goto-${uid}`}
            className="hbd-pagination__goto-input"
            min={1}
            max={total}
            inputMode="numeric"
            aria-label="Go to page number"
            onKeyDown={(e) => {
              if (e.key !== "Enter") return;
              e.preventDefault();
              submitGoto();
            }}
          />
          <button
            type="button"
            className="hbd-pagination__prev hbd-pagination__goto-go"
            data-nav="go"
            aria-label="Go to page"
            onClick={(e) => {
              e.preventDefault();
              submitGoto();
            }}
          >
            Go
          </button>
        </span>
      );
    };

    // ── Info + page-size cluster ────────────────────────────────────────
    const renderInfo = () => {
      const tr = resolvedTotalRecords;
      if (tr == null) return null;
      const ps = resolvedPageSize;
      if (ps == null || ps <= 0) {
        return (
          <span className="hbd-pagination__info" aria-live="polite">
            {tr} records
          </span>
        );
      }
      const from = tr === 0 ? 0 : (page - 1) * ps + 1;
      const to = Math.min(tr, page * ps);
      return (
        <span className="hbd-pagination__info" aria-live="polite">
          Showing {from}–{to} of {tr}
        </span>
      );
    };

    const handlePageSizeChange = (raw: string) => {
      const newSize = parseInt(raw, 10);
      if (!Number.isFinite(newSize) || newSize <= 0) return;
      if (newSize === resolvedPageSize) return;
      // Reset to page 1 so the user isn't stranded outside the new range.
      // Use the SILENT setter: the WC resets the page attribute internally
      // and dispatches ONLY hbd:page-size-change — it never fires hbd:change
      // (onPageChange) for this reset. (When controlled, the parent resets
      // `page` in response to onPageSizeChange.)
      if (page !== 1) {
        pendingFocusRef.current = null;
        setPageSilent(1);
      }
      onPageSizeChange?.({ pageSize: newSize, page: 1, total });
    };

    const renderPageSize = () => {
      if (resolvedPageSize == null || resolvedPageSizeOptions == null) return null;
      return (
        <span className="hbd-pagination__page-size">
          <span className="hbd-pagination__page-size-label">Show</span>
          <Select
            size="sm"
            flat
            value={String(resolvedPageSize)}
            aria-label="Items per page"
            onValueChange={handlePageSizeChange}
          >
            {resolvedPageSizeOptions.map((n) => (
              <Select.Option key={n} value={String(n)}>
                {n}
              </Select.Option>
            ))}
          </Select>
          <span>per page</span>
        </span>
      );
    };

    const renderInfoPageSize = () => {
      const info = renderInfo();
      const ps = renderPageSize();
      if (!info && !ps) return null;
      return (
        <div className="hbd-pagination__info-group">
          {info}
          {info && ps ? (
            <span className="hbd-pagination__sep" aria-hidden="true">
              ·
            </span>
          ) : null}
          {ps}
        </div>
      );
    };

    // ── Variant bodies ──────────────────────────────────────────────────
    const navList = (
      <ol className="hbd-pagination__list">
        {showFirstLast ? renderNav("first") : null}
        {renderNav("prev")}
        <li
          className="hbd-pagination__item hbd-pagination__pages-wrap"
          style={{ ["--_pages-width" as string]: pagesWidth }}
        >
          <ol className="hbd-pagination__pages">
            {range.map((entry, i) => renderRangeItem(entry, i))}
          </ol>
        </li>
        {renderNav("next")}
        {showFirstLast ? renderNav("last") : null}
      </ol>
    );

    let body: React.ReactNode;
    if (variant === "compact") {
      body = (
        <>
          <ol className="hbd-pagination__list">{renderNav("prev")}</ol>
          <span className="hbd-pagination__label" aria-live="polite" aria-atomic="true">
            Page {page} of {total}
          </span>
          <ol className="hbd-pagination__list">{renderNav("next")}</ol>
        </>
      );
    } else if (variant === "simple") {
      body = (
        <ol className="hbd-pagination__list">
          {renderNav("prev")}
          {renderNav("next")}
        </ol>
      );
    } else if (hasExtras) {
      body = (
        <div className="hbd-pagination__toolbar">
          <div className="hbd-pagination__toolbar-start">{renderInfoPageSize()}</div>
          <div className="hbd-pagination__toolbar-center">{navList}</div>
          <div className="hbd-pagination__toolbar-end">{renderGoto()}</div>
        </div>
      );
    } else {
      body = navList;
    }

    return (
      <nav
        ref={hostRef}
        className={cn(
          "hbd-pagination",
          variant !== "full" && `hbd-pagination--${variant}`,
          hasExtras && "hbd-pagination--has-toolbar",
          pagingDir === "forward" && "is-paging-forward",
          pagingDir === "backward" && "is-paging-backward",
          className,
        )}
        role="navigation"
        aria-label={ariaLabel ?? "Pagination"}
        onAnimationEnd={(e) => {
          // Clear the host paging class once the carousel slide finishes
          // (mirrors the WC's animationend cleanup on .hbd-pagination__pages).
          if ((e.target as HTMLElement).classList.contains("hbd-pagination__pages")) {
            setPagingDir(null);
          }
        }}
        {...props}
      >
        {body}
      </nav>
    );
  },
);
Pagination.displayName = "Pagination";

export { Pagination };
