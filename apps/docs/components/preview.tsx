import type { ReactNode } from "react";

export function Preview({ children }: { children: ReactNode }) {
  return (
    <div
      className="hbd-preview-canvas"
      style={{
        // Token-backed; no hard-coded design values. Falls back gracefully.
        border: "1px solid var(--hbd-color-border-default, var(--color-fd-border))",
        borderRadius: "var(--hbd-radius-lg, 0.5rem)",
        background: "var(--hbd-color-surface-default, var(--color-fd-card))",
        padding: "var(--hbd-space-6, 1.5rem)",
        display: "flex",
        flexWrap: "wrap",
        gap: "var(--hbd-space-4, 1rem)",
        alignItems: "center",
        marginBlock: "1rem",
      }}
    >
      {children}
    </div>
  );
}
