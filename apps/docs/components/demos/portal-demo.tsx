"use client";

import * as React from "react";
import { Portal } from "@/registry/new-york/portal/portal";

/**
 * Portals content into a target element identified by a CSS selector.
 * The button below lives inline; the badge it renders is relocated into
 * the dashed "#portal-target" box via <Portal target="#portal-target">.
 */
export function PortalTargetDemo() {
  const [count, setCount] = React.useState(0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem", width: "100%" }}>
      <button
        type="button"
        onClick={() => setCount((c) => c + 1)}
        style={{
          alignSelf: "flex-start",
          padding: "var(--hbd-space-2, 0.5rem) var(--hbd-space-4, 1rem)",
          borderRadius: "var(--hbd-radius-lg, 0.5rem)",
          border: "1px solid var(--hbd-color-border-default, var(--color-fd-border))",
          background: "var(--hbd-color-surface-default, var(--color-fd-card))",
          color: "var(--hbd-color-text-primary, var(--color-fd-foreground))",
          cursor: "pointer",
        }}
      >
        Send a message through the portal ({count})
      </button>

      {/* Source: this content is NOT rendered here — it teleports below. */}
      <Portal target="#portal-target">
        <p
          style={{ margin: 0, color: "var(--hbd-color-text-primary, var(--color-fd-foreground))" }}
        >
          Teleported content. Clicked <strong>{count}</strong> time(s).
        </p>
      </Portal>

      {/* Destination */}
      <div
        id="portal-target"
        style={{
          border: "1px dashed var(--hbd-color-border-default, var(--color-fd-border))",
          borderRadius: "var(--hbd-radius-lg, 0.5rem)",
          padding: "var(--hbd-space-4, 1rem)",
          minHeight: "3rem",
          color: "var(--hbd-color-text-muted, var(--color-fd-muted-foreground))",
          fontStyle: "italic",
        }}
      >
        #portal-target — children land here.
      </div>
    </div>
  );
}

/**
 * `prepend` controls insertion order within the target. With prepend, the
 * portalled node is inserted at the START of the target; without it, at the end.
 */
export function PortalPrependDemo() {
  const rowStyle: React.CSSProperties = {
    margin: 0,
    padding: "var(--hbd-space-2, 0.5rem) var(--hbd-space-3, 0.75rem)",
    borderRadius: "var(--hbd-radius-md, 0.25rem)",
    background: "var(--hbd-color-surface-raised, var(--color-fd-muted))",
    color: "var(--hbd-color-text-primary, var(--color-fd-foreground))",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem", width: "100%" }}>
      <div
        id="portal-order-target"
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "0.5rem",
          border: "1px dashed var(--hbd-color-border-default, var(--color-fd-border))",
          borderRadius: "var(--hbd-radius-lg, 0.5rem)",
          padding: "var(--hbd-space-4, 1rem)",
        }}
      >
        <p style={rowStyle}>Existing first child</p>
        <p style={rowStyle}>Existing second child</p>
      </div>

      {/* Lands at the end of the target (default). */}
      <Portal target="#portal-order-target">
        <p
          style={{
            ...rowStyle,
            background: "var(--hbd-color-surface-action, var(--color-fd-primary))",
          }}
        >
          Appended (default) — goes last
        </p>
      </Portal>

      {/* Lands at the start of the target. */}
      <Portal target="#portal-order-target" prepend>
        <p
          style={{
            ...rowStyle,
            background: "var(--hbd-color-surface-action, var(--color-fd-primary))",
          }}
        >
          Prepended — goes first
        </p>
      </Portal>
    </div>
  );
}
