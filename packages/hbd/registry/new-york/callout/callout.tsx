"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

// Ported 1:1 from ds/components/hbd-callout.js + ds/styles/components/callout.css
// (light DOM — the source CSS has no Shadow DOM constructs). Status callout with
// info / warning / error / success surfaces plus the HBD-specific "sage-advice"
// advisory variant. The React markup emits the legacy BEM classes verbatim so the
// de-shadowed callout.css reproduces the exact HBD look 1:1. Tailwind utilities
// are not used for visual design — the token-backed component CSS is.
//
// Dismiss behaviour mirrors the WC exactly: clicking the dismiss button adds the
// `is-dismissed` class (opacity + max-height + padding + margin collapse on
// --hbd-duration-slow), then on `transitionend` the callout fires hbd:dismiss
// (here onDismiss with { variant }) and unmounts. Dismissal is controlled-first
// via `dismissed` + `onDismissedChange`, with `defaultDismissed` fallback.

// ── useControllableState (inline, controlled-first with uncontrolled fallback)
function useControllableState<T>({
  value,
  defaultValue,
  onChange,
}: {
  value?: T;
  defaultValue: T;
  onChange?: (value: T) => void;
}): [T, (next: T) => void] {
  const [uncontrolled, setUncontrolled] = React.useState<T>(defaultValue);
  const isControlled = value !== undefined;
  const state = isControlled ? (value as T) : uncontrolled;

  const setState = React.useCallback(
    (next: T) => {
      if (!isControlled) setUncontrolled(next);
      onChange?.(next);
    },
    [isControlled, onChange],
  );

  return [state, setState];
}

export type CalloutVariant = "info" | "warning" | "error" | "success" | "sage-advice";

// Default glyph per variant (mirrors the WC's DEFAULT_ICON map).
const DEFAULT_ICON: Record<CalloutVariant, string> = {
  info: "ℹ",
  warning: "⚠",
  error: "✕",
  success: "✓",
  "sage-advice": "ℹ",
};

// info/success/sage-advice are non-urgent (note); error is assertive (alert);
// warning is polite (status). Mirrors the WC's VARIANT_ROLE map.
const VARIANT_ROLE: Record<CalloutVariant, "note" | "status" | "alert"> = {
  info: "note",
  success: "note",
  "sage-advice": "note",
  warning: "status",
  error: "alert",
};

const calloutVariants = cva("hbd-callout", {
  variants: {
    variant: {
      info: "hbd-callout--info",
      warning: "hbd-callout--warning",
      error: "hbd-callout--error",
      success: "hbd-callout--success",
      "sage-advice": "hbd-callout--sage-advice",
    },
    dismissible: {
      true: "hbd-callout--dismissible",
      false: "",
    },
  },
  defaultVariants: { variant: "info", dismissible: false },
});

// detail payload carried by the legacy hbd:dismiss event.
export interface CalloutDismissDetail {
  variant: CalloutVariant;
}

export interface CalloutProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title" | "role"> {
  /** info (default) | warning | error | success | sage-advice */
  variant?: CalloutVariant;
  /** Optional bold title line; when set, wires role's aria-labelledby. */
  title?: React.ReactNode;
  /** Shows the dismiss button + collapse-on-dismiss behaviour. */
  dismissible?: boolean;
  /** Overrides the variant's default icon glyph (the "icon" slot). */
  icon?: React.ReactNode;
  /** Controlled dismissed state. */
  dismissed?: boolean;
  /** Uncontrolled initial dismissed state. */
  defaultDismissed?: boolean;
  /** Fired when the dismissed state changes (true once the user dismisses). */
  onDismissedChange?: (dismissed: boolean) => void;
  /** Fired after the collapse transition ends (mirrors hbd:dismiss). */
  onDismiss?: (detail: CalloutDismissDetail) => void;
  /** The callout body content (default slot). */
  children?: React.ReactNode;
}

const Callout = React.forwardRef<HTMLDivElement, CalloutProps>(
  (
    {
      className,
      variant = "info",
      title,
      dismissible = false,
      icon,
      dismissed: dismissedProp,
      defaultDismissed = false,
      onDismissedChange,
      onDismiss,
      children,
      ...props
    },
    ref,
  ) => {
    const resolvedVariant: CalloutVariant = DEFAULT_ICON[variant] ? variant : "info";
    const role = VARIANT_ROLE[resolvedVariant] ?? "note";

    // SSR-safe per-instance id (mirrors the WC's `callout-title-N` aria wiring).
    const reactId = React.useId();
    const titleId = `callout-title-${reactId}`;

    const [dismissed, setDismissed] = useControllableState<boolean>({
      value: dismissedProp,
      defaultValue: defaultDismissed,
      onChange: onDismissedChange,
    });

    // Whether the collapse transition has finished and the node is unmounted.
    const [removed, setRemoved] = React.useState(false);
    // The WC adds its transitionend listener with { once: true } so hbd:dismiss
    // fires exactly once. The collapse transitions four properties (opacity,
    // max-height, padding, margin), each emitting its own transitionend, so we
    // guard here to mirror the single-fire behaviour.
    const firedRef = React.useRef(false);

    const handleDismissClick = () => {
      if (dismissed) return;
      setDismissed(true);
    };

    const handleTransitionEnd = (e: React.TransitionEvent<HTMLDivElement>) => {
      // Only react to the wrapper's own collapse (not nested transitions).
      if (e.target !== e.currentTarget) return;
      if (!dismissed) return;
      if (firedRef.current) return;
      firedRef.current = true;
      onDismiss?.({ variant: resolvedVariant });
      setRemoved(true);
    };

    if (removed) return null;

    const hasTitle = title != null && title !== "" && title !== false;

    return (
      <div
        ref={ref}
        className={cn(
          calloutVariants({ variant: resolvedVariant, dismissible }),
          dismissed && "is-dismissed",
          className,
        )}
        role={role}
        aria-labelledby={hasTitle ? titleId : undefined}
        onTransitionEnd={handleTransitionEnd}
        {...props}
      >
        <span className="hbd-callout__icon" aria-hidden="true">
          {icon ?? DEFAULT_ICON[resolvedVariant]}
        </span>
        <div className="hbd-callout__body">
          {hasTitle ? (
            <div className="hbd-callout__title" id={titleId}>
              {title}
            </div>
          ) : null}
          <div className="hbd-callout__content">{children}</div>
        </div>
        {dismissible ? (
          <button
            className="hbd-callout__dismiss"
            type="button"
            aria-label={`Dismiss ${resolvedVariant} message`}
            onClick={handleDismissClick}
          >
            ✕
          </button>
        ) : null}
      </div>
    );
  },
);
Callout.displayName = "Callout";

export { Callout, calloutVariants };
