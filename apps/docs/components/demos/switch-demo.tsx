"use client";

// Switch ships with its own 'use client' directive, so its static prop
// showcases can render inline in server MDX. This wrapper only hosts the
// genuinely interactive example, where state lives in React via
// `checked` + `onCheckedChange`.

import * as React from "react";
import { Switch } from "@/registry/new-york/switch/switch";

/** Fully controlled switch — state lives in React and stays in sync. */
export function SwitchControlledDemo() {
  const [enabled, setEnabled] = React.useState(true);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--hbd-space-3, 0.75rem)" }}>
      <Switch
        checked={enabled}
        onCheckedChange={(checked) => setEnabled(checked)}
        label="Night charts"
        hint="Toggle me — the status below stays in sync."
      />
      <span style={{ font: "var(--hbd-font-ui, inherit)" }}>Status: {enabled ? "on" : "off"}</span>
    </div>
  );
}
