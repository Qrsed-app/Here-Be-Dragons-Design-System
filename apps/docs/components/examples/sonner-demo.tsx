"use client";

import { toast } from "sonner";
import { Toaster } from "@/registry/new-york/sonner/sonner";
import { Button } from "@/registry/new-york/button/button";

// Stands in for the <Toaster /> an app mounts once in its root layout.
export function SonnerPageToaster() {
  return <Toaster />;
}

export function SonnerDemo() {
  return (
    <Button
      variant="secondary"
      onClick={() =>
        toast("Voyage logged", {
          description: "Sunday, 14 September at dawn",
          action: { label: "Undo", onClick: () => {} },
        })
      }
    >
      Show toast
    </Button>
  );
}

export function SonnerTypesDemo() {
  return (
    <>
      <Button variant="secondary" onClick={() => toast("Your map has been updated.")}>
        Default
      </Button>
      <Button variant="secondary" onClick={() => toast.success("Treasure successfully buried.")}>
        Success
      </Button>
      <Button variant="secondary" onClick={() => toast.info("The tide turns within the hour.")}>
        Info
      </Button>
      <Button variant="secondary" onClick={() => toast.warning("Low on supplies — restock soon.")}>
        Warning
      </Button>
      <Button variant="secondary" onClick={() => toast.error("The kraken breached the hull!")}>
        Error
      </Button>
      <Button
        variant="secondary"
        onClick={() =>
          toast.promise(new Promise((resolve) => setTimeout(resolve, 2000)), {
            loading: "Charting a course…",
            success: "Course charted.",
            error: "The compass spun.",
          })
        }
      >
        Promise
      </Button>
    </>
  );
}

export function SonnerDescriptionDemo() {
  return (
    <Button
      variant="secondary"
      onClick={() =>
        toast.success("Saved", {
          description: "Voyage logged to the captain’s ledger.",
          duration: Infinity,
          action: { label: "Undo", onClick: () => toast.info("Reverted the last entry.") },
        })
      }
    >
      Save voyage
    </Button>
  );
}

const positions = [
  "top-left",
  "top-center",
  "top-right",
  "bottom-left",
  "bottom-center",
  "bottom-right",
] as const;

export function SonnerPositionDemo() {
  return (
    <>
      {positions.map((position) => (
        <Button
          key={position}
          variant="secondary"
          onClick={() => toast(`Docked at ${position}.`, { position })}
        >
          {position}
        </Button>
      ))}
    </>
  );
}
