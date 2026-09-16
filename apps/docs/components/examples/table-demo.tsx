"use client";

import * as React from "react";

import { Checkbox } from "@/registry/new-york/checkbox/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/registry/new-york/table/table";

type Ship = { id: string; name: string; captain: string; crew: number; status: string };

const ships: Ship[] = [
  { id: "1", name: "The Kraken", captain: "Elara Voss", crew: 48, status: "At sea" },
  { id: "2", name: "Dawn Treader", captain: "Marek Tide", crew: 31, status: "In port" },
  { id: "3", name: "Salt Wraith", captain: "Yara Finch", crew: 22, status: "At sea" },
  { id: "4", name: "Gilded Maw", captain: "Osric Vane", crew: 60, status: "Drydock" },
];

const columns = [
  { key: "name", label: "Vessel" },
  { key: "captain", label: "Captain" },
  { key: "crew", label: "Crew" },
  { key: "status", label: "Status" },
] as const;

type SortKey = (typeof columns)[number]["key"];

function SortIcon({ active }: { active: boolean }) {
  return active ? (
    <svg viewBox="0 0 12 12" fill="currentColor" aria-hidden="true">
      <polygon points="6 3 10 9 2 9" />
    </svg>
  ) : (
    <svg viewBox="0 0 12 12" fill="currentColor" aria-hidden="true">
      <polygon points="6 2 9 5 3 5" />
      <polygon points="6 10 3 7 9 7" />
    </svg>
  );
}

export function TableDataDemo() {
  const [sort, setSort] = React.useState<{ key: SortKey; dir: "asc" | "desc" }>({
    key: "crew",
    dir: "asc",
  });
  const [selected, setSelected] = React.useState<string[]>(["1"]);

  const rows = React.useMemo(
    () =>
      [...ships].sort((a, b) => {
        const av = a[sort.key];
        const bv = b[sort.key];
        const order =
          typeof av === "number" && typeof bv === "number"
            ? av - bv
            : String(av).localeCompare(String(bv));
        return sort.dir === "asc" ? order : -order;
      }),
    [sort],
  );

  const toggleSort = (key: SortKey) =>
    setSort((current) => ({
      key,
      dir: current.key === key && current.dir === "asc" ? "desc" : "asc",
    }));

  const allSelected = selected.length === ships.length;

  return (
    <div className="flex w-full flex-col gap-3">
      <Table bordered aria-label="Fleet">
        <TableHeader>
          <TableRow>
            <TableHead>
              <Checkbox
                aria-label="Select all rows"
                checked={allSelected ? true : selected.length > 0 ? "indeterminate" : false}
                onCheckedChange={(checked) =>
                  setSelected(checked === true ? ships.map((s) => s.id) : [])
                }
              />
            </TableHead>
            {columns.map((column) => {
              const active = sort.key === column.key;
              return (
                <TableHead
                  key={column.key}
                  tabIndex={0}
                  aria-sort={active ? (sort.dir === "asc" ? "ascending" : "descending") : "none"}
                  className={column.key === "crew" ? "text-right" : undefined}
                  onClick={() => toggleSort(column.key)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      toggleSort(column.key);
                    }
                  }}
                >
                  {column.label}
                  <SortIcon active={active} />
                </TableHead>
              );
            })}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((ship) => {
            const isSelected = selected.includes(ship.id);
            return (
              <TableRow key={ship.id} data-state={isSelected ? "selected" : undefined}>
                <TableCell>
                  <Checkbox
                    aria-label={`Select ${ship.name}`}
                    checked={isSelected}
                    onCheckedChange={(checked) =>
                      setSelected((current) =>
                        checked === true
                          ? [...current, ship.id]
                          : current.filter((id) => id !== ship.id),
                      )
                    }
                  />
                </TableCell>
                <TableCell>{ship.name}</TableCell>
                <TableCell>{ship.captain}</TableCell>
                <TableCell className="text-right">{ship.crew}</TableCell>
                <TableCell>{ship.status}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      <p className="font-sans text-[0.8125rem] text-muted-foreground">
        {selected.length} of {ships.length} selected
      </p>
    </div>
  );
}
