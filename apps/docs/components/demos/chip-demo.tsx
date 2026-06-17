"use client";

import * as React from "react";
import { Chip } from "@/registry/new-york/chip/chip";

/** Selectable (toggle) chips — controlled via aria-pressed. */
export function ChipSelectableDemo() {
  const filters = ["Dragons", "Maps", "Lore", "Sea Monsters"];
  const [selected, setSelected] = React.useState<string[]>(["Dragons"]);

  const toggle = (label: string, next: boolean) => {
    setSelected((prev) => (next ? [...prev, label] : prev.filter((l) => l !== label)));
  };

  return (
    <>
      {filters.map((label) => (
        <Chip
          key={label}
          selectable
          selected={selected.includes(label)}
          onToggle={({ selected: next }) => toggle(label, next)}
        >
          {label}
        </Chip>
      ))}
    </>
  );
}

/** Removable chips — dismissing a chip drops it from the list. */
export function ChipRemovableDemo() {
  const [tags, setTags] = React.useState(["Compass", "Astrolabe", "Sextant", "Cartography"]);

  if (tags.length === 0) {
    return (
      <Chip variant="neutral" outline onClick={() => setTags(["Compass"])}>
        Reset tags
      </Chip>
    );
  }

  return (
    <>
      {tags.map((label) => (
        <Chip
          key={label}
          variant="primary"
          removable
          onRemove={() => setTags((prev) => prev.filter((t) => t !== label))}
        >
          {label}
        </Chip>
      ))}
    </>
  );
}
