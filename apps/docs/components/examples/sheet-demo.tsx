"use client";

import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/registry/new-york/sheet/sheet";
import { Button } from "@/registry/new-york/button/button";

export function SheetDemo() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="secondary">Open</Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Voyage settings</SheetTitle>
          <SheetDescription>Change the course here. Save when you are done.</SheetDescription>
        </SheetHeader>
        <p>
          The fleet sails at dawn for the Sea of Fallen Stars, keeping the western lighthouse to
          starboard until the reef is behind it.
        </p>
        <SheetFooter>
          <SheetClose asChild>
            <Button variant="secondary">Cancel</Button>
          </SheetClose>
          <Button variant="gold">Save changes</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

const sides = ["top", "right", "bottom", "left"] as const;

export function SheetSideDemo() {
  return (
    <>
      {sides.map((side) => (
        <Sheet key={side}>
          <SheetTrigger asChild>
            <Button variant="secondary">{side}</Button>
          </SheetTrigger>
          <SheetContent side={side} aria-describedby={undefined}>
            <SheetHeader>
              <SheetTitle>{side} sheet</SheetTitle>
            </SheetHeader>
            <p>This panel slides in from the {side} edge of the viewport.</p>
          </SheetContent>
        </Sheet>
      ))}
    </>
  );
}

export function SheetSizeDemo() {
  return (
    <>
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="secondary">Wide (right)</Button>
        </SheetTrigger>
        <SheetContent side="right" wide aria-describedby={undefined}>
          <SheetHeader>
            <SheetTitle>Wide panel</SheetTitle>
          </SheetHeader>
          <p>wide widens left and right sheets from 320px to 480px.</p>
        </SheetContent>
      </Sheet>
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="secondary">Tall (bottom)</Button>
        </SheetTrigger>
        <SheetContent side="bottom" tall aria-describedby={undefined}>
          <SheetHeader>
            <SheetTitle>Tall panel</SheetTitle>
          </SheetHeader>
          <p>tall raises top and bottom sheets from half to 80% of the viewport.</p>
        </SheetContent>
      </Sheet>
    </>
  );
}

export function SheetNoOverlayDemo() {
  return (
    <Sheet modal={false}>
      <SheetTrigger asChild>
        <Button variant="secondary">Open sidebar</Button>
      </SheetTrigger>
      <SheetContent
        side="left"
        showOverlay={false}
        aria-describedby={undefined}
        onInteractOutside={(event) => event.preventDefault()}
      >
        <SheetHeader>
          <SheetTitle>Navigation</SheetTitle>
        </SheetHeader>
        <p>No scrim, and the page behind stays usable. Close it with the button or Escape.</p>
      </SheetContent>
    </Sheet>
  );
}

export function SheetNoCloseDemo() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="secondary">Open</Button>
      </SheetTrigger>
      <SheetContent showCloseButton={false} aria-describedby={undefined}>
        <SheetHeader>
          <SheetTitle>Ship&apos;s manifest</SheetTitle>
        </SheetHeader>
        <p>Without the corner button, give the reader another way out.</p>
        <SheetFooter>
          <SheetClose asChild>
            <Button variant="secondary">Done</Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
