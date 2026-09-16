"use client";

import * as React from "react";

import { ToggleGroup, ToggleGroupItem } from "@/registry/new-york/toggle-group/toggle-group";

export function ToggleGroupRequiredDemo() {
  const [view, setView] = React.useState("grid");

  return (
    <ToggleGroup
      type="single"
      value={view}
      onValueChange={(next) => {
        if (next) setView(next);
      }}
      aria-label="Map view"
    >
      <ToggleGroupItem value="grid">Grid</ToggleGroupItem>
      <ToggleGroupItem value="list">List</ToggleGroupItem>
      <ToggleGroupItem value="atlas">Atlas</ToggleGroupItem>
    </ToggleGroup>
  );
}
