"use client";

import * as React from "react";

import { Item, ItemContent, ItemGroup, ItemTitle } from "@/registry/new-york/item/item";

const ports = [
  { value: "tortuga", name: "Tortuga", description: "Lawless free port" },
  { value: "nassau", name: "Nassau", description: "Pirate republic" },
  { value: "port-royal", name: "Port Royal", description: "Crown stronghold" },
];

export function ItemSelectableDemo() {
  const [selected, setSelected] = React.useState("nassau");

  return (
    <ItemGroup
      role="group"
      aria-label="Home port"
      className="w-full max-w-md overflow-hidden rounded-lg border border-border-subtle"
    >
      {ports.map((port) => (
        <Item key={port.value} asChild>
          <button
            type="button"
            aria-current={selected === port.value ? "true" : undefined}
            onClick={() => setSelected(port.value)}
          >
            <ItemContent>
              <ItemTitle>{port.name}</ItemTitle>
              {/* Not ItemDescription: it renders a <p>, which is invalid inside a <button>. */}
              <span className="font-sans text-[0.8125rem] leading-[1.35] text-muted-foreground">
                {port.description}
              </span>
            </ItemContent>
          </button>
        </Item>
      ))}
    </ItemGroup>
  );
}
