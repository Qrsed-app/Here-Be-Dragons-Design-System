"use client";

import * as React from "react";
import { Dropdown } from "@/registry/new-york/dropdown/dropdown";
import { Button } from "@/registry/new-york/button/button";

/**
 * The dropdown is an overlay: it opens/closes, manages roving focus, and wires
 * aria-haspopup/expanded onto the cloned trigger, so it must run in a client
 * component. The trigger is any element (here an <hbd> Button); items are
 * declared with the compound Dropdown.Item / Separator / Group members.
 */

// Basic: a trigger Button plus a flat list of action items.
export function DropdownBasicDemo() {
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
      <Dropdown
        trigger={<Button variant="default">Actions</Button>}
        onSelect={(detail) => setLast(detail.label)}
      >
        <Dropdown.Item value="edit">Edit quest</Dropdown.Item>
        <Dropdown.Item value="duplicate">Duplicate</Dropdown.Item>
        <Dropdown.Item value="archive">Archive</Dropdown.Item>
      </Dropdown>
      <small>Last selected: {last || "—"}</small>
    </div>
  );
}

// Icons + keyboard-shortcut hints on items.
export function DropdownIconsDemo() {
  return (
    <Dropdown trigger={<Button variant="primary">File</Button>}>
      <Dropdown.Item value="new" icon={<span aria-hidden>＋</span>} shortcut="⌘N">
        New
      </Dropdown.Item>
      <Dropdown.Item value="open" icon={<span aria-hidden>📂</span>} shortcut="⌘O">
        Open
      </Dropdown.Item>
      <Dropdown.Item value="save" icon={<span aria-hidden>💾</span>} shortcut="⌘S">
        Save
      </Dropdown.Item>
    </Dropdown>
  );
}

// Groups, a separator, a disabled item, and a destructive item.
export function DropdownGroupedDemo() {
  return (
    <Dropdown trigger={<Button variant="gold">Manage map</Button>} placement="bottom-start">
      <Dropdown.Group label="Edit">
        <Dropdown.Item value="rename">Rename</Dropdown.Item>
        <Dropdown.Item value="move">Move to folder</Dropdown.Item>
        <Dropdown.Item value="lock" disabled>
          Lock (coming soon)
        </Dropdown.Item>
      </Dropdown.Group>
      <Dropdown.Separator />
      <Dropdown.Group label="Danger">
        <Dropdown.Item value="delete" destructive>
          Delete map
        </Dropdown.Item>
      </Dropdown.Group>
    </Dropdown>
  );
}

// Controlled open state.
export function DropdownControlledDemo() {
  const [open, setOpen] = React.useState(false);
  return (
    <div style={{ display: "flex", gap: "var(--hbd-space-4, 1rem)", alignItems: "center" }}>
      <Button variant="default" onClick={() => setOpen((o) => !o)}>
        Toggle externally
      </Button>
      <Dropdown
        open={open}
        onOpenChange={setOpen}
        trigger={<Button variant="primary">Menu ({open ? "open" : "closed"})</Button>}
      >
        <Dropdown.Item value="profile">Profile</Dropdown.Item>
        <Dropdown.Item value="settings">Settings</Dropdown.Item>
        <Dropdown.Separator />
        <Dropdown.Item value="logout" destructive>
          Log out
        </Dropdown.Item>
      </Dropdown>
    </div>
  );
}
