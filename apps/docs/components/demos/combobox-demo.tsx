"use client";

import * as React from "react";
import { Combobox } from "@/registry/new-york/combobox/combobox";

/**
 * Autocomplete (free text) — the default mode. Suggestions filter as the user
 * types; any text is permitted. State is reflected live below.
 */
export function ComboboxAutocompleteDemo() {
  const [value, setValue] = React.useState("");

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "var(--hbd-space-3, 0.75rem)",
        minWidth: "16rem",
      }}
    >
      <Combobox
        label="Port of call"
        placeholder="Search a port…"
        value={value}
        onValueChange={setValue}
        hint="Type to filter, or enter free text."
      >
        <Combobox.Option value="lisbon">Lisbon</Combobox.Option>
        <Combobox.Option value="cadiz">Cádiz</Combobox.Option>
        <Combobox.Option value="tangier">Tangier</Combobox.Option>
        <Combobox.Option value="valletta">Valletta</Combobox.Option>
        <Combobox.Option value="constantinople">Constantinople</Combobox.Option>
      </Combobox>
      <span style={{ font: "var(--hbd-font-ui, inherit)" }}>Value: {value || "(empty)"}</span>
    </div>
  );
}

/**
 * Strict mode — only a listed value is valid. A typed value that matches no
 * option reverts on blur and fires onInvalidInput. Grouped options are
 * supported via Combobox.Group.
 */
export function ComboboxStrictDemo() {
  return (
    <div style={{ minWidth: "16rem" }}>
      <Combobox
        mode="strict"
        label="Vessel class"
        placeholder="Pick a class…"
        defaultValue="caravel"
        hint="Must match a listed class."
      >
        <Combobox.Group label="Sail">
          <Combobox.Option value="caravel">Caravel</Combobox.Option>
          <Combobox.Option value="carrack">Carrack</Combobox.Option>
          <Combobox.Option value="galleon">Galleon</Combobox.Option>
        </Combobox.Group>
        <Combobox.Group label="Oar">
          <Combobox.Option value="galley">Galley</Combobox.Option>
          <Combobox.Option value="longship" disabled>
            Longship (unavailable)
          </Combobox.Option>
        </Combobox.Group>
      </Combobox>
    </div>
  );
}

/**
 * Multi mode — selections render as removable chips inside the input.
 * Backspace on an empty input removes the last chip.
 */
export function ComboboxMultiDemo() {
  const [values, setValues] = React.useState<{ value: string; label: string }[]>([
    { value: "rum", label: "Rum" },
  ]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "var(--hbd-space-3, 0.75rem)",
        minWidth: "18rem",
      }}
    >
      <Combobox
        mode="multi"
        label="Provisions"
        placeholder="Add provisions…"
        values={values}
        onValuesChange={setValues}
      >
        <Combobox.Option value="hardtack">Hardtack</Combobox.Option>
        <Combobox.Option value="rum">Rum</Combobox.Option>
        <Combobox.Option value="limes">Limes</Combobox.Option>
        <Combobox.Option value="salt-pork">Salt pork</Combobox.Option>
        <Combobox.Option value="gunpowder">Gunpowder</Combobox.Option>
      </Combobox>
      <span style={{ font: "var(--hbd-font-ui, inherit)" }}>
        Selected: {values.length ? values.map((v) => v.label).join(", ") : "(none)"}
      </span>
    </div>
  );
}

/** Sizes — sm, md (default), lg share the same option set. */
export function ComboboxSizesDemo() {
  const sizes = ["sm", "md", "lg"] as const;
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "var(--hbd-space-4, 1rem)",
        minWidth: "16rem",
      }}
    >
      {sizes.map((size) => (
        <Combobox key={size} size={size} label={`Size ${size}`} placeholder="Search a wind…">
          <Combobox.Option value="trade">Trade wind</Combobox.Option>
          <Combobox.Option value="monsoon">Monsoon</Combobox.Option>
          <Combobox.Option value="gale">Gale</Combobox.Option>
        </Combobox>
      ))}
    </div>
  );
}

/** States — error and disabled. */
export function ComboboxStatesDemo() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "var(--hbd-space-4, 1rem)",
        minWidth: "16rem",
      }}
    >
      <Combobox
        label="Destination"
        placeholder="Search…"
        required
        error="Choose a destination before setting sail."
      >
        <Combobox.Option value="indies">The Indies</Combobox.Option>
        <Combobox.Option value="cathay">Cathay</Combobox.Option>
      </Combobox>
      <Combobox label="Locked route" placeholder="Search…" disabled defaultValue="indies">
        <Combobox.Option value="indies">The Indies</Combobox.Option>
        <Combobox.Option value="cathay">Cathay</Combobox.Option>
      </Combobox>
    </div>
  );
}
