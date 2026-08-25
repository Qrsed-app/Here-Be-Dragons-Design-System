"use client";

import * as React from "react";
import { Select, SelectOption, SelectGroup } from "@/registry/new-york/select/select";

/**
 * Basic uncontrolled select with a placeholder. Selecting an option fills the
 * trigger with a removable chip; clearing reverts to the placeholder.
 */
export function SelectBasicDemo() {
  return (
    <div style={{ minWidth: "16rem" }}>
      <Select label="Port of call" placeholder="Choose a port…">
        <SelectOption value="lisbon">Lisbon</SelectOption>
        <SelectOption value="cadiz">Cádiz</SelectOption>
        <SelectOption value="tangier">Tangier</SelectOption>
        <SelectOption value="valletta">Valletta</SelectOption>
        <SelectOption value="constantinople">Constantinople</SelectOption>
      </Select>
    </div>
  );
}

/**
 * Grouped options via SelectGroup. Disabled options are skipped by keyboard
 * navigation and type-to-search.
 */
export function SelectGroupedDemo() {
  return (
    <div style={{ minWidth: "16rem" }}>
      <Select label="Vessel class" placeholder="Pick a class…" defaultValue="caravel">
        <SelectGroup label="Sail">
          <SelectOption value="caravel">Caravel</SelectOption>
          <SelectOption value="carrack">Carrack</SelectOption>
          <SelectOption value="galleon">Galleon</SelectOption>
        </SelectGroup>
        <SelectGroup label="Oar">
          <SelectOption value="galley">Galley</SelectOption>
          <SelectOption value="longship" disabled>
            Longship (unavailable)
          </SelectOption>
        </SelectGroup>
      </Select>
    </div>
  );
}

/** Sizes — sm, md (default), and lg share the same option set. */
export function SelectSizesDemo() {
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
        <Select key={size} size={size} label={`Size ${size}`} placeholder="Choose a wind…">
          <SelectOption value="trade">Trade wind</SelectOption>
          <SelectOption value="monsoon">Monsoon</SelectOption>
          <SelectOption value="gale">Gale</SelectOption>
        </Select>
      ))}
    </div>
  );
}

/** States — hint, error (sets aria-invalid), and disabled. */
export function SelectStatesDemo() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "var(--hbd-space-4, 1rem)",
        minWidth: "16rem",
      }}
    >
      <Select label="Cargo hold" placeholder="Select cargo…" hint="Heavier cargo slows the ship.">
        <SelectOption value="spices">Spices</SelectOption>
        <SelectOption value="silk">Silk</SelectOption>
        <SelectOption value="gold">Gold</SelectOption>
      </Select>
      <Select
        label="Destination"
        placeholder="Select…"
        required
        error="Choose a destination before setting sail."
      >
        <SelectOption value="indies">The Indies</SelectOption>
        <SelectOption value="cathay">Cathay</SelectOption>
      </Select>
      <Select label="Locked route" placeholder="Select…" disabled defaultValue="indies">
        <SelectOption value="indies">The Indies</SelectOption>
        <SelectOption value="cathay">Cathay</SelectOption>
      </Select>
    </div>
  );
}

/**
 * Fully controlled — the value lives in React via value + onValueChange, kept
 * in sync with the state shown below.
 */
export function SelectControlledDemo() {
  const [value, setValue] = React.useState("lisbon");

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "var(--hbd-space-3, 0.75rem)",
        minWidth: "16rem",
      }}
    >
      <Select
        label="Port of call"
        placeholder="Choose a port…"
        value={value}
        onValueChange={setValue}
      >
        <SelectOption value="lisbon">Lisbon</SelectOption>
        <SelectOption value="cadiz">Cádiz</SelectOption>
        <SelectOption value="tangier">Tangier</SelectOption>
      </Select>
      <span style={{ font: "var(--hbd-font-ui, inherit)" }}>Value: {value || "(empty)"}</span>
    </div>
  );
}
