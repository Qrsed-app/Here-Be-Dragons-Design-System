"use client";

import * as React from "react";

import { Chip, ChipRemove, ChipToggle } from "@/registry/new-york/chip/chip";

const INITIAL_TAGS = ["Compass", "Astrolabe", "Sextant", "Cartography"];

export function ChipRemovableDemo() {
  const [tags, setTags] = React.useState(INITIAL_TAGS);

  if (tags.length === 0) {
    return (
      <Chip asChild outline>
        <button type="button" onClick={() => setTags(INITIAL_TAGS)}>
          Reset tags
        </button>
      </Chip>
    );
  }

  return (
    <>
      {tags.map((label) => (
        <Chip key={label} variant="primary">
          {label}
          <ChipRemove
            aria-label={`Remove ${label}`}
            onClick={() => setTags((prev) => prev.filter((tag) => tag !== label))}
          />
        </Chip>
      ))}
    </>
  );
}

const FILTERS = ["Dragons", "Maps", "Lore", "Sea Monsters"];

export function ChipToggleDemo() {
  const [selected, setSelected] = React.useState<string[]>(["Dragons"]);

  return (
    <>
      {FILTERS.map((label) => (
        <ChipToggle
          key={label}
          pressed={selected.includes(label)}
          onPressedChange={(pressed) =>
            setSelected((prev) => (pressed ? [...prev, label] : prev.filter((l) => l !== label)))
          }
        >
          {label}
        </ChipToggle>
      ))}
    </>
  );
}
