"use client";

import * as React from "react";
import { FolderOpenIcon, PlusIcon, SaveIcon, TrashIcon } from "lucide-react";
import { Button } from "@/registry/new-york/button/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/registry/new-york/dropdown-menu/dropdown-menu";

export function DropdownMenuDemo() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="secondary">Open</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="start">
        <DropdownMenuLabel>My Account</DropdownMenuLabel>
        <DropdownMenuGroup>
          <DropdownMenuItem>
            Profile
            <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem>
            Billing
            <DropdownMenuShortcut>⌘B</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem>
            Settings
            <DropdownMenuShortcut>⌘S</DropdownMenuShortcut>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem>Party</DropdownMenuItem>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>Invite adventurers</DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent>
                <DropdownMenuItem>Raven</DropdownMenuItem>
                <DropdownMenuItem>Sending stone</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>More...</DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>
          <DropdownMenuItem>
            New party
            <DropdownMenuShortcut>⌘T</DropdownMenuShortcut>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled>Guild API</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive">
          Log out
          <DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function DropdownMenuBasicDemo() {
  const [last, setLast] = React.useState("");
  return (
    <div className="flex flex-col items-start gap-3">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="secondary">Actions</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem onSelect={() => setLast("Edit quest")}>Edit quest</DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setLast("Duplicate")}>Duplicate</DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setLast("Archive")}>Archive</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <span className="font-sans text-sm text-muted-foreground">Last selected: {last || "—"}</span>
    </div>
  );
}

export function DropdownMenuIconsDemo() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button>File</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuItem>
          <PlusIcon />
          New
          <DropdownMenuShortcut>⌘N</DropdownMenuShortcut>
        </DropdownMenuItem>
        <DropdownMenuItem>
          <FolderOpenIcon />
          Open
          <DropdownMenuShortcut>⌘O</DropdownMenuShortcut>
        </DropdownMenuItem>
        <DropdownMenuItem>
          <SaveIcon />
          Save
          <DropdownMenuShortcut>⌘S</DropdownMenuShortcut>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function DropdownMenuGroupsDemo() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="gold">Manage map</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Edit</DropdownMenuLabel>
          <DropdownMenuItem>Rename</DropdownMenuItem>
          <DropdownMenuItem>Move to folder</DropdownMenuItem>
          <DropdownMenuItem disabled>Lock (coming soon)</DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuLabel>Danger</DropdownMenuLabel>
          <DropdownMenuItem variant="destructive">Delete map</DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function DropdownMenuDestructiveDemo() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="secondary">Scroll</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuItem>
          <SaveIcon />
          Copy to spellbook
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive">
          <TrashIcon />
          Burn scroll
          <DropdownMenuShortcut>⌫</DropdownMenuShortcut>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function DropdownMenuCheckboxesDemo() {
  const [terrain, setTerrain] = React.useState(true);
  const [roads, setRoads] = React.useState(false);
  const [fog, setFog] = React.useState(true);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="secondary">Map layers</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="start">
        <DropdownMenuLabel>Layers</DropdownMenuLabel>
        <DropdownMenuCheckboxItem checked={terrain} onCheckedChange={setTerrain}>
          Terrain
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem checked={roads} onCheckedChange={setRoads}>
          Roads
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem checked={fog} onCheckedChange={setFog} disabled>
          Fog of war
        </DropdownMenuCheckboxItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function DropdownMenuRadioGroupDemo() {
  const [scale, setScale] = React.useState("leagues");
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="secondary">Map scale</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="start">
        <DropdownMenuLabel>Measure distance in</DropdownMenuLabel>
        <DropdownMenuRadioGroup value={scale} onValueChange={setScale}>
          <DropdownMenuRadioItem value="miles">Miles</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="leagues">Leagues</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="days">Days of travel</DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function DropdownMenuSubmenuDemo() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="secondary">Quest</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuItem>Accept</DropdownMenuItem>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>Share with</DropdownMenuSubTrigger>
          <DropdownMenuPortal>
            <DropdownMenuSubContent>
              <DropdownMenuItem>The party</DropdownMenuItem>
              <DropdownMenuItem>The guild</DropdownMenuItem>
              <DropdownMenuItem>The tavern board</DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuPortal>
        </DropdownMenuSub>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive">Abandon</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function DropdownMenuInsetDemo() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="secondary">Party</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="start">
        <DropdownMenuLabel inset>Adventurers</DropdownMenuLabel>
        <DropdownMenuItem inset>Aragorn</DropdownMenuItem>
        <DropdownMenuItem inset>Gimli</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <PlusIcon />
          Recruit
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function DropdownMenuControlledDemo() {
  const [open, setOpen] = React.useState(false);
  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        Open from elsewhere
      </Button>
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <Button>Menu ({open ? "open" : "closed"})</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem>Profile</DropdownMenuItem>
          <DropdownMenuItem>Settings</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive">Log out</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
