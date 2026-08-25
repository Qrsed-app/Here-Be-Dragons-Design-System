"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { cn } from "@/lib/utils";
import { Button } from "@/registry/new-york/button/button";

// Ported from ds/components/hbd-drawer.js + ds/styles/components/drawer.css.
// The legacy WC was a Shadow-DOM custom element: a sliding overlay panel with
// four placements (left/right/top/bottom) and two size modifiers per axis
// (--wide for L/R, --tall for T/B). It established the canonical
// focus-trap + scroll-lock + return-focus + Escape + backdrop-click pattern:
//   open  -> snapshot the previously-focused element, lock body scroll, apply
//            .is-open (drives the transform-in), focus the first tabbable, install
//            Tab/Shift+Tab + Escape listeners, fire hbd:open
//   close -> apply .is-closing, wait for the panel's transitionend, release scroll +
//            restore focus + uninstall listeners, fire hbd:close
//
// Radix Dialog reproduces that interaction model exactly — portalled Overlay +
// Content, modal focus trap, scroll lock, focus return on close, Escape +
// outside-pointer-down dismissal, role="dialog" + aria-modal + aria-labelledby
// wiring. We re-apply the legacy .hbd-drawer* BEM classes to the Radix parts so
// the de-shadowed drawer.css renders 1:1, and bridge Radix's data-state onto the
// .is-open / .is-closing modifiers + slide keyframes (data-state="closed" keeps
// the node mounted through the exit animation — Radix Presence watches
// animationName — matching the WC's transitionend-driven close).
//
// no-backdrop (sidebar) mode -> Radix `modal={false}` (no scrim, no scroll lock,
// no pointer blocking) AND we omit the Overlay, matching the WC's sidebar branch.
//
// Compound API (all exported from this same file):
//   Drawer          -> Radix Root  (controlled open + onOpenChange + defaultOpen)
//   Drawer.Trigger  -> Radix Trigger (asChild)
//   Drawer.Content  -> Radix Content — the panel; renders header (title + ✕ close),
//                       body (children) and an optional footer prop.
//   Drawer.Close    -> Radix Close (asChild) for bespoke close buttons.

type DrawerPlacement = "left" | "right" | "top" | "bottom";

interface DrawerContextValue {
  placement: DrawerPlacement;
  wide: boolean;
  tall: boolean;
  noBackdrop: boolean;
  noClose: boolean;
  titleId: string;
}

const DrawerContext = React.createContext<DrawerContextValue>({
  placement: "left",
  wide: false,
  tall: false,
  noBackdrop: false,
  noClose: false,
  titleId: "",
});

export interface DrawerProps extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Root> {
  /** "left" (default) | "right" | "top" | "bottom". */
  placement?: DrawerPlacement;
  /** Widen the L/R panel (--hbd-drawer-width-wide). Ignored for top/bottom. */
  wide?: boolean;
  /** Heighten the T/B panel (--hbd-drawer-height-tall). Ignored for left/right. */
  tall?: boolean;
  /** Sidebar mode: no scrim, no scroll lock, no pointer blocking. Maps `no-backdrop`. */
  noBackdrop?: boolean;
  /** Hides the visible ✕ close button (Escape still closes). Maps `no-close`. */
  noClose?: boolean;
  /** Fired after the drawer opens — the WC's `hbd:open` CustomEvent. */
  onOpen?: () => void;
  /** Fired after the drawer closes — the WC's `hbd:close` CustomEvent. */
  onClose?: () => void;
}

function Drawer({
  placement = "left",
  wide = false,
  tall = false,
  noBackdrop = false,
  noClose = false,
  onOpen,
  onClose,
  onOpenChange,
  modal,
  children,
  ...props
}: DrawerProps) {
  const titleId = React.useId();
  const ctx = React.useMemo<DrawerContextValue>(
    () => ({ placement, wide, tall, noBackdrop, noClose, titleId }),
    [placement, wide, tall, noBackdrop, noClose, titleId],
  );

  // Bridge Radix's single onOpenChange into the WC's two events: hbd:open ->
  // onOpen, hbd:close -> onClose. Controlled `open` + onOpenChange are still
  // forwarded for the controlled/uncontrolled (defaultOpen) pattern.
  const handleOpenChange = React.useCallback(
    (next: boolean) => {
      onOpenChange?.(next);
      if (next) onOpen?.();
      else onClose?.();
    },
    [onOpenChange, onOpen, onClose],
  );

  return (
    <DrawerContext.Provider value={ctx}>
      <DialogPrimitive.Root
        // The WC locks body scroll, installs the focus trap, and wires Escape on
        // open UNCONDITIONALLY — no-backdrop only suppresses the visual scrim (and
        // its pointer-blocking), not the modal behaviour. So we stay modal by
        // default in both branches and just omit the Overlay for sidebar mode.
        // Authors can still force non-modal via the explicit `modal` prop.
        modal={modal ?? true}
        onOpenChange={handleOpenChange}
        {...props}
      >
        {children}
      </DialogPrimitive.Root>
    </DrawerContext.Provider>
  );
}
Drawer.displayName = "Drawer";

// ── Trigger — asChild so the author's own button becomes the trigger. Radix
//    wires aria-haspopup="dialog" / aria-expanded / aria-controls. ───────────
const DrawerTrigger = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Trigger>
>(({ asChild = true, ...props }, ref) => (
  <DialogPrimitive.Trigger ref={ref} asChild={asChild} {...props} />
));
DrawerTrigger.displayName = "Drawer.Trigger";

const CloseIcon = () => (
  <span className="hbd-button__icon" aria-hidden="true">
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  </span>
);

// Mirror Radix's data-state onto the legacy .is-open / .is-closing classes so
// any author CSS keyed on them keeps working (the slide visuals themselves are
// driven by drawer.css off [data-state]). data-state flips to "closed" the
// moment a close starts and the node stays mounted until the exit animation
// ends — that window is the WC's .is-closing phase.
function useDataState(): [string | null, (node: HTMLElement | null) => void] {
  const [state, setState] = React.useState<string | null>(null);
  const observerRef = React.useRef<MutationObserver | null>(null);

  const ref = React.useCallback((node: HTMLElement | null) => {
    observerRef.current?.disconnect();
    observerRef.current = null;
    if (!node) {
      setState(null);
      return;
    }
    setState(node.getAttribute("data-state"));
    const obs = new MutationObserver(() => {
      setState(node.getAttribute("data-state"));
    });
    obs.observe(node, { attributes: true, attributeFilter: ["data-state"] });
    observerRef.current = obs;
  }, []);

  React.useEffect(() => () => observerRef.current?.disconnect(), []);
  return [state, ref];
}

export interface DrawerContentProps extends Omit<
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>,
  "title"
> {
  /** Optional heading; renders the header title and wires aria-labelledby. */
  title?: string;
  /** Footer content — the WC's slot="footer". Renders the footer row when set. */
  footer?: React.ReactNode;
}

const DrawerContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  DrawerContentProps
>(
  (
    {
      className,
      title,
      footer,
      children,
      onEscapeKeyDown,
      onPointerDownOutside,
      onInteractOutside,
      ...props
    },
    ref,
  ) => {
    const { placement, wide, tall, noBackdrop, noClose, titleId } = React.useContext(DrawerContext);

    const [dataState, stateRef] = useDataState();
    const composedRef = useComposedRefs(ref, stateRef);

    const hasClose = !noClose;
    const showWide = wide && (placement === "left" || placement === "right");
    const showTall = tall && (placement === "top" || placement === "bottom");
    const footerEmpty = footer == null;

    const wrapperClasses = cn(
      "hbd-drawer",
      `hbd-drawer--${placement}`,
      noBackdrop && "hbd-drawer--no-backdrop",
      showWide && "hbd-drawer--wide",
      showTall && "hbd-drawer--tall",
      dataState === "open" && "is-open",
      dataState === "closed" && "is-closing",
      "hbd-drawer__panel",
      className,
    );

    return (
      <DialogPrimitive.Portal>
        {/* Sidebar (no-backdrop) mode omits the scrim entirely, matching the WC. */}
        {!noBackdrop ? <DialogPrimitive.Overlay className="hbd-drawer__backdrop" /> : null}

        <DialogPrimitive.Content
          ref={composedRef}
          // Radix Content is role="dialog" aria-modal="true" by default; carry the
          // explicit aria-labelledby when a title is present (else Radix needs a
          // Title — we always render a hidden/visible Title for the a11y contract).
          aria-labelledby={title ? titleId : undefined}
          className={wrapperClasses}
          // Dismissal parity with the WC:
          // - no-close => fully non-dismissible: the WC's Escape handler AND its
          //   backdrop-click handler both early-return when no-close is set, so
          //   neither Escape nor an outside click may close the drawer here.
          // - sidebar (no-backdrop) => the scrim is display:none in the WC, so an
          //   outside click never reaches the backdrop handler; only Escape / the
          //   close button dismiss. Block Radix's default outside-pointerdown
          //   dismissal in that mode.
          onEscapeKeyDown={(e) => {
            if (noClose) e.preventDefault();
            onEscapeKeyDown?.(e);
          }}
          onPointerDownOutside={(e) => {
            if (noClose || noBackdrop) e.preventDefault();
            onPointerDownOutside?.(e);
          }}
          onInteractOutside={(e) => {
            if (noClose || noBackdrop) e.preventDefault();
            onInteractOutside?.(e);
          }}
          {...props}
        >
          <div className="hbd-drawer__header">
            {title ? (
              <DialogPrimitive.Title asChild>
                <h2 className="hbd-drawer__title" id={titleId}>
                  {title}
                </h2>
              </DialogPrimitive.Title>
            ) : (
              // Radix requires a Title for the accessible name; keep it visually
              // hidden when the author didn't supply one, and render the empty
              // spacer the WC emitted so the header layout (space-between) holds.
              <>
                <DialogPrimitive.Title asChild>
                  <span className="hbd-sr-only">Drawer</span>
                </DialogPrimitive.Title>
                <span />
              </>
            )}

            {hasClose ? (
              <DialogPrimitive.Close asChild>
                <Button
                  variant="default"
                  iconOnly
                  type="button"
                  className="hbd-drawer__close"
                  aria-label="Close drawer"
                >
                  <CloseIcon />
                </Button>
              </DialogPrimitive.Close>
            ) : null}
          </div>

          <div className="hbd-drawer__body">{children}</div>

          <div className="hbd-drawer__footer" data-empty={footerEmpty ? "true" : "false"}>
            {footer}
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    );
  },
);
DrawerContent.displayName = "Drawer.Content";

// Tiny inline ref-composer (no extra dep) — merges Radix's forwarded ref with
// our data-state observer ref onto the single Content node.
function useComposedRefs<T>(...refs: Array<React.Ref<T> | undefined>): React.RefCallback<T> {
  return React.useCallback((node: T) => {
    for (const ref of refs) {
      if (typeof ref === "function") ref(node);
      else if (ref != null) (ref as React.MutableRefObject<T | null>).current = node;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, refs);
}

// Re-export Radix Close (asChild) so authors can wire bespoke close buttons in
// the footer without re-deriving dismissal.
const DrawerClose = DialogPrimitive.Close;

type DrawerComponent = typeof Drawer & {
  Trigger: typeof DrawerTrigger;
  Content: typeof DrawerContent;
  Close: typeof DrawerClose;
};

const DrawerCompound = Drawer as DrawerComponent;
DrawerCompound.Trigger = DrawerTrigger;
DrawerCompound.Content = DrawerContent;
DrawerCompound.Close = DrawerClose;

export { DrawerCompound as Drawer, DrawerTrigger, DrawerContent, DrawerClose };
