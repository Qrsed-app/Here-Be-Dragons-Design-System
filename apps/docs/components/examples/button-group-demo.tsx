"use client";

import { ChevronDownIcon } from "lucide-react";

import { Button } from "@/registry/new-york/button/button";
import { ButtonGroup } from "@/registry/new-york/button-group/button-group";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/registry/new-york/dropdown-menu/dropdown-menu";

export function SplitButtonDemo() {
  return (
    <ButtonGroup>
      <Button onClick={() => {}}>Cast Spell</Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            size="icon"
            aria-label="More casting options"
            className="border-l! border-l-[rgba(255,255,255,0.3)] px-2!"
          >
            <ChevronDownIcon />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem>Cast at a higher level</DropdownMenuItem>
          <DropdownMenuItem>Cast as a ritual</DropdownMenuItem>
          <DropdownMenuItem>Counterspell</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </ButtonGroup>
  );
}
