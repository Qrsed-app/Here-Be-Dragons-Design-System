"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

// Ported from ds/components/hbd-toast.js + ds/styles/components/toast.css.
//
// The legacy WC was an imperative system, NOT a declarative element:
//
//   1. ToastManager (singleton) owned a single portal container at the
//      viewport edge, an active stack (capped at MAX_STACK = 3) and an
//      overflow queue. Its public API was exposed as `window.hbdToast`.
//   2. <hbd-toast-item> (internal Light-DOM element) rendered one toast:
//      icon + body (optional title + content) + optional action button +
//      optional dismiss button + a countdown progress bar.
//
// This React port reproduces that model 1:1 with a <ToastProvider> (the
// portal region/container) plus a useToast() hook and a standalone toast()
// function — BOTH driving the same store. Every behaviour is preserved:
//
//   • show({ message, title, variant, duration, action, dismissible })
//   • variant info(default)/success/warning/error
//   • per-variant role: error -> role="alert", others -> role="status"
//   • container aria-live="polite", flipped to "assertive" for one
//     macrotask when an error toast is shown (then restored)
//   • auto-dismiss timer (default 5000ms = --hbd-duration-linger), with
//     hover-pause + focus-pause + focus-out-resume, and a progress bar
//     whose animation-duration matches and pauses with the timer
//   • prefers-reduced-motion => NO auto-dismiss + NO progress bar (SC 2.2.1)
//   • Infinity duration => no timer, no progress bar
//   • stacking cap MAX_STACK=3 + overflow queue (next dequeues on dismiss)
//   • enter/leave lifecycle via .is-entering / .is-leaving — the leave
//     animationend fires hbd:dismiss (onDismiss) then removes the toast
//   • setPosition(top-right default | top-center | bottom-right |
//     bottom-center | bottom-left) re-classes the container
//   • dismissible defaults to TRUE
//
// The standalone `toast()` works without React context by talking to a
// module-level store; <ToastProvider> subscribes to that store and renders.

// ── Types ────────────────────────────────────────────────────────────
export type ToastVariant = "info" | "success" | "warning" | "error";
export type ToastPosition =
  | "top-right"
  | "top-center"
  | "bottom-right"
  | "bottom-center"
  | "bottom-left";

const VARIANTS: ToastVariant[] = ["info", "success", "warning", "error"];
const POSITIONS: ToastPosition[] = [
  "top-right",
  "top-center",
  "bottom-right",
  "bottom-center",
  "bottom-left",
];

export interface ToastAction {
  label: string;
  onClick?: (e?: unknown) => void;
}

export interface ToastOptions {
  /** Body text. */
  message?: React.ReactNode;
  /** Optional bold heading. */
  title?: string;
  /** "info" (default) | "success" | "warning" | "error". */
  variant?: ToastVariant;
  /** Auto-dismiss in ms; default 5000. Use Infinity to disable. */
  duration?: number;
  /** { label, onClick } — inline activator. */
  action?: ToastAction;
  /** Defaults to true. */
  dismissible?: boolean;
}

/** Detail carried by the WC's hbd:dismiss CustomEvent. */
export interface ToastDismissDetail {
  variant: ToastVariant;
}

interface ToastRecord extends ToastOptions {
  id: number;
  variant: ToastVariant;
  dismissible: boolean;
}

// ── Inline SVG icons — same set the WC used (shared with hbd-alert). ──
const ICONS: Record<ToastVariant, React.ReactNode> = {
  info: (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="8" cy="8" r="6.5" />
      <line x1="8" y1="7" x2="8" y2="11.5" />
      <circle cx="8" cy="4.5" r="0.6" fill="currentColor" stroke="none" />
    </svg>
  ),
  success: (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="8" cy="8" r="6.5" />
      <polyline points="5,8.5 7.2,10.6 11,6.5" />
    </svg>
  ),
  warning: (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M8 1.5 L14.5 13 H1.5 Z" />
      <line x1="8" y1="6" x2="8" y2="9.5" />
      <circle cx="8" cy="11.4" r="0.6" fill="currentColor" stroke="none" />
    </svg>
  ),
  error: (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="8" cy="8" r="6.5" />
      <line x1="5.5" y1="5.5" x2="10.5" y2="10.5" />
      <line x1="10.5" y1="5.5" x2="5.5" y2="10.5" />
    </svg>
  ),
};

const DismissIcon = () => (
  <svg
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    aria-hidden="true"
    focusable="false"
  >
    <line x1="4" y1="4" x2="12" y2="12" />
    <line x1="12" y1="4" x2="4" y2="12" />
  </svg>
);

const MAX_STACK = 3;
const LINGER = 5000; // --hbd-duration-linger fallback (5000ms)

// ── Store — mirrors ToastManager: active stack + overflow queue + the
//    aria-live flip. A module-level singleton so the standalone toast()
//    works without React context; <ToastProvider> subscribes to it. ────
type Listener = () => void;

class ToastStore {
  private uid = 0;
  active: ToastRecord[] = [];
  private queue: ToastOptions[] = [];
  position: ToastPosition = "top-right";
  ariaLive: "polite" | "assertive" = "polite";
  private listeners = new Set<Listener>();

  subscribe = (fn: Listener) => {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  };

  private emit() {
    for (const fn of this.listeners) fn();
  }

  show = (opts: ToastOptions = {}): number | undefined => {
    if (this.active.length >= MAX_STACK) {
      this.queue.push(opts);
      return undefined;
    }

    const variant: ToastVariant = VARIANTS.includes(opts.variant as ToastVariant)
      ? (opts.variant as ToastVariant)
      : "info";

    // Error toasts temporarily flip the region to assertive so the
    // announcement interrupts. Restore polite on the next macrotask so
    // subsequent non-error toasts announce normally.
    if (variant === "error") {
      this.ariaLive = "assertive";
      window.setTimeout(() => {
        this.ariaLive = "polite";
        this.emit();
      }, 0);
    }

    const record: ToastRecord = {
      ...opts,
      id: ++this.uid,
      variant,
      dismissible: opts.dismissible !== false,
    };
    this.active = [...this.active, record];
    this.emit();
    return record.id;
  };

  /** Called by an item after its leave animation completes. */
  remove = (id: number) => {
    const before = this.active.length;
    this.active = this.active.filter((t) => t.id !== id);
    if (this.active.length !== before && this.queue.length > 0) {
      // Dequeue the next overflow toast (mirrors the WC's hbd:dismiss
      // handler which shifts the queue when a slot frees up).
      const next = this.queue.shift()!;
      this.show(next);
      return;
    }
    this.emit();
  };

  setPosition = (position: ToastPosition) => {
    if (!POSITIONS.includes(position)) return;
    this.position = position;
    this.emit();
  };

  info = (message: React.ReactNode, opts?: ToastOptions) =>
    this.show({ ...(opts || {}), message, variant: "info" });
  success = (message: React.ReactNode, opts?: ToastOptions) =>
    this.show({ ...(opts || {}), message, variant: "success" });
  warning = (message: React.ReactNode, opts?: ToastOptions) =>
    this.show({ ...(opts || {}), message, variant: "warning" });
  error = (message: React.ReactNode, opts?: ToastOptions) =>
    this.show({ ...(opts || {}), message, variant: "error" });
}

const store = new ToastStore();

// ── Public imperative API — `toast()` callable + variant shorthands +
//    setPosition. Works standalone (no provider needed for the calls,
//    though a <ToastProvider> must be mounted to render the toasts). ──
export interface ToastApi {
  (opts: ToastOptions): number | undefined;
  show: (opts: ToastOptions) => number | undefined;
  info: (message: React.ReactNode, opts?: ToastOptions) => number | undefined;
  success: (message: React.ReactNode, opts?: ToastOptions) => number | undefined;
  warning: (message: React.ReactNode, opts?: ToastOptions) => number | undefined;
  error: (message: React.ReactNode, opts?: ToastOptions) => number | undefined;
  setPosition: (position: ToastPosition) => void;
}

const toast = ((opts: ToastOptions) => store.show(opts)) as ToastApi;
toast.show = store.show;
toast.info = store.info;
toast.success = store.success;
toast.warning = store.warning;
toast.error = store.error;
toast.setPosition = store.setPosition;

export { toast };

/** Hook form — returns the same imperative API. */
export function useToast(): ToastApi {
  return toast;
}

// ── ToastItem — one toast. Mirrors <hbd-toast-item>: owns its own
//    auto-dismiss timer, hover/focus pause, progress bar, and the
//    enter(.is-entering)/leave(.is-leaving) animation lifecycle. ──────
interface ToastItemProps {
  record: ToastRecord;
  onDismiss?: (detail: ToastDismissDetail) => void;
}

function parseDuration(raw: number | undefined): number {
  if (raw == null) return LINGER; // default --hbd-duration-linger
  if (raw === Infinity) return Infinity;
  return Number.isFinite(raw) && raw > 0 ? raw : LINGER;
}

function ToastItem({ record, onDismiss }: ToastItemProps) {
  const { id, variant, title, message, action, dismissible } = record;
  const totalDuration = React.useMemo(() => parseDuration(record.duration), [record.duration]);

  const reducedMotion = React.useMemo(
    () =>
      typeof window !== "undefined" &&
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    [],
  );

  // No timer + no progress bar when reduced motion is on or duration is
  // Infinity (matches the WC: the toast lingers until manually dismissed).
  const hasTimer = !reducedMotion && totalDuration !== Infinity;

  const [leaving, setLeaving] = React.useState(false);
  const removedRef = React.useRef(false);

  const titleId = `hbd-toast-title-${id}`;
  const reactId = React.useId();
  const resolvedTitleId = title ? `${titleId}-${reactId}` : undefined;

  // Timer state mirroring the WC's elapsed/paused bookkeeping.
  const timerRef = React.useRef<number | null>(null);
  const startedAtRef = React.useRef(0);
  const elapsedRef = React.useRef(0);
  const pausedRef = React.useRef(false);
  const progressRef = React.useRef<HTMLDivElement | null>(null);

  // ── Dismiss: switch to the leave animation; hbd:dismiss + removal
  //    happen on animationend (see onAnimationEnd). ──
  const dismiss = React.useCallback(() => {
    if (removedRef.current) return;
    removedRef.current = true;
    if (timerRef.current != null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    const bar = progressRef.current;
    if (bar) bar.style.animationPlayState = "paused";
    setLeaving(true);
  }, []);

  const clearTimer = React.useCallback(() => {
    if (timerRef.current != null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const pause = React.useCallback(() => {
    if (pausedRef.current || timerRef.current == null) return;
    pausedRef.current = true;
    elapsedRef.current += Date.now() - startedAtRef.current;
    clearTimer();
    const bar = progressRef.current;
    if (bar) bar.style.animationPlayState = "paused";
  }, [clearTimer]);

  const resume = React.useCallback(() => {
    if (!pausedRef.current) return;
    pausedRef.current = false;
    const remaining = Math.max(0, totalDuration - elapsedRef.current);
    if (remaining === 0) {
      dismiss();
      return;
    }
    startedAtRef.current = Date.now();
    timerRef.current = window.setTimeout(() => dismiss(), remaining);
    const bar = progressRef.current;
    if (bar) bar.style.animationPlayState = "running";
  }, [totalDuration, dismiss]);

  // Start the auto-dismiss timer on mount (unless reduced motion / Infinity).
  React.useEffect(() => {
    if (!hasTimer) return;
    elapsedRef.current = 0;
    startedAtRef.current = Date.now();
    pausedRef.current = false;
    timerRef.current = window.setTimeout(() => dismiss(), totalDuration);
    return () => clearTimer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasTimer, totalDuration]);

  // ── Pointer/focus pause handlers (mirror the WC's listeners). ──
  const onPointerEnter = () => pause();
  const onPointerLeave = () => resume();
  const onFocusIn = () => pause();
  const onFocusOut = (e: React.FocusEvent<HTMLDivElement>) => {
    // Only resume when focus leaves the toast entirely — focus moving
    // between dismiss/action buttons should keep it paused.
    if (e.currentTarget.contains(e.relatedTarget as Node | null)) return;
    resume();
  };

  const onAnimationEnd = (e: React.AnimationEvent<HTMLDivElement>) => {
    // Only react to the leave (collapse) animation finishing.
    if (!leaving) return;
    if (e.target !== e.currentTarget) return;
    onDismiss?.({ variant });
    store.remove(id);
  };

  const handleAction = (e: React.MouseEvent) => {
    // Stop the click from bubbling to the dismiss handler (mirrors the WC).
    e.stopPropagation();
    try {
      action?.onClick?.(e);
    } finally {
      // After an action runs the toast usually loses relevance.
      dismiss();
    }
  };

  return (
    <div
      className={cn(
        "hbd-toast",
        `hbd-toast--${variant}`,
        !leaving && "is-entering",
        leaving && "is-leaving",
      )}
      role={variant === "error" ? "alert" : "status"}
      aria-labelledby={resolvedTitleId}
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
      onFocus={onFocusIn}
      onBlur={onFocusOut}
      onAnimationEnd={onAnimationEnd}
    >
      <span className="hbd-toast__icon" aria-hidden="true">
        {ICONS[variant]}
      </span>

      <div className="hbd-toast__body">
        {title ? (
          <p className="hbd-toast__title" id={resolvedTitleId}>
            {title}
          </p>
        ) : null}
        {message != null ? <div className="hbd-toast__content">{message}</div> : null}
        {action && action.label ? (
          <button type="button" className="hbd-toast__action" onClick={handleAction}>
            {action.label}
          </button>
        ) : null}
      </div>

      {dismissible ? (
        <button
          className="hbd-toast__dismiss"
          type="button"
          data-hbd-toast-dismiss
          aria-label="Dismiss notification"
          onClick={dismiss}
        >
          <DismissIcon />
        </button>
      ) : null}

      {hasTimer ? (
        <div
          ref={progressRef}
          className="hbd-toast__progress"
          aria-hidden="true"
          // Per-instance value-driven inline style (documented exception,
          // same as the WC + hbd-progress fill width).
          style={{ animationDuration: `${totalDuration}ms` }}
        />
      ) : null}
    </div>
  );
}

// ── ToastProvider — the portal region/container. Subscribes to the
//    store and renders the active stack into a fixed container at the
//    viewport edge. role="region" + aria-label + aria-live (polite,
//    flipped to assertive for error toasts) + aria-relevant, exactly
//    like the WC's ToastManager._getContainer(). ──────────────────────
export interface ToastProviderProps {
  /** Initial placement; can be changed at runtime via toast.setPosition(). */
  position?: ToastPosition;
  /** Container to portal into (defaults to document.body). */
  container?: HTMLElement | null;
  /** Accessible name for the notifications region. */
  label?: string;
  /** Fired when any toast finishes its leave animation (hbd:dismiss). */
  onDismiss?: (detail: ToastDismissDetail) => void;
  children?: React.ReactNode;
}

// useSyncExternalStore subscription to the module-level store.
function useStore<T>(selector: (s: ToastStore) => T): T {
  return React.useSyncExternalStore(
    store.subscribe,
    () => selector(store),
    () => selector(store),
  );
}

export function ToastProvider({
  position,
  container,
  label = "Notifications",
  onDismiss,
  children,
}: ToastProviderProps) {
  // Apply the initial position once (declarative convenience over the
  // imperative setPosition); runtime changes flow through the store.
  const appliedInitial = React.useRef(false);
  if (!appliedInitial.current && position) {
    appliedInitial.current = true;
    if (store.position !== position) store.setPosition(position);
  }

  const active = useStore((s) => s.active);
  const pos = useStore((s) => s.position);
  const ariaLive = useStore((s) => s.ariaLive);

  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  const portalTarget = container ?? (typeof document !== "undefined" ? document.body : null);

  const region =
    mounted && portalTarget
      ? createPortal(
          <div
            className={cn("hbd-toast-container", `hbd-toast-container--${pos}`)}
            role="region"
            aria-label={label}
            aria-live={ariaLive}
            aria-relevant="additions"
          >
            {active.map((record) => (
              <ToastItem key={record.id} record={record} onDismiss={onDismiss} />
            ))}
          </div>,
          portalTarget,
        )
      : null;

  return (
    <>
      {children}
      {region}
    </>
  );
}
ToastProvider.displayName = "ToastProvider";
