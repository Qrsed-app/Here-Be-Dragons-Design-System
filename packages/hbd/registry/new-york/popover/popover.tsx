"use client";

import * as React from "react";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { cn } from "@/lib/utils";
import { Button } from "@/registry/new-york/button/button";

// Ported from ds/components/hbd-popover.js + ds/styles/components/popover.css.
// The legacy WC was a Light-DOM custom element: a click-triggered floating
// panel (NOT a modal — aria-modal="false", no backdrop, no scroll lock) that
// owned its own per-instance panel with a header (title + ✕ close), a body,
// an optional footer, and a placement arrow. It positioned itself with JS
// inline top/left, flipped to the opposite side on collision, trapped focus
// while open, returned focus to the previously-focused element on close, and
// closed on Escape (always) or an outside pointerdown.
//
// Radix Popover reproduces that interaction model exactly — Trigger (asChild),
// portalled Content, floating-ui positioning with collision flip, focus trap +
// focus return, Escape + outside-pointer-down dismissal, aria-haspopup/expanded/
// controls wiring on the trigger — WITHOUT a modal backdrop (Radix Popover is
// non-modal by default, matching aria-modal="false"). We re-apply the legacy
// .hbd-popover* BEM classes to the Radix parts so the de-shadowed popover.css
// renders the HBD look 1:1, and bridge Radix's resolved data-side/data-state
// onto the placement modifiers + .hbd-popover--visible reveal.
//
// Compound API (all exported from this same file):
//   Popover            -> Radix Root  (controlled open + onOpenChange + defaultOpen)
//   Popover.Trigger    -> Radix Trigger (asChild)  — the WC's slot="trigger"
//   Popover.Content    -> Radix Content — the panel; renders title/close/body/
//                          footer/arrow. `title`, `noClose`, `footer` props map
//                          the WC's attributes/slots; placement/offset flow from
//                          the Root context.

// ── Context to carry placement + offset from Root to Content (mirrors the
//    WC reading `placement`/`offset` attributes off the host). ────────────
type PopoverPlacement = "top" | "bottom" | "left" | "right";

interface PopoverContextValue {
  placement: PopoverPlacement;
  offset: number;
}

const PopoverContext = React.createContext<PopoverContextValue>({
  placement: "bottom",
  offset: 8,
});

export interface PopoverProps extends React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Root> {
  /** "top" | "bottom" (default) | "left" | "right". */
  placement?: PopoverPlacement;
  /** px gap from the trigger (default 8, matching the WC). */
  offset?: number;
  /** Fired after the panel opens — the WC's `hbd:open` CustomEvent. */
  onOpen?: () => void;
  /** Fired after the panel closes — the WC's `hbd:close` CustomEvent. */
  onClose?: () => void;
}

function Popover({
  placement = "bottom",
  offset = 8,
  onOpen,
  onClose,
  onOpenChange,
  children,
  ...props
}: PopoverProps) {
  const ctx = React.useMemo<PopoverContextValue>(
    () => ({ placement, offset }),
    [placement, offset],
  );
  // Bridge Radix's single onOpenChange into the WC's two events: hbd:open
  // -> onOpen, hbd:close -> onClose. Controlled `open` + onOpenChange are
  // still forwarded for the controlled/uncontrolled (defaultOpen) pattern.
  const handleOpenChange = React.useCallback(
    (next: boolean) => {
      onOpenChange?.(next);
      if (next) onOpen?.();
      else onClose?.();
    },
    [onOpenChange, onOpen, onClose],
  );
  return (
    <PopoverContext.Provider value={ctx}>
      <PopoverPrimitive.Root onOpenChange={handleOpenChange} {...props}>
        {children}
      </PopoverPrimitive.Root>
    </PopoverContext.Provider>
  );
}
Popover.displayName = "Popover";

// ── Trigger — asChild so the author's own element/button becomes the trigger
//    (the WC's slot="trigger"). Radix wires aria-haspopup/expanded/controls. ──
const PopoverTrigger = React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Trigger>
>(({ asChild = true, ...props }, ref) => (
  <PopoverPrimitive.Trigger ref={ref} asChild={asChild} {...props} />
));
PopoverTrigger.displayName = "Popover.Trigger";

const CloseIcon = () => (
  <svg
    viewBox="0 0 16 16"
    width="16"
    height="16"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    aria-hidden="true"
  >
    <line x1="4" y1="4" x2="12" y2="12" />
    <line x1="12" y1="4" x2="4" y2="12" />
  </svg>
);

export interface PopoverContentProps extends Omit<
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>,
  "side" | "sideOffset" | "title"
> {
  /** Optional heading; renders the header row (with the ✕ close) when set. */
  title?: string;
  /** Hides the visible ✕ close button (Escape still closes). Maps `no-close`. */
  noClose?: boolean;
  /** Footer content — the WC's slot="footer". Renders the footer row when set. */
  footer?: React.ReactNode;
}

const PopoverContent = React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Content>,
  PopoverContentProps
>(({ className, title, noClose = false, footer, children, ...props }, ref) => {
  const { placement, offset } = React.useContext(PopoverContext);
  const hasClose = !noClose;
  const titleId = React.useId();

  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        ref={ref}
        side={placement}
        sideOffset={offset}
        // The legacy panel is role="dialog" aria-modal="false" — Radix
        // Content is a non-modal dialog by default; carry the role + the
        // explicit non-modal flag so AT keeps the rest of the page in tree.
        role="dialog"
        aria-modal="false"
        aria-labelledby={title ? titleId : undefined}
        // The enter/visible reveal is driven by Radix's data-state="open"
        // mapped onto .hbd-popover--visible in popover.css (so the close
        // fade-out plays via data-state="closed" → base opacity:0), matching
        // the WC's deferred-class reveal. We do NOT hard-apply --visible.
        className={cn("hbd-popover", `hbd-popover--${placement}`, className)}
        {...props}
      >
        {title ? (
          <div className="hbd-popover__header">
            <h2 id={titleId} className="hbd-popover__title">
              {title}
            </h2>
            {hasClose ? (
              <PopoverPrimitive.Close asChild>
                <Button
                  variant="default"
                  size="sm"
                  iconOnly
                  className="hbd-popover__close"
                  aria-label="Close popover"
                >
                  <CloseIcon />
                </Button>
              </PopoverPrimitive.Close>
            ) : null}
          </div>
        ) : null}

        <div className="hbd-popover__body">{children}</div>

        {footer != null ? <div className="hbd-popover__footer">{footer}</div> : null}

        <div className="hbd-popover__arrow" aria-hidden="true" />
      </PopoverPrimitive.Content>
    </PopoverPrimitive.Portal>
  );
});
PopoverContent.displayName = "Popover.Content";

// Re-export Radix Close so authors can wire bespoke close buttons in the
// footer (the WC's footer "Close" button) without re-deriving dismissal.
const PopoverClose = PopoverPrimitive.Close;

// Compound members on Popover for the documented Popover + Popover.Trigger/
// Content/Close ergonomics, while keeping the named exports too.
type PopoverComponent = typeof Popover & {
  Trigger: typeof PopoverTrigger;
  Content: typeof PopoverContent;
  Close: typeof PopoverClose;
};

const PopoverCompound = Popover as PopoverComponent;
PopoverCompound.Trigger = PopoverTrigger;
PopoverCompound.Content = PopoverContent;
PopoverCompound.Close = PopoverClose;

export { PopoverCompound as Popover, PopoverTrigger, PopoverContent, PopoverClose };
