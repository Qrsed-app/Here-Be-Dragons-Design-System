"use client";

import { XIcon } from "lucide-react";
import {
  Popover,
  PopoverClose,
  PopoverContent,
  PopoverDescription,
  PopoverFooter,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/registry/new-york/popover/popover";
import { Button } from "@/registry/new-york/button/button";

export function PopoverDemo() {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button>Open popover</Button>
      </PopoverTrigger>
      <PopoverContent>
        <PopoverHeader>
          <PopoverTitle>Cartographer&apos;s note</PopoverTitle>
          <PopoverClose asChild>
            <Button variant="secondary" size="icon-sm" aria-label="Close popover">
              <XIcon />
            </Button>
          </PopoverClose>
        </PopoverHeader>
        Here be dragons. The waters past this marker remain uncharted.
      </PopoverContent>
    </Popover>
  );
}

const sides = ["top", "right", "bottom", "left"] as const;

export function PopoverSideDemo() {
  return (
    <>
      {sides.map((side) => (
        <Popover key={side}>
          <PopoverTrigger asChild>
            <Button variant="secondary">{side}</Button>
          </PopoverTrigger>
          <PopoverContent side={side}>
            This panel anchors to the {side} of its trigger.
          </PopoverContent>
        </Popover>
      ))}
    </>
  );
}

export function PopoverDescriptionDemo() {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="secondary">Dimensions</Button>
      </PopoverTrigger>
      <PopoverContent>
        <PopoverHeader>
          <PopoverTitle>Dimensions</PopoverTitle>
          <PopoverDescription>Set the dimensions for the chart.</PopoverDescription>
        </PopoverHeader>
        Width 40 leagues, height 25 leagues.
      </PopoverContent>
    </Popover>
  );
}

export function PopoverFooterDemo() {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="gold">Scuttle the ship?</Button>
      </PopoverTrigger>
      <PopoverContent>
        <PopoverHeader>
          <PopoverTitle>Confirm</PopoverTitle>
        </PopoverHeader>
        This cannot be undone. The ship will be lost to the depths.
        <PopoverFooter>
          <PopoverClose asChild>
            <Button variant="secondary" size="sm">
              Cancel
            </Button>
          </PopoverClose>
          <PopoverClose asChild>
            <Button size="sm">Scuttle</Button>
          </PopoverClose>
        </PopoverFooter>
      </PopoverContent>
    </Popover>
  );
}

export function PopoverNoArrowDemo() {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="secondary">Quick info</Button>
      </PopoverTrigger>
      <PopoverContent showArrow={false}>
        A lightweight panel with no arrow. Press Escape or click away to close.
      </PopoverContent>
    </Popover>
  );
}
