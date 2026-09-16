"use client";

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/registry/new-york/dialog/dialog";
import { Button } from "@/registry/new-york/button/button";

export function DialogDemo() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="secondary">Edit voyage</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Voyage settings</DialogTitle>
          <DialogDescription>Change the course here. Save when you are done.</DialogDescription>
        </DialogHeader>
        <p>
          The fleet sails at dawn for the Sea of Fallen Stars, keeping the western lighthouse to
          starboard until the reef is behind it.
        </p>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="secondary">Cancel</Button>
          </DialogClose>
          <Button variant="gold">Save changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function DialogTitleOnlyDemo() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Open manifest</Button>
      </DialogTrigger>
      <DialogContent aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>Ship&apos;s manifest</DialogTitle>
        </DialogHeader>
        <p>
          A centred overlay dialog with a backdrop scrim. Use it for focused tasks that interrupt
          the main flow — confirmations, short forms, or detail views.
        </p>
      </DialogContent>
    </Dialog>
  );
}

const sizes = ["sm", "default", "lg", "full"] as const;

export function DialogSizesDemo() {
  return (
    <>
      {sizes.map((size) => (
        <Dialog key={size}>
          <DialogTrigger asChild>
            <Button variant="secondary">{size}</Button>
          </DialogTrigger>
          <DialogContent size={size} aria-describedby={undefined}>
            <DialogHeader>
              <DialogTitle>{size} dialog</DialogTitle>
            </DialogHeader>
            <p>This dialog uses the {size} width.</p>
          </DialogContent>
        </Dialog>
      ))}
    </>
  );
}

export function DialogCloseButtonDemo() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="secondary">Share chart</Button>
      </DialogTrigger>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Share chart</DialogTitle>
          <DialogDescription>Anyone with the link can view this chart.</DialogDescription>
        </DialogHeader>
        <p>https://charts.example/sea-of-fallen-stars</p>
        <DialogFooter showCloseButton />
      </DialogContent>
    </Dialog>
  );
}

export function DialogScrollableDemo() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="secondary">Read the log</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Captain&apos;s log</DialogTitle>
          <DialogDescription>Forty days at sea.</DialogDescription>
        </DialogHeader>
        {Array.from({ length: 40 }, (_, i) => (
          <p key={i}>
            Day {i + 1}. Fair winds from the west; the crew mended sail and the cartographer added
            three soundings to the chart.
          </p>
        ))}
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="secondary">Close</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
