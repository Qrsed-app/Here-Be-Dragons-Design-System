"use client";

import * as React from "react";
import { Drawer } from "@/registry/new-york/drawer/drawer";
import { Button } from "@/registry/new-york/button/button";

/**
 * Basic drawer — left placement (default). Open with the trigger, dismiss via
 * the ✕ close button, the backdrop, or Escape.
 */
export function DrawerBasicDemo() {
  return (
    <Drawer>
      <Drawer.Trigger>
        <Button variant="primary">Open drawer</Button>
      </Drawer.Trigger>
      <Drawer.Content title="Ship's manifest">
        <p>
          A sliding overlay panel for secondary navigation, filters, or detail views. Focus is
          trapped inside and returns to the trigger on close.
        </p>
      </Drawer.Content>
    </Drawer>
  );
}

/**
 * Placement — left, right, top, and bottom. Each slides in from its edge.
 */
export function DrawerPlacementDemo() {
  const placements = ["left", "right", "top", "bottom"] as const;
  return (
    <>
      {placements.map((placement) => (
        <Drawer key={placement} placement={placement}>
          <Drawer.Trigger>
            <Button variant="default">{placement}</Button>
          </Drawer.Trigger>
          <Drawer.Content title={`${placement} drawer`}>
            <p>This panel slides in from the {placement} edge of the viewport.</p>
          </Drawer.Content>
        </Drawer>
      ))}
    </>
  );
}

/**
 * Size modifiers — `wide` widens left/right panels, `tall` heightens top/bottom.
 */
export function DrawerSizeDemo() {
  return (
    <>
      <Drawer placement="right" wide>
        <Drawer.Trigger>
          <Button variant="default">Wide (right)</Button>
        </Drawer.Trigger>
        <Drawer.Content title="Wide panel">
          <p>The `wide` prop widens left and right panels for richer content.</p>
        </Drawer.Content>
      </Drawer>

      <Drawer placement="bottom" tall>
        <Drawer.Trigger>
          <Button variant="default">Tall (bottom)</Button>
        </Drawer.Trigger>
        <Drawer.Content title="Tall panel">
          <p>The `tall` prop heightens top and bottom panels.</p>
        </Drawer.Content>
      </Drawer>
    </>
  );
}

/**
 * Footer with a bespoke close button wired through Drawer.Close.
 */
export function DrawerFooterDemo() {
  return (
    <Drawer placement="right">
      <Drawer.Trigger>
        <Button variant="primary">Edit settings</Button>
      </Drawer.Trigger>
      <Drawer.Content
        title="Voyage settings"
        footer={
          <>
            <Drawer.Close asChild>
              <Button variant="default">Cancel</Button>
            </Drawer.Close>
            <Drawer.Close asChild>
              <Button variant="gold">Save changes</Button>
            </Drawer.Close>
          </>
        }
      >
        <p>
          Pass a `footer` to render an action row. Wrap your buttons in `Drawer.Close` to dismiss
          the drawer on click.
        </p>
      </Drawer.Content>
    </Drawer>
  );
}

/**
 * Sidebar mode — `noBackdrop` drops the scrim, scroll lock, and pointer
 * blocking so the rest of the page stays usable.
 */
export function DrawerSidebarDemo() {
  return (
    <Drawer placement="left" noBackdrop>
      <Drawer.Trigger>
        <Button variant="default">Open sidebar</Button>
      </Drawer.Trigger>
      <Drawer.Content title="Navigation">
        <p>No backdrop, no scroll lock. Dismiss with the ✕ button or Escape.</p>
      </Drawer.Content>
    </Drawer>
  );
}

/**
 * Controlled — open state lives in React via `open` + `onOpenChange`. The
 * `onOpen` / `onClose` callbacks mirror the legacy hbd:open / hbd:close events.
 */
export function DrawerControlledDemo() {
  const [open, setOpen] = React.useState(false);

  return (
    <div
      style={{
        display: "flex",
        gap: "var(--hbd-space-4, 1rem)",
        alignItems: "center",
      }}
    >
      <Button variant="primary" onClick={() => setOpen(true)}>
        Open programmatically
      </Button>
      <span style={{ font: "var(--hbd-font-ui, inherit)" }}>State: {open ? "open" : "closed"}</span>
      <Drawer open={open} onOpenChange={setOpen} placement="right">
        <Drawer.Content title="Controlled drawer">
          <p>This drawer&apos;s open state is driven entirely from React.</p>
        </Drawer.Content>
      </Drawer>
    </div>
  );
}
