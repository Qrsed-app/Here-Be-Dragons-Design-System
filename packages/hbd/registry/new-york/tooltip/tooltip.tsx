"use client";

import * as React from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { cn } from "@/lib/utils";

// Ported from ds/components/hbd-tooltip.js + ds/styles/components/tooltip.css.
//
// The legacy WC was a Light-DOM wrapper around a trigger element that drove a
// SINGLE shared .hbd-tooltip panel in <body>: show on hover (after the
// --hbd-tooltip-delay-show delay) / focus (immediate), hide on leave/blur
// (after --hbd-tooltip-delay-hide), Escape dismiss on the focused trigger,
// placement top/bottom/left/right with viewport flip + clamp, a CSS-triangle
// arrow, role="tooltip", and aria-describedby wiring from trigger -> panel.
//
// Radix Tooltip reproduces that exact behaviour + ARIA model 1:1:
//   - hover/focus show with a configurable delayDuration (we feed it the token
//     --hbd-tooltip-delay-show, default 300ms; focus is instant per Radix),
//   - hide-on-leave/blur, Escape + pointer-down dismiss with focus kept,
//   - role="tooltip" on the content + aria-describedby on the trigger,
//   - side=top|bottom|left|right with built-in collision flip (the WC's
//     opposite-side flip) + shift clamp (the WC's viewport clamp),
//   - a portalled panel that is never clipped by ancestor overflow (the WC used
//     position:fixed for the same reason).
// We re-apply the legacy .hbd-tooltip* BEM classes to the Radix Content so the
// de-shadowed tooltip.css renders the HBD look 1:1, and bridge Radix's injected
// data-side onto the legacy .hbd-tooltip--{side} placement class (which the CSS
// keys the arrow off). The arrow itself stays the bespoke CSS triangle
// (.hbd-tooltip__arrow) rather than Radix's <Arrow>, matching the source exactly.
//
// Controlled-first overlay: open + onOpenChange + defaultOpen (useControllable
// state), mapping the WC's show/hide lifecycle. A `content` convenience prop is
// supported alongside the compound Tooltip.Trigger / Tooltip.Content members.

// ── useControllableState ─────────────────────────────────────────────
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

export type TooltipPlacement = "top" | "bottom" | "left" | "right";

// Read a duration token (e.g. --hbd-tooltip-delay-show) off :root, mirroring the
// WC's parseTokenMs() so the show/hide timing stays token-driven. Falls back when
// the token isn't reachable (SSR / token CSS not yet applied).
function parseTokenMs(name: string, fallback: number): number {
  if (typeof document === "undefined") return fallback;
  const root = document.documentElement;
  if (!root) return fallback;
  const raw = getComputedStyle(root).getPropertyValue(name).trim();
  if (!raw) return fallback;
  const n = parseFloat(raw);
  if (!Number.isFinite(n)) return fallback;
  if (raw.endsWith("ms")) return n;
  if (raw.endsWith("s")) return n * 1000;
  return n;
}

// ── Provider (re-exported so apps can wrap their tree once, like Radix) ──
const TooltipProvider = TooltipPrimitive.Provider;

interface TooltipContextValue {
  placement: TooltipPlacement;
  content?: React.ReactNode;
}
const TooltipContext = React.createContext<TooltipContextValue>({
  placement: "top",
});

// ── Tooltip (Root) ───────────────────────────────────────────────────
export interface TooltipProps extends Omit<
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Root>,
  "open" | "defaultOpen" | "onOpenChange" | "delayDuration"
> {
  /** Controlled open state (legacy: tooltip currently shown). */
  open?: boolean;
  /** Uncontrolled initial open state. */
  defaultOpen?: boolean;
  /** Fires when the tooltip opens/closes (legacy hbd:open / hbd:close). */
  onOpenChange?: (open: boolean) => void;
  /**
   * Placement (legacy `placement` attribute). Radix flips to the opposite side
   * + shifts on collision, matching the WC's flip + viewport clamp.
   */
  placement?: TooltipPlacement;
  /**
   * Show delay in ms (legacy `delay` attribute). When omitted, reads the
   * --hbd-tooltip-delay-show token (default 300ms), exactly like the WC.
   */
  delay?: number;
  /**
   * Convenience: tooltip text. When provided, a default Tooltip.Content panel is
   * rendered so callers can write <Tooltip content="…"><Trigger/></Tooltip>.
   * Omit it and supply an explicit <Tooltip.Content> for rich content.
   */
  content?: React.ReactNode;
}

const TooltipRoot = ({
  open,
  defaultOpen,
  onOpenChange,
  placement = "top",
  delay,
  content,
  children,
  ...props
}: TooltipProps) => {
  const [isOpen, setOpen] = useControllableState<boolean>(open, defaultOpen ?? false, onOpenChange);

  // Token-driven show delay (focus is instant per Radix, matching the WC's
  // _onFocusIn => _show(0)). An explicit `delay` prop overrides the token.
  const delayDuration = React.useMemo(() => {
    if (typeof delay === "number" && Number.isFinite(delay) && delay >= 0) {
      return delay;
    }
    return parseTokenMs("--hbd-tooltip-delay-show", 300);
  }, [delay]);

  const ctx = React.useMemo<TooltipContextValue>(
    () => ({ placement, content }),
    [placement, content],
  );

  const hasInlineContent = content != null && content !== "";

  return (
    <TooltipContext.Provider value={ctx}>
      <TooltipPrimitive.Root
        open={isOpen}
        onOpenChange={setOpen}
        delayDuration={delayDuration}
        {...props}
      >
        {children}
        {hasInlineContent ? <TooltipContent>{content}</TooltipContent> : null}
      </TooltipPrimitive.Root>
    </TooltipContext.Provider>
  );
};
TooltipRoot.displayName = "Tooltip";

// ── TooltipTrigger ───────────────────────────────────────────────────
// Radix Trigger wires aria-describedby -> the content's id (the WC set
// aria-describedby on the trigger by hand). asChild lets callers pass their own
// element (e.g. <Button icon-only>) as the trigger, mirroring the WC's
// "first child element is the trigger" behaviour.
export interface TooltipTriggerProps extends React.ComponentPropsWithoutRef<
  typeof TooltipPrimitive.Trigger
> {
  asChild?: boolean;
}

const TooltipTrigger = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Trigger>,
  TooltipTriggerProps
>(({ asChild = true, ...props }, ref) => (
  <TooltipPrimitive.Trigger ref={ref} asChild={asChild} {...props} />
));
TooltipTrigger.displayName = "TooltipTrigger";

// ── TooltipContent (the panel) ───────────────────────────────────────
// Radix Content owns role="tooltip", the portal (never clipped), the
// side/align positioning, Escape + pointer-down dismiss, and data-side/data-state
// attributes. We re-apply the .hbd-tooltip BEM classes + bridge data-side onto
// the legacy .hbd-tooltip--{side} placement class so the de-shadowed CSS picks
// the correct arrow side. The arrow is the bespoke CSS triangle, identical to
// the source — NOT Radix's <Arrow>.
export interface TooltipContentProps extends Omit<
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>,
  "side"
> {
  /** Overrides the placement set on <Tooltip placement="…">. */
  side?: TooltipPlacement;
}

const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  TooltipContentProps
>(({ className, side, sideOffset, children, ...props }, ref) => {
  const { placement } = React.useContext(TooltipContext);
  const resolvedSide = side ?? placement;

  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        ref={ref}
        side={resolvedSide}
        // Small gap between trigger and tooltip — the WC used remToPx(0.5) = 8px.
        sideOffset={sideOffset ?? 8}
        // Radix toggles data-side on collision flip; the bridge below keeps the
        // legacy placement class (and therefore the arrow) in sync with it.
        asChild
        {...props}
      >
        <TooltipPanel className={className} fallbackSide={resolvedSide}>
          {children}
        </TooltipPanel>
      </TooltipPrimitive.Content>
    </TooltipPrimitive.Portal>
  );
});
TooltipContent.displayName = "TooltipContent";

// Inner panel that reads Radix's injected data-side (which reflects the actual,
// post-collision-flip side) and maps it onto the legacy .hbd-tooltip--{side}
// class the de-shadowed CSS keys the arrow + offset off. Rendered asChild from
// Content so it receives data-side / data-state / id / style verbatim.
interface TooltipPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  "data-side"?: TooltipPlacement;
  fallbackSide: TooltipPlacement;
}
const TooltipPanel = React.forwardRef<HTMLDivElement, TooltipPanelProps>(
  ({ className, children, "data-side": dataSide, fallbackSide, ...props }, ref) => {
    const side = dataSide ?? fallbackSide;
    return (
      <div
        ref={ref}
        data-side={dataSide}
        // The WC set aria-live="off" on the panel: it is described BY the
        // trigger (aria-describedby) and must not also be a live region.
        aria-live="off"
        className={cn("hbd-tooltip", `hbd-tooltip--${side}`, className)}
        {...props}
      >
        <span className="hbd-tooltip__content">{children}</span>
        <div className="hbd-tooltip__arrow" />
      </div>
    );
  },
);
TooltipPanel.displayName = "TooltipPanel";

// ── Compound assembly ────────────────────────────────────────────────
const Tooltip = Object.assign(TooltipRoot, {
  Provider: TooltipProvider,
  Trigger: TooltipTrigger,
  Content: TooltipContent,
});

export { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent };
