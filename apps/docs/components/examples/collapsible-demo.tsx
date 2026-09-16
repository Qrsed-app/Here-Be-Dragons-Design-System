"use client";

import * as React from "react";
import { ChevronsUpDownIcon } from "lucide-react";

import { Button } from "@/registry/new-york/button/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/registry/new-york/collapsible/collapsible";

const row =
  "rounded-md border border-border-subtle bg-surface-subtle px-4 py-2 font-mono text-sm text-foreground";

export function CollapsibleControlledDemo() {
  const [open, setOpen] = React.useState(false);

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="flex w-[350px] flex-col gap-2">
      <div className="flex items-center justify-between gap-4">
        <h4 className="m-0 font-display text-[0.8125rem] font-bold tracking-[0.2em] uppercase">
          Three relics recovered
        </h4>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="icon-sm" aria-label="Toggle the relic list">
            <ChevronsUpDownIcon />
          </Button>
        </CollapsibleTrigger>
      </div>
      <div className={row}>Sextant of the Drowned Captain</div>
      <CollapsibleContent className="flex flex-col gap-2">
        <div className={row}>Astrolabe of Nine Stars</div>
        <div className={row}>Chart of the Kraken Trench</div>
      </CollapsibleContent>
      <p className="m-0 font-sans text-sm text-muted-foreground">
        The satchel is <strong className="text-foreground">{open ? "open" : "closed"}</strong>.
      </p>
    </Collapsible>
  );
}
