"use client";

import * as React from "react";
import { Button } from "@/registry/new-york/button/button";
import { ToastProvider, useToast, type ToastPosition } from "@/registry/new-york/toast/toast";

/**
 * Variant triggers. A single <ToastProvider> renders the portalled stack at
 * the viewport edge; each button fires the matching toast variant via the
 * useToast() hook.
 */
export function ToastVariantsDemo() {
  const toast = useToast();

  return (
    <ToastProvider>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--hbd-space-4, 1rem)" }}>
        <Button onClick={() => toast.info("Your map has been updated.")}>Info</Button>
        <Button variant="primary" onClick={() => toast.success("Treasure successfully buried.")}>
          Success
        </Button>
        <Button variant="gold" onClick={() => toast.warning("Low on supplies — restock soon.")}>
          Warning
        </Button>
        <Button onClick={() => toast.error("The kraken breached the hull!")}>Error</Button>
      </div>
    </ToastProvider>
  );
}

/**
 * A richer toast: a bold title, body message, an inline action button, and a
 * non-default (Infinity) duration so it lingers until dismissed.
 */
export function ToastWithActionDemo() {
  const toast = useToast();

  return (
    <ToastProvider>
      <Button
        variant="primary"
        onClick={() =>
          toast.success("Voyage logged to the captain’s ledger.", {
            title: "Saved",
            duration: Infinity,
            action: {
              label: "Undo",
              onClick: () => toast.info("Reverted the last entry."),
            },
          })
        }
      >
        Save voyage
      </Button>
    </ToastProvider>
  );
}

/**
 * Position is global, set at runtime via toast.setPosition(). Pick a corner,
 * then fire a toast to see where it docks.
 */
const POSITIONS: ToastPosition[] = [
  "top-right",
  "top-center",
  "bottom-right",
  "bottom-center",
  "bottom-left",
];

export function ToastPositionDemo() {
  const toast = useToast();

  return (
    <ToastProvider>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--hbd-space-4, 1rem)" }}>
        {POSITIONS.map((pos) => (
          <Button
            key={pos}
            onClick={() => {
              toast.setPosition(pos);
              toast.info(`Docked at ${pos}.`);
            }}
          >
            {pos}
          </Button>
        ))}
      </div>
    </ToastProvider>
  );
}
