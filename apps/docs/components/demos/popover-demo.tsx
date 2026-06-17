"use client";

import * as React from "react";
import { Popover, PopoverClose } from "@/registry/new-york/popover/popover";
import { Button } from "@/registry/new-york/button/button";

/**
 * The popover is a click-triggered, non-modal floating panel: it portals its
 * content, traps focus while open, and dismisses on Escape or outside click.
 * That interaction is stateful, so every example lives in this client demo.
 */

// Basic: trigger + a titled panel with body copy and the built-in ✕ close.
export function PopoverBasicDemo() {
  return (
    <Popover>
      <Popover.Trigger>
        <Button variant="primary">Open popover</Button>
      </Popover.Trigger>
      <Popover.Content title="Cartographer's note">
        Here be dragons. The waters past this marker remain uncharted.
      </Popover.Content>
    </Popover>
  );
}

// Placement: one popover per side. Radix flips on collision automatically.
export function PopoverPlacementDemo() {
  const sides = ["top", "bottom", "left", "right"] as const;
  return (
    <>
      {sides.map((side) => (
        <Popover key={side} placement={side}>
          <Popover.Trigger>
            <Button variant="default">{side}</Button>
          </Popover.Trigger>
          <Popover.Content title={`Placed ${side}`}>
            This panel anchors to the {side} of its trigger.
          </Popover.Content>
        </Popover>
      ))}
    </>
  );
}

// Footer actions: confirm/cancel buttons that close via PopoverClose.
export function PopoverFooterDemo() {
  return (
    <Popover>
      <Popover.Trigger>
        <Button variant="gold">Scuttle the ship?</Button>
      </Popover.Trigger>
      <Popover.Content
        title="Confirm"
        footer={
          <>
            <PopoverClose asChild>
              <Button variant="default" size="sm">
                Cancel
              </Button>
            </PopoverClose>
            <PopoverClose asChild>
              <Button variant="primary" size="sm">
                Scuttle
              </Button>
            </PopoverClose>
          </>
        }
      >
        This cannot be undone. The ship will be lost to the depths.
      </Popover.Content>
    </Popover>
  );
}

// No header chrome: a bare panel via noClose + no title (Escape still closes).
export function PopoverBareDemo() {
  return (
    <Popover>
      <Popover.Trigger>
        <Button variant="default">Quick info</Button>
      </Popover.Trigger>
      <Popover.Content noClose>
        A lightweight panel with no header. Press Escape or click away to close.
      </Popover.Content>
    </Popover>
  );
}
