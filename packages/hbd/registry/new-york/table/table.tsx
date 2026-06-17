"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/registry/new-york/checkbox/checkbox";

// Ported from ds/components/hbd-table.js + ds/styles/components/table.css.
// Data table with sortable headers, optional row selection (checkbox column),
// sticky header / sticky first column, striped/bordered variants, and three
// sizes. The React markup re-emits the EXACT legacy .hbd-table* markup, ARIA
// (role="grid", role="row/columnheader/gridcell", aria-sort, aria-rowindex,
// aria-colcount/rowcount, aria-selected, aria-multiselectable) and the roving-
// tabindex grid keyboard pattern from hbd-table.js so the de-shadowed table.css
// reproduces the HBD look 1:1. Tailwind utilities are NOT used for the visual
// design — the token-backed component CSS is.
//
// Data is supplied via the `columns` + `rows` props (the WC's JS-property API).
// Sorting and selection are controlled-first (sortKey/sortDir + onSort,
// selected + onSelectionChange) with uncontrolled fallbacks
// (defaultSortKey/defaultSortDir/defaultSelected) via the inline
// useControllableState helper.

// ── useControllableState (inline, controlled-first w/ uncontrolled fallback) ──
function useControllableState<T>({
  value,
  defaultValue,
  onChange,
}: {
  value: T | undefined;
  defaultValue: T;
  onChange?: (next: T) => void;
}): [T, (next: T) => void] {
  const isControlled = value !== undefined;
  const [uncontrolled, setUncontrolled] = React.useState<T>(defaultValue);
  const current = isControlled ? (value as T) : uncontrolled;

  const setValue = React.useCallback(
    (next: T) => {
      if (!isControlled) setUncontrolled(next);
      onChange?.(next);
    },
    [isControlled, onChange],
  );

  return [current, setValue];
}

export type TableSize = "sm" | "md" | "lg";
export type SortDirection = "asc" | "desc";
export type ColumnAlign = "left" | "right" | "center";
export type SortType = "string" | "number";

export interface TableColumn<R = TableRow> {
  /** Property key on each row used to read the cell value. */
  key: string;
  /** Visible column header label. */
  label?: string;
  /** Per-column sortable opt-in/out. See `sortable` table flag for default. */
  sortable?: boolean;
  /** Forces numeric comparison when sorting this column. */
  sortType?: SortType;
  /** Text alignment for header + body cells. */
  align?: ColumnAlign;
  /** Fixed column width (any CSS length), applied to the header cell. */
  width?: string;
}

export interface TableRow {
  /** Stable row identity; also the selection key. */
  id: string | number;
  /** Renders the row dimmed + non-interactive. */
  disabled?: boolean;
  [key: string]: unknown;
}

export interface SortDetail {
  key: string;
  direction: SortDirection;
}

export interface SelectionChangeDetail {
  selected: string[];
}

export interface TableProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "onSelect"> {
  /** Column definitions (the WC `.columns` property). */
  columns: TableColumn[];
  /** Row data (the WC `.rows` property). Each row needs a unique `id`. */
  rows: TableRow[];
  /** Row height / density. */
  size?: TableSize;
  /** Renders the leading row-selection checkbox column. */
  selectable?: boolean;
  /** Table-wide convenience flag — every column not opted out becomes sortable. */
  sortable?: boolean;
  /** Outer hairline border around the scroll wrapper. */
  bordered?: boolean;
  /** Zebra-striped even rows. */
  striped?: boolean;
  /** Sticks the first data column to the left edge while scrolling. */
  stickyCol?: boolean;
  /** Text shown when `rows` is empty. */
  emptyText?: string;
  /** Accessible name for the table (aria-label). */
  label?: string;

  /** Controlled active sort column. Pair with onSort. */
  sortKey?: string | null;
  /** Uncontrolled initial sort column. */
  defaultSortKey?: string | null;
  /** Controlled active sort direction. */
  sortDir?: SortDirection;
  /** Uncontrolled initial sort direction. */
  defaultSortDir?: SortDirection;
  /** Fired on header activation (hbd:sort) with { key, direction }. */
  onSort?: (detail: SortDetail) => void;

  /** Controlled set of selected row ids (as strings). Pair with onSelectionChange. */
  selected?: string[];
  /** Uncontrolled initial selection. */
  defaultSelected?: string[];
  /** Fired on selection change (hbd:selection-change) with { selected }. */
  onSelectionChange?: (detail: SelectionChangeDetail) => void;
}

const sizeClass: Record<TableSize, string> = {
  sm: "hbd-table-wrap--sm",
  md: "",
  lg: "hbd-table-wrap--lg",
};

// ── SVG glyphs (carried verbatim from hbd-table.js) ──────────────────────────
function SortTriangleSvg() {
  // Up-pointing triangle. The --sorted-desc class rotates it.
  return (
    <svg viewBox="0 0 12 12" width="12" height="12" fill="currentColor" aria-hidden="true">
      <polygon points="6 3 10 9 2 9" />
    </svg>
  );
}

function SortBothSvg() {
  // Neutral double-arrow for unsorted columns.
  return (
    <svg viewBox="0 0 12 12" width="12" height="12" fill="currentColor" aria-hidden="true">
      <polygon points="6 2 9 5 3 5" />
      <polygon points="6 10 3 7 9 7" />
    </svg>
  );
}

const Table = React.forwardRef<HTMLDivElement, TableProps>(
  (
    {
      className,
      columns,
      rows,
      size = "md",
      selectable = false,
      sortable = false,
      bordered = false,
      striped = false,
      stickyCol = false,
      emptyText = "No data",
      label = "Data table",
      sortKey: sortKeyProp,
      defaultSortKey = null,
      sortDir: sortDirProp,
      defaultSortDir = "asc",
      onSort,
      selected: selectedProp,
      defaultSelected,
      onSelectionChange,
      ...props
    },
    ref,
  ) => {
    const [sortKey, setSortKey] = useControllableState<string | null>({
      value: sortKeyProp,
      defaultValue: defaultSortKey,
    });
    const [sortDir, setSortDir] = useControllableState<SortDirection>({
      value: sortDirProp,
      defaultValue: defaultSortDir,
    });

    const [selected, setSelected] = useControllableState<string[]>({
      value: selectedProp,
      defaultValue: defaultSelected ?? [],
    });
    const selectedSet = React.useMemo(() => new Set(selected), [selected]);

    // Roving tabindex active cell { row, col }. row 0 = header.
    const [activeCell, setActiveCell] = React.useState<{ row: number; col: number }>({
      row: 0,
      col: 0,
    });
    const tableRef = React.useRef<HTMLTableElement>(null);

    // ── Sorting (mirrors WC _sortedRows) ─────────────────────────────────────
    const sortedRows = React.useMemo(() => {
      if (!sortKey) return rows.slice();
      const key = sortKey;
      const dir = sortDir === "desc" ? -1 : 1;
      const col = columns.find((c) => c.key === key);
      const sortType = col && col.sortType;
      return rows.slice().sort((a, b) => {
        const av = a[key] as unknown;
        const bv = b[key] as unknown;
        // null/undefined sort to the end regardless of direction.
        if (av == null && bv == null) return 0;
        if (av == null) return 1;
        if (bv == null) return -1;
        if (sortType === "number" || (typeof av === "number" && typeof bv === "number")) {
          return ((av as number) - (bv as number)) * dir;
        }
        return (
          String(av).localeCompare(String(bv), undefined, {
            numeric: true,
            sensitivity: "base",
          }) * dir
        );
      });
    }, [rows, columns, sortKey, sortDir]);

    const doSort = React.useCallback(
      (key: string) => {
        let nextKey = key;
        let nextDir: SortDirection;
        if (sortKey === key) {
          nextDir = sortDir === "asc" ? "desc" : "asc";
        } else {
          nextKey = key;
          nextDir = "asc";
        }
        setSortKey(nextKey);
        setSortDir(nextDir);
        onSort?.({ key: nextKey, direction: nextDir });
      },
      [sortKey, sortDir, setSortKey, setSortDir, onSort],
    );

    // ── Selection (mirrors WC _toggleRow / _toggleAll) ───────────────────────
    const fireSelection = React.useCallback(
      (nextSet: Set<string>) => {
        const arr = [...nextSet];
        setSelected(arr);
        onSelectionChange?.({ selected: arr });
      },
      [setSelected, onSelectionChange],
    );

    const toggleRow = React.useCallback(
      (rowId: string) => {
        const next = new Set(selectedSet);
        if (next.has(rowId)) next.delete(rowId);
        else next.add(rowId);
        fireSelection(next);
      },
      [selectedSet, fireSelection],
    );

    const toggleAll = React.useCallback(
      (checked: boolean) => {
        const next = checked ? new Set(rows.map((r) => String(r.id))) : new Set<string>();
        fireSelection(next);
      },
      [rows, fireSelection],
    );

    // ── Derived header selection state ───────────────────────────────────────
    const allSelected =
      sortedRows.length > 0 && sortedRows.every((r) => selectedSet.has(String(r.id)));
    const someSelected = !allSelected && sortedRows.some((r) => selectedSet.has(String(r.id)));

    const colCount = columns.length + (selectable ? 1 : 0);
    const maxRow = rows.length; // 0 = header, 1..N data
    const maxCol = colCount - 1;

    // ── Roving tabindex helpers ──────────────────────────────────────────────
    const cellAt = React.useCallback((row: number, col: number): HTMLElement | null => {
      const table = tableRef.current;
      if (!table) return null;
      if (row === 0) {
        return table.querySelector<HTMLElement>(`.hbd-table__head [data-grid-col="${col}"]`);
      }
      return table.querySelector<HTMLElement>(
        `.hbd-table__body [data-grid-row="${row}"][data-grid-col="${col}"]`,
      );
    }, []);

    // Reset active cell to the header when the data/columns identity changes,
    // mirroring the WC's columns-setter behaviour.
    React.useEffect(() => {
      setActiveCell({ row: 0, col: 0 });
    }, [columns]);

    // Keep the active cell valid after a sort/selection change; fall back to
    // the first header if it vanished (WC _applyRovingTabindex fallback).
    React.useEffect(() => {
      if (!cellAt(activeCell.row, activeCell.col) && cellAt(0, 0)) {
        setActiveCell({ row: 0, col: 0 });
      }
    });

    const tabIndexFor = (row: number, col: number) =>
      activeCell.row === row && activeCell.col === col ? 0 : -1;

    // ── Grid keyboard navigation (mirrors WC _onKeydown) ─────────────────────
    const onKeyDown = (e: React.KeyboardEvent<HTMLTableElement>) => {
      const targetEl = e.target as HTMLElement;

      // Sortable header activation — Enter / Space toggle the sort.
      const header = targetEl.closest?.(".hbd-table__header--sortable") as HTMLElement | null;
      if (
        header &&
        tableRef.current?.contains(header) &&
        (e.key === "Enter" || e.key === " " || e.key === "Spacebar") &&
        !targetEl.closest?.(".hbd-checkbox")
      ) {
        e.preventDefault();
        const key = header.getAttribute("data-col-key");
        if (key) doSort(key);
        return;
      }

      // Grid navigation — only for arrow / Home / End keys on a cell/header.
      const cell = targetEl.closest?.("[data-grid-row], [data-grid-col]") as HTMLElement | null;
      if (!cell || !tableRef.current?.contains(cell)) return;
      if (cell.matches("input, button, a, select, textarea") && e.key === "Tab") {
        return;
      }

      let row = parseInt(cell.getAttribute("data-grid-row") || "0", 10);
      const col = parseInt(cell.getAttribute("data-grid-col") || "0", 10);
      if (cell.tagName === "TH") row = 0;

      let nextRow = row;
      let nextCol = col;
      let handled = false;

      switch (e.key) {
        case "ArrowRight":
          nextCol = Math.min(col + 1, maxCol);
          handled = true;
          break;
        case "ArrowLeft":
          nextCol = Math.max(col - 1, 0);
          handled = true;
          break;
        case "ArrowDown":
          nextRow = Math.min(row + 1, maxRow);
          handled = true;
          break;
        case "ArrowUp":
          nextRow = Math.max(row - 1, 0);
          handled = true;
          break;
        case "Home":
          if (e.ctrlKey) {
            nextRow = 0;
            nextCol = 0;
          } else nextCol = 0;
          handled = true;
          break;
        case "End":
          if (e.ctrlKey) {
            nextRow = maxRow;
            nextCol = maxCol;
          } else nextCol = maxCol;
          handled = true;
          break;
        default:
          break;
      }
      if (!handled) return;
      if (nextRow === row && nextCol === col) return;

      e.preventDefault();
      setActiveCell({ row: nextRow, col: nextCol });
      const next = cellAt(nextRow, nextCol);
      if (next) next.focus({ preventScroll: false });
    };

    // Header click → sort (mirrors WC _onClick).
    const onClick = (e: React.MouseEvent<HTMLTableElement>) => {
      const targetEl = e.target as HTMLElement;
      const header = targetEl.closest?.(".hbd-table__header--sortable") as HTMLElement | null;
      if (header && tableRef.current?.contains(header)) {
        if (targetEl.closest?.(".hbd-checkbox")) return;
        const key = header.getAttribute("data-col-key");
        if (key) doSort(key);
      }
    };

    // ── Wrapper classes ──────────────────────────────────────────────────────
    const wrapClass = cn(
      "hbd-table-wrap",
      sizeClass[size],
      bordered && "hbd-table-wrap--bordered",
      striped && "hbd-table-wrap--striped",
      className,
    );

    const totalRows = sortedRows.length + 1; // header counted
    const isEmpty = sortedRows.length === 0;

    return (
      <div ref={ref} className={wrapClass} {...props}>
        <table
          ref={tableRef}
          className="hbd-table"
          role="grid"
          aria-label={label}
          aria-rowcount={totalRows}
          aria-colcount={colCount}
          aria-multiselectable={selectable ? true : undefined}
          onClick={onClick}
          onKeyDown={onKeyDown}
        >
          <thead className="hbd-table__head">
            <tr className="hbd-table__row" role="row" aria-rowindex={1}>
              {selectable ? (
                <th
                  className="hbd-table__header hbd-table__check"
                  scope="col"
                  role="columnheader"
                  data-grid-col={0}
                  tabIndex={tabIndexFor(0, 0)}
                >
                  <Checkbox
                    aria-label="Select all rows"
                    checked={allSelected}
                    indeterminate={someSelected}
                    onCheckedChange={({ checked }) => toggleAll(checked)}
                  />
                </th>
              ) : null}

              {columns.map((c, ci) => {
                const colIndex = ci + (selectable ? 1 : 0);
                // Column is sortable when either the table-wide flag is set and
                // the column hasn't opted out, OR it explicitly opts in.
                const isSortable = (sortable && c.sortable !== false) || c.sortable === true;
                const isActiveSort = sortKey === c.key;
                const ariaSort: React.AriaAttributes["aria-sort"] | undefined = isActiveSort
                  ? sortDir === "asc"
                    ? "ascending"
                    : "descending"
                  : isSortable
                    ? "none"
                    : undefined;

                return (
                  <th
                    key={c.key}
                    className={cn(
                      "hbd-table__header",
                      isSortable && "hbd-table__header--sortable",
                      isActiveSort &&
                        (sortDir === "asc"
                          ? "hbd-table__header--sorted-asc"
                          : "hbd-table__header--sorted-desc"),
                      stickyCol && ci === 0 && "hbd-table__header--sticky",
                      c.align === "right" && "hbd-table__header--align-right",
                      c.align === "center" && "hbd-table__header--align-center",
                    )}
                    scope="col"
                    role="columnheader"
                    data-grid-col={colIndex}
                    data-col-key={c.key}
                    tabIndex={tabIndexFor(0, colIndex)}
                    aria-sort={ariaSort}
                    style={c.width ? { width: c.width } : undefined}
                  >
                    {c.label || ""}
                    {isSortable ? (
                      <span className="hbd-table__sort-icon" aria-hidden="true">
                        {isActiveSort ? <SortTriangleSvg /> : <SortBothSvg />}
                      </span>
                    ) : null}
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody className="hbd-table__body">
            {isEmpty ? (
              <tr className="hbd-table__empty" role="row">
                <td colSpan={colCount}>{emptyText}</td>
              </tr>
            ) : (
              sortedRows.map((r, ri) => {
                const rowId = String(r.id);
                const isSel = selectedSet.has(rowId);
                // aria-rowindex is 1-based and includes the header row, so the
                // first data row is rowindex=2.
                const ariaRowIndex = ri + 2;
                const gridRow = ri + 1; // header occupies row 0

                return (
                  <tr
                    key={rowId}
                    className={cn(
                      "hbd-table__row",
                      isSel && "hbd-table__row--selected",
                      isSel && "is-selected",
                      r.disabled && "hbd-table__row--disabled",
                    )}
                    role="row"
                    data-row-id={rowId}
                    aria-rowindex={ariaRowIndex}
                    aria-selected={isSel ? "true" : "false"}
                  >
                    {selectable ? (
                      <td
                        className="hbd-table__cell hbd-table__check"
                        role="gridcell"
                        data-grid-row={gridRow}
                        data-grid-col={0}
                        tabIndex={tabIndexFor(gridRow, 0)}
                      >
                        <Checkbox
                          data-row-id={rowId}
                          aria-label={`Select row ${rowId}`}
                          checked={isSel}
                          onCheckedChange={() => toggleRow(rowId)}
                        />
                      </td>
                    ) : null}

                    {columns.map((c, ci) => {
                      const colIndex = ci + (selectable ? 1 : 0);
                      const raw = r[c.key];
                      const display = raw == null ? "" : String(raw);
                      return (
                        <td
                          key={c.key}
                          className={cn(
                            "hbd-table__cell",
                            stickyCol && ci === 0 && "hbd-table__cell--sticky",
                            c.align === "right" && "hbd-table__cell--align-right",
                            c.align === "center" && "hbd-table__cell--align-center",
                          )}
                          role="gridcell"
                          data-grid-row={gridRow}
                          data-grid-col={colIndex}
                          data-label={c.label || ""}
                          tabIndex={tabIndexFor(gridRow, colIndex)}
                          title={display}
                        >
                          {display}
                        </td>
                      );
                    })}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    );
  },
);
Table.displayName = "Table";

export { Table };
