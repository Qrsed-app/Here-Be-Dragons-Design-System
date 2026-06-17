"use client";

// The List root itself has no hooks, but a meaningful selection example needs
// useState to track the chosen item, so the interactive demos live here on the
// client. onSelect mirrors the legacy cancelable hbd:select CustomEvent —
// returning false vetoes the activation.

import * as React from "react";
import { List } from "@/registry/new-york/list/list";

const ports = [
  { value: "tortuga", primary: "Tortuga", secondary: "Lawless free port" },
  { value: "nassau", primary: "Nassau", secondary: "Pirate republic" },
  { value: "port-royal", primary: "Port Royal", secondary: "Crown stronghold" },
];

/** Selectable list — clicking (or Enter / Space) updates the chosen value. */
export function ListSelectableDemo() {
  const [selected, setSelected] = React.useState("nassau");

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "var(--hbd-space-3, 0.75rem)",
        width: "100%",
        maxWidth: "28rem",
      }}
    >
      <List bordered divided onSelect={(detail) => setSelected(detail.value)}>
        {ports.map((port) => (
          <List.Item
            key={port.value}
            selectable
            value={port.value}
            selected={selected === port.value}
            primary={port.primary}
            secondary={port.secondary}
          />
        ))}
      </List>
      <p style={{ margin: 0 }}>
        Chosen port: <strong>{selected}</strong>
      </p>
    </div>
  );
}

/** Cancelable select — the locked item vetoes its own activation. */
export function ListVetoDemo() {
  const [selected, setSelected] = React.useState("chart");

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "var(--hbd-space-3, 0.75rem)",
        width: "100%",
        maxWidth: "28rem",
      }}
    >
      <List
        bordered
        onSelect={(detail) => {
          // Veto the sealed scroll: returning false cancels the activation.
          if (detail.value === "sealed") return false;
          setSelected(detail.value);
        }}
      >
        <List.Item
          selectable
          value="chart"
          selected={selected === "chart"}
          primary="Sea chart"
          secondary="Free to read"
        />
        <List.Item
          selectable
          value="sealed"
          primary="Sealed scroll"
          secondary="Activation is vetoed"
        />
        <List.Item
          selectable
          value="logbook"
          selected={selected === "logbook"}
          primary="Captain's logbook"
          secondary="Free to read"
        />
      </List>
      <p style={{ margin: 0 }}>
        Selected: <strong>{selected}</strong>
      </p>
    </div>
  );
}
