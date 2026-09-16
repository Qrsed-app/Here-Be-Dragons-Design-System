"use client";

import * as React from "react";
import { CopyIcon, PencilIcon, TrashIcon } from "lucide-react";
import {
  ContextMenu,
  ContextMenuCheckboxItem,
  ContextMenuContent,
  ContextMenuGroup,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuRadioGroup,
  ContextMenuRadioItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "@/registry/new-york/context-menu/context-menu";

const area =
  "flex h-36 w-72 items-center justify-center rounded-lg border border-dashed border-border-strong font-sans text-sm text-muted-foreground select-none";

export function ContextMenuDemo() {
  const [bookmarks, setBookmarks] = React.useState(true);
  const [urls, setUrls] = React.useState(false);
  const [person, setPerson] = React.useState("elara");
  return (
    <ContextMenu>
      <ContextMenuTrigger className={area}>Right click here</ContextMenuTrigger>
      <ContextMenuContent className="w-56">
        <ContextMenuItem inset>
          Back
          <ContextMenuShortcut>⌘[</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuItem inset disabled>
          Forward
          <ContextMenuShortcut>⌘]</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuItem inset>
          Reload
          <ContextMenuShortcut>⌘R</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuSub>
          <ContextMenuSubTrigger inset>More Tools</ContextMenuSubTrigger>
          <ContextMenuSubContent className="w-44">
            <ContextMenuItem>Save Page...</ContextMenuItem>
            <ContextMenuItem>Create Shortcut...</ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem variant="destructive">Delete</ContextMenuItem>
          </ContextMenuSubContent>
        </ContextMenuSub>
        <ContextMenuSeparator />
        <ContextMenuCheckboxItem checked={bookmarks} onCheckedChange={setBookmarks}>
          Show Bookmarks
        </ContextMenuCheckboxItem>
        <ContextMenuCheckboxItem checked={urls} onCheckedChange={setUrls}>
          Show Full URLs
        </ContextMenuCheckboxItem>
        <ContextMenuSeparator />
        <ContextMenuRadioGroup value={person} onValueChange={setPerson}>
          <ContextMenuLabel inset>Party</ContextMenuLabel>
          <ContextMenuRadioItem value="elara">Elara</ContextMenuRadioItem>
          <ContextMenuRadioItem value="thorin">Thorin</ContextMenuRadioItem>
        </ContextMenuRadioGroup>
      </ContextMenuContent>
    </ContextMenu>
  );
}

export function ContextMenuIconsDemo() {
  const [last, setLast] = React.useState("");
  return (
    <div className="flex flex-col items-start gap-3">
      <ContextMenu>
        <ContextMenuTrigger className={area}>Right-click this chart</ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem onSelect={() => setLast("Copy")}>
            <CopyIcon />
            Copy
            <ContextMenuShortcut>⌘C</ContextMenuShortcut>
          </ContextMenuItem>
          <ContextMenuItem onSelect={() => setLast("Rename")}>
            <PencilIcon />
            Rename
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem variant="destructive" onSelect={() => setLast("Delete")}>
            <TrashIcon />
            Delete
            <ContextMenuShortcut>⌫</ContextMenuShortcut>
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
      <span className="font-sans text-sm text-muted-foreground">Last action: {last || "—"}</span>
    </div>
  );
}

export function ContextMenuGroupsDemo() {
  return (
    <ContextMenu>
      <ContextMenuTrigger className={area}>Right-click the map</ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuGroup>
          <ContextMenuLabel>View</ContextMenuLabel>
          <ContextMenuItem>
            Zoom in
            <ContextMenuShortcut>+</ContextMenuShortcut>
          </ContextMenuItem>
          <ContextMenuItem>
            Zoom out
            <ContextMenuShortcut>−</ContextMenuShortcut>
          </ContextMenuItem>
          <ContextMenuItem>Fit to screen</ContextMenuItem>
        </ContextMenuGroup>
        <ContextMenuSeparator />
        <ContextMenuGroup>
          <ContextMenuLabel>Edit</ContextMenuLabel>
          <ContextMenuItem>Add marker</ContextMenuItem>
          <ContextMenuItem disabled>Measure (coming soon)</ContextMenuItem>
        </ContextMenuGroup>
      </ContextMenuContent>
    </ContextMenu>
  );
}

export function ContextMenuDisabledDemo() {
  return (
    <ContextMenu>
      <ContextMenuTrigger disabled className={area}>
        Right-click does nothing here
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem>Unavailable</ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
