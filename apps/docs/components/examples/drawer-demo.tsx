"use client";

import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/registry/new-york/drawer/drawer";
import { Button } from "@/registry/new-york/button/button";

export function DrawerDemo() {
  return (
    <Drawer>
      <DrawerTrigger asChild>
        <Button variant="secondary">Open drawer</Button>
      </DrawerTrigger>
      <DrawerContent>
        <div className="mx-auto w-full max-w-sm">
          <DrawerHeader>
            <DrawerTitle>Set the course</DrawerTitle>
            <DrawerDescription>Choose a heading for the fleet.</DrawerDescription>
          </DrawerHeader>
          <div className="p-4">
            <p>North-north-west past the reef, then hold the lighthouse to starboard until dawn.</p>
          </div>
          <DrawerFooter>
            <Button variant="gold">Set sail</Button>
            <DrawerClose asChild>
              <Button variant="secondary">Cancel</Button>
            </DrawerClose>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  );
}

const directions = ["top", "right", "bottom", "left"] as const;

export function DrawerDirectionDemo() {
  return (
    <>
      {directions.map((direction) => (
        <Drawer key={direction} direction={direction}>
          <DrawerTrigger asChild>
            <Button variant="secondary">{direction}</Button>
          </DrawerTrigger>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>{direction} drawer</DrawerTitle>
              <DrawerDescription>
                Drag it back towards the {direction} edge to close.
              </DrawerDescription>
            </DrawerHeader>
            <div className="p-4">
              <p>Drawers follow the pointer and snap shut when released past the threshold.</p>
            </div>
            <DrawerFooter>
              <DrawerClose asChild>
                <Button variant="secondary">Close</Button>
              </DrawerClose>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      ))}
    </>
  );
}
