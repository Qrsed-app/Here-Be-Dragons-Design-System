"use client";

import * as React from "react";
import { Modal } from "@/registry/new-york/modal/modal";
import { Button } from "@/registry/new-york/button/button";

/**
 * Basic modal — a trigger button drives the open state. Dismiss via the ✕
 * button, a backdrop click, or Escape. Focus is trapped inside and returns to
 * the trigger on close.
 */
export function ModalBasicDemo() {
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <Button variant="primary" onClick={() => setOpen(true)}>
        Open modal
      </Button>
      <Modal open={open} onOpenChange={setOpen} title="Ship's manifest">
        <p>
          A centred overlay dialog with a backdrop scrim. Use it for focused tasks that interrupt
          the main flow — confirmations, short forms, or detail views.
        </p>
      </Modal>
    </>
  );
}

/**
 * Sizes — sm, md (default), lg, and full. Each maps the legacy
 * --hbd-modal-width-* token.
 */
export function ModalSizesDemo() {
  const sizes = ["sm", "md", "lg", "full"] as const;
  const [openSize, setOpenSize] = React.useState<(typeof sizes)[number] | null>(null);

  return (
    <>
      {sizes.map((size) => (
        <Button key={size} variant="default" onClick={() => setOpenSize(size)}>
          {size}
        </Button>
      ))}
      {sizes.map((size) => (
        <Modal
          key={size}
          size={size}
          open={openSize === size}
          onOpenChange={(next) => setOpenSize(next ? size : null)}
          title={`${size} modal`}
        >
          <p>
            This dialog uses the <code>{size}</code> width.
          </p>
        </Modal>
      ))}
    </>
  );
}

/**
 * Footer actions — pass a `footer` to render an action row. Wrap buttons in
 * `Modal.Close` (or stamp `data-modal-close`) to dismiss on click.
 */
export function ModalFooterDemo() {
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <Button variant="primary" onClick={() => setOpen(true)}>
        Edit voyage
      </Button>
      <Modal
        open={open}
        onOpenChange={setOpen}
        title="Voyage settings"
        footer={
          <>
            <Modal.Close asChild>
              <Button variant="default">Cancel</Button>
            </Modal.Close>
            <Modal.Close asChild>
              <Button variant="gold">Save changes</Button>
            </Modal.Close>
          </>
        }
      >
        <p>
          The footer is a flex row aligned to the end. Its buttons are direct flex children, so the
          close actions sit side by side.
        </p>
      </Modal>
    </>
  );
}

/**
 * Alert dialog — `type="alertdialog"` focuses the first footer action on open
 * and uses role="alertdialog" for destructive confirmations.
 */
export function ModalAlertDemo() {
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <Button variant="default" onClick={() => setOpen(true)}>
        Delete chart
      </Button>
      <Modal
        open={open}
        onOpenChange={setOpen}
        type="alertdialog"
        title="Delete this chart?"
        noBackdropClose
        footer={
          <>
            <Modal.Close asChild>
              <Button variant="default">Cancel</Button>
            </Modal.Close>
            <Modal.Close asChild>
              <Button variant="primary">Delete</Button>
            </Modal.Close>
          </>
        }
      >
        <p>
          This action cannot be undone. The backdrop is non-dismissable so the choice is deliberate,
          but Escape still cancels.
        </p>
      </Modal>
    </>
  );
}
