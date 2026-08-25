"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/registry/new-york/button/button";

// Ported from ds/components/hbd-modal.js + ds/styles/components/modal.css.
// The legacy WC was a Shadow-DOM custom element: a centred overlay dialog
// with a backdrop scrim, focus-trap, body-scroll-lock, return-focus, an
// always-available Escape exit (even with no-close), backdrop / container
// click-to-dismiss, stacked z-index for nested modals, and an alertdialog
// sub-type that focuses its cancel button on open. Its defining detail is
// the close lifecycle: close() applies .is-closing, waits for the dialog's
// opacity transitionend, THEN releases the scroll lock + restores focus +
// fires hbd:close.
//
// This is a faithful HAND-PORT (no Radix Dialog) so the .is-open / .is-closing
// transition lifecycle is preserved 1:1 — Radix's mount/unmount model cannot
// keep an element in a ".is-closing until transitionend" state the way the WC
// does. We portal the same backdrop/container/dialog tree into document.body,
// re-apply EVERY legacy .hbd-modal* BEM class, and reproduce the focus trap,
// scroll lock, return-focus, Escape, stacked z, and alertdialog focus exactly.
//
// Controlled-first overlay:
//   <Modal open={...} onOpenChange={...}>  (or defaultOpen for uncontrolled)
//   open maps the WC's `open` attribute; onOpenChange(false) maps hbd:close.
//   onOpen / onClose mirror the WC's hbd:open / hbd:close CustomEvents.
//
// Compound members (same file):
//   Modal           -> the dialog (children are the body)
//   Modal.Footer    -> the WC's slot="footer" (renders the footer row)
//   Modal.Close     -> a [data-modal-close] element; clicking it closes the
//                      modal (the WC's host-level data-modal-close delegation)

// ── useControllableState (controlled open + defaultOpen fallback) ──────
function useControllableState<T>(
  controlled: T | undefined,
  defaultValue: T,
  onChange?: (value: T) => void,
): [T, (value: T) => void] {
  const isControlled = controlled !== undefined;
  const [uncontrolled, setUncontrolled] = React.useState<T>(defaultValue);
  const value = isControlled ? (controlled as T) : uncontrolled;

  const setValue = React.useCallback(
    (next: T) => {
      if (!isControlled) setUncontrolled(next);
      onChange?.(next);
    },
    [isControlled, onChange],
  );

  return [value, setValue];
}

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  'input:not([disabled]):not([type="hidden"])',
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
  "audio[controls]",
  "video[controls]",
  "details > summary:first-of-type",
].join(",");

// Shared body-scroll lock counter — survives multiple stacked modals so
// each modal releases the lock only when its own counter reaches zero.
let activeLockCount = 0;
let savedBodyOverflow = "";

function lockScroll() {
  if (activeLockCount === 0) {
    savedBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
  }
  activeLockCount += 1;
}
function releaseScrollLock() {
  if (activeLockCount === 0) return;
  activeLockCount -= 1;
  if (activeLockCount === 0) {
    document.body.style.overflow = savedBodyOverflow;
    savedBodyOverflow = "";
  }
}

// Stacked-modal counter — the most recently opened modal sits on top and is
// the only one that responds to Escape / Tab (matches HbdModal._stackCount).
let stackCount = 0;

type ModalSize = "sm" | "md" | "lg" | "full";
type ModalType = "dialog" | "alertdialog";

let uidCounter = 0;

export interface ModalProps {
  /** Controlled open state — maps the WC's `open` attribute. */
  open?: boolean;
  /** Uncontrolled initial open state. */
  defaultOpen?: boolean;
  /** Called with the next open state; onOpenChange(false) maps hbd:close. */
  onOpenChange?: (open: boolean) => void;
  /** Fired after the modal finishes opening — the WC's hbd:open event. */
  onOpen?: () => void;
  /** Fired after the close transition completes — the WC's hbd:close event. */
  onClose?: () => void;
  /** "sm" | "md" (default) | "lg" | "full" — maps --hbd-modal-width-*. */
  size?: ModalSize;
  /** Heading text rendered in the header. */
  title?: string;
  /** "dialog" (default) | "alertdialog" — alertdialog focuses cancel on open. */
  type?: ModalType;
  /** Hide the ✕ button. Escape still closes (SC 2.1.2). */
  noClose?: boolean;
  /** Clicking the backdrop/scrim does NOT close the modal. Escape still does. */
  noBackdropClose?: boolean;
  /** Body content — the WC's default slot. */
  children?: React.ReactNode;
  /** Footer content — the WC's slot="footer". Also via <Modal.Footer>. */
  footer?: React.ReactNode;
  /** Extra classes merged onto the .hbd-modal__dialog box. */
  className?: string;
}

function findActiveFocusable(): HTMLElement | null {
  let el = document.activeElement as HTMLElement | null;
  // Descend into open shadow roots (nested custom elements) just like the WC.
  while (el && (el as Element).shadowRoot && (el as Element).shadowRoot!.activeElement) {
    el = (el as Element).shadowRoot!.activeElement as HTMLElement;
  }
  return el;
}

function ModalRoot({
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  onOpen,
  onClose,
  size = "md",
  title,
  type = "dialog",
  noClose = false,
  noBackdropClose = false,
  children,
  footer,
  className,
}: ModalProps) {
  const [open, setOpen] = useControllableState<boolean>(openProp, defaultOpen, onOpenChange);

  // mounted = the overlay tree is in the DOM (true while open OR closing).
  // isOpen drives .is-open; isClosing drives .is-closing. We keep .is-closing
  // applied until the dialog's opacity transitionend, exactly like the WC.
  const [mounted, setMounted] = React.useState(open);
  const [isOpen, setIsOpen] = React.useState(false);
  const [isClosing, setIsClosing] = React.useState(false);

  const uidRef = React.useRef<string>("");
  if (!uidRef.current) uidRef.current = `hbd-modal-${++uidCounter}`;
  const titleId = `modal-title-${uidRef.current}`;

  const wrapRef = React.useRef<HTMLDivElement | null>(null);
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const backdropRef = React.useRef<HTMLDivElement | null>(null);
  const dialogRef = React.useRef<HTMLDivElement | null>(null);
  const footerRef = React.useRef<HTMLDivElement | null>(null);

  const previousFocusRef = React.useRef<HTMLElement | null>(null);
  const stackIndexRef = React.useRef(0);
  const lockedRef = React.useRef(false);
  const onOpenRef = React.useRef(onOpen);
  const onCloseRef = React.useRef(onClose);
  onOpenRef.current = onOpen;
  onCloseRef.current = onClose;

  // Tracks the live open state for the document keydown listener — the WC's
  // _onKeydown bails immediately with `if (!this._isOpen) return;`. Because the
  // listener stays attached through the close animation (removed only at
  // transitionend), without this guard Tab would keep trapping focus inside a
  // closing modal. Mirrors the WC: isOpen flips false the instant close begins.
  const isOpenRef = React.useRef(false);
  isOpenRef.current = isOpen;

  // ── Focusable discovery (Light DOM + open shadow roots) ───────────────
  const collectFocusable = React.useCallback((scope: ParentNode | null, out: HTMLElement[]) => {
    if (!scope || !(scope as Element).querySelectorAll) return;
    const direct = Array.from(
      (scope as Element).querySelectorAll(FOCUSABLE_SELECTOR),
    ) as HTMLElement[];
    for (const el of direct) {
      if (isVisible(el) && !el.closest('[aria-hidden="true"]')) out.push(el);
    }
    const all = (scope as Element).querySelectorAll("*");
    for (const el of Array.from(all)) {
      const sr = (el as Element).shadowRoot;
      if (sr && sr.mode === "open") collectFocusable(sr, out);
    }
  }, []);

  const getFocusable = React.useCallback((): HTMLElement[] => {
    const dialog = dialogRef.current;
    if (!dialog) return [];
    const merged: HTMLElement[] = [];
    collectFocusable(dialog, merged);
    // De-dupe.
    const seen = new Set<HTMLElement>();
    const deduped: HTMLElement[] = [];
    for (const el of merged) {
      if (seen.has(el)) continue;
      seen.add(el);
      deduped.push(el);
    }
    // Document order — for a portalled Light-DOM tree compareDocumentPosition
    // works directly; the ✕ close button sits in the header (first in DOM),
    // which matches the WC's "× after slotted" intent because the WC's header
    // close button comes before body/footer here too — but the WC deliberately
    // moves × LAST. To preserve "opening focuses the first body input, × cycles
    // last", we sort with the close button pushed to the end.
    deduped.sort((a, b) => {
      const aClose = !!a.closest(".hbd-modal__close");
      const bClose = !!b.closest(".hbd-modal__close");
      if (aClose && !bClose) return 1;
      if (!aClose && bClose) return -1;
      const pos = a.compareDocumentPosition(b);
      if (pos & Node.DOCUMENT_POSITION_FOLLOWING) return -1;
      if (pos & Node.DOCUMENT_POSITION_PRECEDING) return 1;
      return 0;
    });
    return deduped;
  }, [collectFocusable]);

  // ── Focus on open — alertdialog focuses the first footer button ───────
  const focusOnOpen = React.useCallback(() => {
    const dialog = dialogRef.current;
    if (type === "alertdialog") {
      const footerEl = footerRef.current;
      if (footerEl) {
        const candidate = footerEl.querySelector(FOCUSABLE_SELECTOR) as HTMLElement | null;
        if (candidate && isVisible(candidate)) {
          candidate.focus({ preventScroll: true });
          return;
        }
      }
      if (dialog) dialog.focus({ preventScroll: true });
      return;
    }
    const focusable = getFocusable();
    if (focusable.length > 0) focusable[0].focus({ preventScroll: true });
    else if (dialog) dialog.focus({ preventScroll: true });
  }, [type, getFocusable]);

  // ── Document-bubble keydown: Tab focus trap + Escape close ─────────────
  const onKeydown = React.useCallback(
    (e: KeyboardEvent) => {
      // WC: _onKeydown bails when not open (e.g. during the close animation).
      if (!isOpenRef.current) return;
      // Only the TOP modal in the stack responds.
      if (stackIndexRef.current !== stackCount) return;

      if (e.key === "Escape") {
        if (e.defaultPrevented) return;
        e.preventDefault();
        setOpen(false);
        return;
      }
      if (e.key !== "Tab") return;

      const focusable = getFocusable();
      if (focusable.length === 0) {
        e.preventDefault();
        dialogRef.current?.focus({ preventScroll: true });
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = findActiveFocusable();
      const activeIndex = active ? focusable.indexOf(active) : -1;

      if (activeIndex === -1) {
        e.preventDefault();
        (e.shiftKey ? last : first).focus({ preventScroll: false });
        return;
      }
      if (e.shiftKey) {
        if (active === first) {
          e.preventDefault();
          last.focus({ preventScroll: false });
        }
      } else if (active === last) {
        e.preventDefault();
        first.focus({ preventScroll: false });
      }
    },
    [getFocusable, setOpen],
  );

  // ── Mount / open transition ───────────────────────────────────────────
  React.useEffect(() => {
    if (open) {
      // Cancel any in-flight close and (re)open.
      setMounted(true);
      setIsClosing(false);

      previousFocusRef.current = findActiveFocusable();
      if (!lockedRef.current) {
        lockScroll();
        lockedRef.current = true;
      }
      if (stackIndexRef.current === 0) {
        stackCount += 1;
        stackIndexRef.current = stackCount;
      }

      document.addEventListener("keydown", onKeydown, false);

      // Two RAFs: first commits the mounted tree with the closed transform,
      // the second flips .is-open so the opacity+transform transition plays.
      let raf2 = 0;
      const raf1 = requestAnimationFrame(() => {
        setIsOpen(true);
        raf2 = requestAnimationFrame(() => {
          focusOnOpen();
          onOpenRef.current?.();
        });
      });
      return () => {
        cancelAnimationFrame(raf1);
        if (raf2) cancelAnimationFrame(raf2);
        document.removeEventListener("keydown", onKeydown, false);
      };
    }

    // open === false. If we were mounted/open, begin the close lifecycle:
    // apply .is-closing (removing .is-open) and wait for transitionend.
    if (mounted) {
      setIsOpen(false);
      setIsClosing(true);
    }
    return undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // ── Stacked z-index — bump container/backdrop above older siblings ─────
  React.useEffect(() => {
    if (!isOpen) return;
    const container = containerRef.current;
    const backdrop = backdropRef.current;
    const idx = stackIndexRef.current;
    if (container && idx > 0) {
      const layerStep = (idx - 1) * 2;
      container.style.zIndex = `calc(var(--hbd-z-modal) + ${layerStep + 1})`;
      if (backdrop) backdrop.style.zIndex = `calc(var(--hbd-z-overlay) + ${layerStep})`;
    }
  }, [isOpen]);

  // ── Close completion — fired by the dialog's opacity transitionend ─────
  const onDialogTransitionEnd = React.useCallback(
    (e: React.TransitionEvent<HTMLDivElement>) => {
      if (!isClosing) return;
      if (e.propertyName !== "opacity") return;

      setIsClosing(false);
      setMounted(false);

      if (lockedRef.current) {
        releaseScrollLock();
        lockedRef.current = false;
      }
      document.removeEventListener("keydown", onKeydown, false);
      if (stackIndexRef.current > 0) {
        stackCount = Math.max(0, stackCount - 1);
        stackIndexRef.current = 0;
      }

      const target = previousFocusRef.current;
      previousFocusRef.current = null;
      if (target && typeof target.focus === "function" && target.isConnected) {
        target.focus({ preventScroll: true });
      }

      onCloseRef.current?.();
    },
    [isClosing, onKeydown],
  );

  // ── Defensive cleanup if unmounted while open/closing ─────────────────
  React.useEffect(() => {
    return () => {
      if (lockedRef.current) {
        releaseScrollLock();
        lockedRef.current = false;
      }
      document.removeEventListener("keydown", onKeydown, false);
      if (stackIndexRef.current > 0) {
        stackCount = Math.max(0, stackCount - 1);
        stackIndexRef.current = 0;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Close-path handlers ───────────────────────────────────────────────
  const close = React.useCallback(() => setOpen(false), [setOpen]);

  const onBackdropDown = React.useCallback(
    (e: React.PointerEvent) => {
      e.stopPropagation();
      if (noBackdropClose) return;
      close();
    },
    [noBackdropClose, close],
  );

  const onContainerDown = React.useCallback(
    (e: React.PointerEvent) => {
      if (noBackdropClose) return;
      if (e.target !== containerRef.current) return;
      e.stopPropagation();
      close();
    },
    [noBackdropClose, close],
  );

  // Host-level [data-modal-close] delegation — any descendant carrying the
  // attribute closes the modal when clicked (footer Cancel/Confirm, body
  // links). Mirrors the WC's _onSlotClick composedPath delegation.
  const onRootClick = React.useCallback(
    (e: React.MouseEvent) => {
      const el = (e.target as Element | null)?.closest?.("[data-modal-close]");
      if (!el) return;
      e.stopPropagation();
      close();
    },
    [close],
  );

  if (!mounted || typeof document === "undefined") return null;

  const classes = cn(
    "hbd-modal",
    size === "sm" && "hbd-modal--sm",
    size === "lg" && "hbd-modal--lg",
    size === "full" && "hbd-modal--full",
    type === "alertdialog" && "hbd-modal--alert",
    isOpen && "is-open",
    isClosing && "is-closing",
  );

  const hasFooter = footer != null;

  return createPortal(
    <div
      ref={wrapRef}
      className={classes}
      aria-hidden={isOpen ? "false" : "true"}
      onClick={onRootClick}
    >
      <div
        ref={backdropRef}
        className="hbd-modal__backdrop"
        aria-hidden="true"
        onPointerDown={onBackdropDown}
      />
      <div ref={containerRef} className="hbd-modal__container" onPointerDown={onContainerDown}>
        <div
          ref={dialogRef}
          className={cn("hbd-modal__dialog", className)}
          role={type}
          aria-modal="true"
          aria-labelledby={title ? titleId : undefined}
          tabIndex={-1}
          onTransitionEnd={onDialogTransitionEnd}
        >
          <div className="hbd-modal__header">
            {title ? (
              <h2 className="hbd-modal__title" id={titleId}>
                {title}
              </h2>
            ) : (
              <span />
            )}
            {!noClose ? (
              <Button
                className="hbd-modal__close"
                variant="default"
                iconOnly
                type="button"
                aria-label="Close dialog"
                onClick={close}
              >
                <span className="hbd-button__icon" aria-hidden="true">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path
                      d="M4 4l8 8M12 4l-8 8"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>
              </Button>
            ) : null}
          </div>
          <div className="hbd-modal__body">{children}</div>
          <div
            ref={footerRef}
            className="hbd-modal__footer"
            data-empty={hasFooter ? "false" : "true"}
          >
            {footer}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function isVisible(el: HTMLElement): boolean {
  if (!el) return false;
  if (el.offsetParent !== null) return true;
  const rect = el.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0;
}

// ── Modal.Footer — the WC's slot="footer". Use either the `footer` prop on
//    <Modal> or wrap footer content in <Modal.Footer> and pass it as `footer`.
//    Renders its children verbatim with NO wrapper element: the footer prop is
//    rendered directly inside .hbd-modal__footer (the flex row owning gap /
//    justify-content:flex-end), so the buttons must be its direct flex
//    children — an extra wrapper div would collapse them into one flex item. ─
function ModalFooter({ children }: { children?: React.ReactNode }) {
  return <>{children}</>;
}
ModalFooter.displayName = "Modal.Footer";

// ── Modal.Close — convenience wrapper that stamps [data-modal-close] so the
//    host delegation closes the modal (the WC's data-modal-close pattern). ──
function ModalClose({
  asChild = false,
  children,
  ...props
}: { asChild?: boolean } & React.HTMLAttributes<HTMLElement>) {
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<any>, {
      "data-modal-close": "",
    });
  }
  return (
    <span data-modal-close="" {...props}>
      {children}
    </span>
  );
}
ModalClose.displayName = "Modal.Close";

type ModalComponent = typeof ModalRoot & {
  Footer: typeof ModalFooter;
  Close: typeof ModalClose;
};

const Modal = ModalRoot as ModalComponent;
Modal.Footer = ModalFooter;
Modal.Close = ModalClose;

export { Modal, ModalFooter, ModalClose };
