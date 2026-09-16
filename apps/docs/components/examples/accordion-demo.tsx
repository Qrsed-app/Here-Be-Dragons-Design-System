"use client";

import * as React from "react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/registry/new-york/accordion/accordion";

const passages = [
  { value: "north", title: "Northern passage" },
  { value: "south", title: "Southern passage" },
  { value: "east", title: "Eastern passage" },
];

export function AccordionControlledDemo() {
  const [open, setOpen] = React.useState("north");

  return (
    <div className="flex w-full max-w-[34rem] flex-col gap-3">
      <Accordion type="single" collapsible value={open} onValueChange={setOpen}>
        {passages.map((p) => (
          <AccordionItem key={p.value} value={p.value}>
            <AccordionTrigger>{p.title}</AccordionTrigger>
            <AccordionContent>
              Charting the {p.title.toLowerCase()} toward the unknown edge of the map.
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
      <p className="m-0 font-sans text-sm text-muted-foreground">
        Open section: <strong className="text-foreground">{open || "none"}</strong>
      </p>
    </div>
  );
}
