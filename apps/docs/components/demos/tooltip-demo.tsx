"use client";

import * as React from "react";
import {
  Tooltip,
  TooltipProvider,
  TooltipTrigger,
  TooltipContent,
} from "@/registry/new-york/tooltip/tooltip";
import { Button } from "@/registry/new-york/button/button";

/**
 * Tooltips are an overlay: they portal a panel into <body> and open on
 * hover/focus, so they only work in a client component wrapped in a
 * <TooltipProvider>. Each example below mounts its own provider.
 */

// Basic: the `content` convenience prop renders a default panel.
export function TooltipBasicDemo() {
  return (
    <TooltipProvider>
      <Tooltip content="Saves your changes to the realm">
        <TooltipTrigger>
          <Button variant="primary">Hover or focus me</Button>
        </TooltipTrigger>
      </Tooltip>
    </TooltipProvider>
  );
}

// Placement: one tooltip per side. Radix flips on collision automatically.
export function TooltipPlacementDemo() {
  const sides = ["top", "bottom", "left", "right"] as const;
  return (
    <TooltipProvider>
      {sides.map((side) => (
        <Tooltip key={side} placement={side} content={`Placed on the ${side}`}>
          <TooltipTrigger>
            <Button variant="default">{side}</Button>
          </TooltipTrigger>
        </Tooltip>
      ))}
    </TooltipProvider>
  );
}

// Rich content via the explicit TooltipContent panel.
export function TooltipRichDemo() {
  return (
    <TooltipProvider>
      <Tooltip placement="bottom">
        <TooltipTrigger>
          <Button variant="gold">Map legend</Button>
        </TooltipTrigger>
        <TooltipContent>
          <strong>Here be dragons.</strong>
          <br />
          Uncharted waters beyond this point.
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
