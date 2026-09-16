"use client";

import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/registry/new-york/hover-card/hover-card";
import { Button } from "@/registry/new-york/button/button";

function CartographerCard() {
  return (
    <div className="flex flex-col gap-1">
      <h4 className="font-accent text-[0.9375rem] leading-[1.35] font-bold tracking-[0.02em]">
        The Cartographer
      </h4>
      <p className="text-sm leading-normal">
        Charts the Sea of Fallen Stars. Keeper of the western lighthouse.
      </p>
      <p className="text-xs leading-normal text-muted-foreground">Joined in the Year of the Wyrm</p>
    </div>
  );
}

export function HoverCardDemo() {
  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        <Button variant="link">@cartographer</Button>
      </HoverCardTrigger>
      <HoverCardContent>
        <CartographerCard />
      </HoverCardContent>
    </HoverCard>
  );
}

const sides = ["top", "right", "bottom", "left"] as const;

export function HoverCardSideDemo() {
  return (
    <>
      {sides.map((side) => (
        <HoverCard key={side} openDelay={100} closeDelay={100}>
          <HoverCardTrigger asChild>
            <Button variant="secondary">{side}</Button>
          </HoverCardTrigger>
          <HoverCardContent side={side}>
            <CartographerCard />
          </HoverCardContent>
        </HoverCard>
      ))}
    </>
  );
}

export function HoverCardNoArrowDemo() {
  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        <Button variant="link">@quartermaster</Button>
      </HoverCardTrigger>
      <HoverCardContent showArrow={false}>
        <p className="text-sm leading-normal">Keeps the stores, the rum and the ledger.</p>
      </HoverCardContent>
    </HoverCard>
  );
}
