"use client";

import * as React from "react";
import { SplitButton } from "@/registry/new-york/split-button/split-button";

/**
 * The split-button is an overlay: the chevron half toggles a dropdown panel,
 * which manages controlled open state and roving keyboard focus, so it must run
 * in a client component. The wide half fires onAction; choosing a menu item
 * fires onSelect. Menu items come from SplitButton.Item children or an `items`
 * prop.
 */

// Basic: a primary action plus alternative actions as SplitButton.Item children.
export function SplitButtonBasicDemo() {
  const [last, setLast] = React.useState<string>("");
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "var(--hbd-space-3, 0.75rem)",
        alignItems: "flex-start",
      }}
    >
      <SplitButton
        label="Save"
        onAction={() => setLast("Save (primary action)")}
        onSelect={(detail) => setLast(detail.label)}
      >
        <SplitButton.Item value="save-as">Save as…</SplitButton.Item>
        <SplitButton.Item value="save-copy">Save a copy</SplitButton.Item>
        <SplitButton.Item value="save-template">Save as template</SplitButton.Item>
      </SplitButton>
      <small>Last triggered: {last || "—"}</small>
    </div>
  );
}

// Variants — the variant is shared by both halves.
export function SplitButtonVariantsDemo() {
  const items = [
    { value: "pdf", label: "Export as PDF" },
    { value: "png", label: "Export as PNG" },
    { value: "svg", label: "Export as SVG" },
  ];
  return (
    <>
      <SplitButton label="Default" variant="default" items={items} />
      <SplitButton label="Primary" variant="primary" items={items} />
      <SplitButton label="Gold" variant="gold" items={items} />
    </>
  );
}

// Sizes — also shared by both halves.
export function SplitButtonSizesDemo() {
  const items = [
    { value: "now", label: "Publish now" },
    { value: "schedule", label: "Schedule…" },
  ];
  return (
    <>
      <SplitButton label="Small" size="sm" items={items} />
      <SplitButton label="Medium" size="md" items={items} />
      <SplitButton label="Large" size="lg" items={items} />
    </>
  );
}

// States — a disabled split-button and one with a disabled menu item.
export function SplitButtonStatesDemo() {
  return (
    <>
      <SplitButton label="Disabled" disabled items={[{ value: "x", label: "Unavailable" }]} />
      <SplitButton label="Deploy">
        <SplitButton.Item value="staging">To staging</SplitButton.Item>
        <SplitButton.Item value="production">To production</SplitButton.Item>
        <SplitButton.Item value="rollback" disabled>
          Rollback (no history)
        </SplitButton.Item>
      </SplitButton>
    </>
  );
}
