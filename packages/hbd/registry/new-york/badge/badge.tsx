import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

// Ported 1:1 from ds/components/hbd-badge.js + the badge section of
// ds/styles/components/badge.css (light DOM — no Shadow DOM).
//
// Two modes:
//   • Count badge  — numeric `count`, capped to "{max}+" (default max 99).
//                    The visible text caps, but the accessible name reports
//                    the REAL count (label ? `${label}, ${raw}` : `${raw}`).
//   • Dot badge    — `dot` boolean, no text. Requires `label` to carry an
//                    accessible name (role="status"); without it the dot is
//                    colour-only and gets no role/aria-label (matches the WC,
//                    which also warns in that case).
//
// Variants map to the legacy .hbd-badge--{variant} classes so the
// de-shadowed badge.css reproduces the exact HBD look 1:1.

const badgeVariants = cva("hbd-badge", {
  variants: {
    variant: {
      primary: "hbd-badge--primary",
      success: "hbd-badge--success",
      warning: "hbd-badge--warning",
      error: "hbd-badge--error",
      neutral: "hbd-badge--neutral",
    },
    dot: { true: "hbd-badge--dot", false: "" },
  },
  defaultVariants: { variant: "neutral", dot: false },
});

export interface BadgeProps
  extends
    Omit<React.HTMLAttributes<HTMLSpanElement>, "children">,
    VariantProps<typeof badgeVariants> {
  /** Numeric value to display; capped via `max`. */
  count?: number;
  /** Cap value (default 99). Counts above `max` render as "{max}+". */
  max?: number;
  /** Render the small dot variant (no text). Requires `label`. */
  dot?: boolean;
  /**
   * Accessible name for dot/status badges and prefix for count badges.
   * label="Notifications" + count={12} → "Notifications, 12".
   */
  label?: string;
}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = "neutral", dot = false, count, max = 99, label, ...props }, ref) => {
    const cap = Number.isFinite(max) && (max as number) > 0 ? (max as number) : 99;

    // ── Dot variant ─────────────────────────────────────────────
    if (dot) {
      const a11y = label ? { role: "status" as const, "aria-label": label } : {};
      return (
        <span
          ref={ref}
          className={cn(badgeVariants({ variant, dot: true }), className)}
          {...props}
          {...a11y}
        />
      );
    }

    // ── Count variant ───────────────────────────────────────────
    const raw = count != null && Number.isFinite(count) ? Math.trunc(count) : null;

    if (raw == null) {
      return (
        <span
          ref={ref}
          className={cn(badgeVariants({ variant, dot: false }), className)}
          {...props}
        />
      );
    }

    const display = raw > cap ? `${cap}+` : String(raw);
    // Accessible label reports the REAL count, not the truncated "{max}+".
    const a11y = label ? `${label}, ${raw}` : `${raw}`;

    return (
      <span
        ref={ref}
        className={cn(badgeVariants({ variant, dot: false }), className)}
        {...props}
        aria-label={a11y}
      >
        {display}
      </span>
    );
  },
);
Badge.displayName = "Badge";

export { Badge, badgeVariants };
