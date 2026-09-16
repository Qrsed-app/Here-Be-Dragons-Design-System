import * as React from "react";
import { ScrollArea, ScrollBar } from "@/registry/new-york/scroll-area/scroll-area";

const ports = Array.from({ length: 30 }, (_, i) => `Port of call ${i + 1}`);

export function ScrollAreaDemo() {
  return (
    <ScrollArea className="h-72 w-48 rounded-md border border-border-subtle">
      <div className="p-4">
        <h4 className="mb-4 font-accent text-sm leading-none font-bold">Ports</h4>
        {ports.map((port) => (
          <div key={port} className="border-b border-border-subtle py-2 text-sm">
            {port}
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}

const charts = [
  "Sea of Fallen Stars",
  "Moonshae Isles",
  "Sword Coast",
  "Trackless Sea",
  "Nelanther",
  "Shining Sea",
];

export function ScrollAreaHorizontalDemo() {
  return (
    <ScrollArea className="w-96 rounded-md border border-border-subtle whitespace-nowrap">
      <div className="flex w-max gap-4 p-4">
        {charts.map((chart) => (
          <figure key={chart} className="shrink-0">
            <div className="h-32 w-40 rounded-md border-2 border-ink-900 bg-surface-raised" />
            <figcaption className="pt-2 text-xs text-muted-foreground">{chart}</figcaption>
          </figure>
        ))}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
}
