"use client";

// Table uses React hooks (useState/useMemo/useRef/useEffect/useCallback) but
// ships without its own 'use client' directive, so it cannot render inside
// server MDX. These thin client wrappers host every example — both the prop
// showcases (sorting, variants, sizes) and the genuinely interactive controlled
// selection demo — so the hooks run on the client.

import * as React from "react";
import { Table, type TableColumn, type TableRow } from "@/registry/new-york/table/table";

// ── Shared sample data (a ship's roster) ─────────────────────────────────────
const columns: TableColumn[] = [
  { key: "name", label: "Vessel" },
  { key: "captain", label: "Captain" },
  { key: "crew", label: "Crew", align: "right", sortType: "number" },
  { key: "status", label: "Status" },
];

const rows: TableRow[] = [
  { id: 1, name: "The Kraken", captain: "Elara Voss", crew: 48, status: "At sea" },
  { id: 2, name: "Dawn Treader", captain: "Marek Tide", crew: 31, status: "In port" },
  { id: 3, name: "Salt Wraith", captain: "Yara Finch", crew: 22, status: "At sea" },
  { id: 4, name: "Gilded Maw", captain: "Osric Vane", crew: 60, status: "Drydock" },
];

/** Basic table — columns + rows, default size, no extras. */
export function TableBasicDemo() {
  return <Table columns={columns} rows={rows} />;
}

/** Sortable + bordered: click or focus a header and press Enter/Space to sort. */
export function TableSortableDemo() {
  return <Table columns={columns} rows={rows} sortable bordered defaultSortKey="crew" />;
}

/** Striped variant. */
export function TableStripedDemo() {
  return <Table columns={columns} rows={rows} striped bordered />;
}

/** The three density sizes. */
export function TableSizesDemo() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--hbd-space-6, 1.5rem)" }}>
      <Table columns={columns} rows={rows} size="sm" bordered />
      <Table columns={columns} rows={rows} size="md" bordered />
      <Table columns={columns} rows={rows} size="lg" bordered />
    </div>
  );
}

/** Empty state — no rows, custom emptyText. */
export function TableEmptyDemo() {
  return <Table columns={columns} rows={[]} bordered emptyText="No vessels logged" />;
}

/**
 * Fully controlled row selection — selection lives in React via
 * selected + onSelectionChange, with a live count below.
 */
export function TableSelectableDemo() {
  const [selected, setSelected] = React.useState<string[]>(["1"]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--hbd-space-3, 0.75rem)" }}>
      <Table
        columns={columns}
        rows={rows}
        selectable
        bordered
        selected={selected}
        onSelectionChange={({ selected }) => setSelected(selected)}
      />
      <span style={{ font: "var(--hbd-font-ui, inherit)" }}>
        {selected.length} selected{selected.length ? `: ${selected.join(", ")}` : ""}
      </span>
    </div>
  );
}
