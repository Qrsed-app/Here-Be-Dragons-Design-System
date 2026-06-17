"use client";

import * as React from "react";
import { ToggleGroup, ToggleGroupItem } from "@/registry/new-york/toggle-group/toggle-group";

/**
 * Controlled single-select group (radio-like, one-of-N). The selected value
 * lives in React via value + onValueChange. onValueChange receives the legacy
 * { value } detail shape from the original web component's hbd:change event.
 * Re-selecting the active value never clears it (the radio rule).
 */
export function ToggleGroupSingleDemo() {
  const [value, setValue] = React.useState("grid");

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "var(--hbd-space-3, 0.75rem)",
      }}
    >
      <ToggleGroup
        label="Map view"
        value={value}
        onValueChange={(detail) => setValue(detail.value)}
      >
        <ToggleGroupItem value="grid">Grid</ToggleGroupItem>
        <ToggleGroupItem value="list">List</ToggleGroupItem>
        <ToggleGroupItem value="atlas">Atlas</ToggleGroupItem>
      </ToggleGroup>
      <span style={{ font: "var(--hbd-font-ui, inherit)" }}>Selected: {value}</span>
    </div>
  );
}

/**
 * Controlled multi-select group (independent on/off per button). onValueChange
 * receives the { values } detail shape in multi mode.
 */
export function ToggleGroupMultiDemo() {
  const [values, setValues] = React.useState<string[]>(["bold"]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "var(--hbd-space-3, 0.75rem)",
      }}
    >
      <ToggleGroup
        mode="multi"
        label="Text formatting"
        value={values}
        onValueChange={(detail) => setValues(detail.values)}
      >
        <ToggleGroupItem value="bold">Bold</ToggleGroupItem>
        <ToggleGroupItem value="italic">Italic</ToggleGroupItem>
        <ToggleGroupItem value="underline">Underline</ToggleGroupItem>
      </ToggleGroup>
      <span style={{ font: "var(--hbd-font-ui, inherit)" }}>
        Active: {values.length ? values.join(", ") : "none"}
      </span>
    </div>
  );
}
