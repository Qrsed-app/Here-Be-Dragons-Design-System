"use client";

import * as React from "react";
import {
  ContextMenu,
  type ContextMenuSelectDetail,
} from "@/registry/new-york/context-menu/context-menu";

/**
 * The right-clickable host area shared across demos. Right-click (or long-press
 * on touch) anywhere inside to open the menu at the cursor.
 */
function Target({ children, label }: { children?: React.ReactNode; label: string }) {
  return (
    <div
      style={{
        display: "grid",
        placeItems: "center",
        minHeight: "8rem",
        minWidth: "18rem",
        padding: "var(--hbd-space-6, 1.5rem)",
        border: "1px dashed var(--hbd-color-border-default, var(--color-fd-border))",
        borderRadius: "var(--hbd-radius-lg, 0.5rem)",
        background: "var(--hbd-color-surface-sunken, transparent)",
        font: "var(--hbd-font-ui, inherit)",
        textAlign: "center",
        userSelect: "none",
        cursor: "context-menu",
      }}
    >
      <div>
        <strong>{label}</strong>
        {children}
      </div>
    </div>
  );
}

/** Basic context menu with icons, a separator, and a destructive item. */
export function ContextMenuBasicDemo() {
  const [last, setLast] = React.useState<ContextMenuSelectDetail | null>(null);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--hbd-space-3, 0.75rem)" }}>
      <ContextMenu onSelect={setLast}>
        <Target label="Right-click this chart">
          <div style={{ marginTop: "var(--hbd-space-2, 0.5rem)", opacity: 0.7 }}>
            (long-press on touch)
          </div>
        </Target>
        <ContextMenu.Item value="copy" icon="⧉" shortcut="⌘C">
          Copy
        </ContextMenu.Item>
        <ContextMenu.Item value="duplicate" icon="⎘" shortcut="⌘D">
          Duplicate
        </ContextMenu.Item>
        <ContextMenu.Item value="rename" icon="✎">
          Rename
        </ContextMenu.Item>
        <ContextMenu.Separator />
        <ContextMenu.Item value="delete" icon="🗑" destructive shortcut="⌫">
          Delete
        </ContextMenu.Item>
      </ContextMenu>
      <span style={{ font: "var(--hbd-font-ui, inherit)" }}>
        Last action: {last ? `${last.label} (${last.value})` : "(none)"}
      </span>
    </div>
  );
}

/** Grouped items with labelled sections and a disabled entry. */
export function ContextMenuGroupedDemo() {
  return (
    <ContextMenu onSelect={() => {}}>
      <Target label="Right-click the map" />
      <ContextMenu.Group label="View">
        <ContextMenu.Item value="zoom-in" shortcut="+">
          Zoom in
        </ContextMenu.Item>
        <ContextMenu.Item value="zoom-out" shortcut="−">
          Zoom out
        </ContextMenu.Item>
        <ContextMenu.Item value="fit">Fit to screen</ContextMenu.Item>
      </ContextMenu.Group>
      <ContextMenu.Separator />
      <ContextMenu.Group label="Edit">
        <ContextMenu.Item value="add-marker">Add marker</ContextMenu.Item>
        <ContextMenu.Item value="measure" disabled>
          Measure (coming soon)
        </ContextMenu.Item>
      </ContextMenu.Group>
    </ContextMenu>
  );
}

/** A disabled menu — the trigger no longer opens on right-click. */
export function ContextMenuDisabledDemo() {
  return (
    <ContextMenu disabled onSelect={() => {}}>
      <Target label="Right-click disabled">
        <div style={{ marginTop: "var(--hbd-space-2, 0.5rem)", opacity: 0.7 }}>(no menu opens)</div>
      </Target>
      <ContextMenu.Item value="noop">Unavailable</ContextMenu.Item>
    </ContextMenu>
  );
}
