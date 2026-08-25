"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

// Ported 1:1 from ds/components/hbd-alert.js + ds/styles/components/alert.css
// (light DOM — no Shadow DOM to de-shadow). The generic system-level feedback
// banner: form errors, system notices, API responses. The React markup emits
// the legacy BEM classes (.hbd-alert / __icon / __body / __title / __content /
// __dismiss, .hbd-alert--{variant}/--{type}/--dismissible, .is-dismissed)
// verbatim so the token-backed alert.css reproduces the exact HBD look 1:1.
// Tailwind utilities are not used for the visual design — the CSS is.
//
// Behaviour parity with the WC:
//   - variant -> role/aria-live map (error: alert/assertive, success+warning:
//     status/polite, info: note/no aria-live). ARIA lives on the host element,
//     exactly as the Light-DOM WC put it on the host.
//   - title -> bold heading line + aria-labelledby wiring.
//   - dismissible -> × button; clicking (or calling the exposed dismiss())
//     adds .is-dismissed which animates max-height+opacity to 0, then on
//     transitionend fires onDismiss({variant,type}) and unmounts the alert.
//   - persist -> remembers dismissed state in localStorage under
//     'hbd-alert-dismissed-<id|uid>'; a persisted-dismissed banner never
//     renders. The persist flag is committed at the end of the exit, matching
//     the WC's _markPersistedDismissed() on transitionend.
//
// Slots: default slot -> children (the message body / author content). Action
// buttons should carry .hbd-alert__action — use the exported Alert.Action.

export type AlertVariant = "info" | "success" | "warning" | "error";
export type AlertType = "alert" | "banner" | "inline";

const VARIANTS: readonly AlertVariant[] = ["info", "success", "warning", "error"];
const TYPES: readonly AlertType[] = ["alert", "banner", "inline"];

// Per-variant role / aria-live mapping (mirrors VARIANT_ARIA in the WC).
const VARIANT_ARIA: Record<AlertVariant, { role: string; live: "assertive" | "polite" | null }> = {
  error: { role: "alert", live: "assertive" },
  warning: { role: "status", live: "polite" },
  success: { role: "status", live: "polite" },
  info: { role: "note", live: null },
};

// Inline-SVG icons — same family as the WC (stroke outlines, currentColor) so
// they inherit the variant text colour for free. aria-hidden on the wrapper.
const ICONS: Record<AlertVariant, React.ReactNode> = {
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

const alertVariants = cva("hbd-alert", {
  variants: {
    variant: {
      info: "hbd-alert--info",
      success: "hbd-alert--success",
      warning: "hbd-alert--warning",
      error: "hbd-alert--error",
    },
    type: {
      alert: "hbd-alert--alert",
      banner: "hbd-alert--banner",
      inline: "hbd-alert--inline",
    },
  },
  defaultVariants: { variant: "info", type: "alert" },
});

let alertUidCounter = 0;

function persistKey(id: string) {
  return `hbd-alert-dismissed-${id}`;
}

function isPersistedDismissed(id: string): boolean {
  try {
    return localStorage.getItem(persistKey(id)) === "1";
  } catch {
    return false;
  }
}

function markPersistedDismissed(id: string) {
  try {
    localStorage.setItem(persistKey(id), "1");
  } catch {
    // localStorage unavailable (private mode, quota) — silently skip.
  }
}

export interface AlertDismissDetail {
  variant: AlertVariant;
  type: AlertType;
}

export interface AlertProps
  extends
    Omit<React.HTMLAttributes<HTMLDivElement>, "title">,
    Partial<VariantProps<typeof alertVariants>> {
  /** Visual + a11y variant. */
  variant?: AlertVariant;
  /** Layout type: alert (default), banner (sticky full-width), inline (compact). */
  type?: AlertType;
  /** Optional bold heading line; also wires aria-labelledby. */
  title?: string;
  /** Renders the × dismiss button and enables the collapse-on-dismiss exit. */
  dismissible?: boolean;
  /** Remember dismissed state in localStorage under the element id/uid. */
  persist?: boolean;
  /** Fired after the dismiss exit animation, with the {variant, type} detail. */
  onDismiss?: (detail: AlertDismissDetail) => void;
}

interface AlertHandle {
  /** Programmatic dismiss — equivalent to clicking the × button. */
  dismiss: () => void;
}

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  (
    {
      className,
      variant: variantProp,
      type: typeProp,
      title,
      dismissible = false,
      persist = false,
      onDismiss,
      id: idProp,
      children,
      ...props
    },
    ref,
  ) => {
    // Normalise to the WC's allow-lists (unknown -> info / alert).
    const variant: AlertVariant =
      variantProp && VARIANTS.includes(variantProp) ? variantProp : "info";
    const type: AlertType = typeProp && TYPES.includes(typeProp) ? typeProp : "alert";

    const reactUid = React.useId();
    // Stable per-instance uid (mirrors the WC's `uid-N` persist key fallback).
    const uid = React.useMemo(() => `uid-${++alertUidCounter}`, []);
    const persistId = idProp ?? uid;
    const titleId = `hbd-alert-title-${reactUid}`;

    const aria = VARIANT_ARIA[variant];

    // Persisted-dismissed banners never render (matches the WC's
    // connectedCallback early-remove). Computed once on mount.
    const [removed, setRemoved] = React.useState<boolean>(() =>
      persist ? isPersistedDismissed(persistId) : false,
    );
    const [dismissing, setDismissing] = React.useState(false);
    const dismissingRef = React.useRef(false);

    const hostRef = React.useRef<HTMLDivElement>(null);

    const beginDismiss = React.useCallback(() => {
      if (dismissingRef.current) return;
      dismissingRef.current = true;
      // Force a layout pass so the transition picks up the starting state —
      // without this a freshly-mounted alert dismissed immediately would jump
      // straight to the end state (mirrors `void this.offsetHeight`).
      if (hostRef.current) void hostRef.current.offsetHeight;
      setDismissing(true);
    }, []);

    const handleTransitionEnd = (e: React.TransitionEvent<HTMLDivElement>) => {
      // Only the host's own max-height/opacity transition finishes the exit;
      // a child transition must not trigger early removal.
      if (e.target !== hostRef.current) return;
      if (e.propertyName !== "max-height" && e.propertyName !== "opacity") return;
      if (persist) markPersistedDismissed(persistId);
      onDismiss?.({ variant, type });
      setRemoved(true);
    };

    // Expose dismiss() on the imperative handle alongside the DOM node.
    React.useImperativeHandle(
      ref,
      () =>
        Object.assign(
          hostRef.current as HTMLDivElement,
          {
            dismiss: beginDismiss,
          } as AlertHandle,
        ),
      [beginDismiss],
    );

    if (removed) return null;

    return (
      <div
        ref={hostRef}
        id={idProp}
        role={aria.role}
        aria-live={aria.live ?? undefined}
        aria-labelledby={title ? titleId : undefined}
        className={cn(
          alertVariants({ variant, type }),
          dismissible && "hbd-alert--dismissible",
          dismissing && "is-dismissed",
          className,
        )}
        onTransitionEnd={handleTransitionEnd}
        {...props}
      >
        <span className="hbd-alert__icon" aria-hidden="true">
          {ICONS[variant]}
        </span>
        <div className="hbd-alert__body">
          {title ? (
            <p className="hbd-alert__title" id={titleId}>
              {title}
            </p>
          ) : null}
          {children != null ? <div className="hbd-alert__content">{children}</div> : null}
        </div>
        {dismissible ? (
          <button
            className="hbd-alert__dismiss"
            type="button"
            data-hbd-alert-dismiss
            aria-label={`Dismiss ${variant} message`}
            onClick={beginDismiss}
          >
            <DismissIcon />
          </button>
        ) : null}
      </div>
    );
  },
);
Alert.displayName = "Alert";

// Action button slot — carries .hbd-alert__action so the underline + focus
// ring style applies (mirrors the WC's authored .hbd-alert__action buttons).
export type AlertActionProps = React.ButtonHTMLAttributes<HTMLButtonElement>;

const AlertAction = React.forwardRef<HTMLButtonElement, AlertActionProps>(
  ({ className, type, ...props }, ref) => (
    <button
      ref={ref}
      type={type ?? "button"}
      className={cn("hbd-alert__action", className)}
      {...props}
    />
  ),
);
AlertAction.displayName = "Alert.Action";

type AlertComponent = typeof Alert & { Action: typeof AlertAction };
const AlertWithSlots = Alert as AlertComponent;
AlertWithSlots.Action = AlertAction;

export { AlertWithSlots as Alert, AlertAction, alertVariants };
