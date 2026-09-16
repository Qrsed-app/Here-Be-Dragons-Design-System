"use client";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/registry/new-york/tooltip/tooltip";
import { Button } from "@/registry/new-york/button/button";

export function TooltipDemo() {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="secondary">Hover</Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Add to the ship&apos;s log</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

const sides = ["top", "right", "bottom", "left"] as const;

export function TooltipSideDemo() {
  return (
    <TooltipProvider>
      {sides.map((side) => (
        <Tooltip key={side}>
          <TooltipTrigger asChild>
            <Button variant="secondary">{side}</Button>
          </TooltipTrigger>
          <TooltipContent side={side}>
            <p>Placed on the {side}</p>
          </TooltipContent>
        </Tooltip>
      ))}
    </TooltipProvider>
  );
}

export function TooltipRichDemo() {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="gold">Map legend</Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <strong>Here be dragons.</strong>
          <br />
          Uncharted waters beyond this point.
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export function TooltipDisabledDemo() {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span tabIndex={0} className="inline-block">
            <Button variant="secondary" disabled>
              Set sail
            </Button>
          </span>
        </TooltipTrigger>
        <TooltipContent>
          <p>The harbour master has not signed the papers</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
