import * as React from "react";
import { cn } from "@/lib/utils";

// Ported 1:1 from ds/components/hbd-spacer.js (light DOM — no Shadow DOM).
// Explicit-whitespace utility. Produces no visible UI: width/height are written
// inline based on size + axis, and the element is decorative (role="none"
// aria-hidden="true") so it never enters the a11y tree or Tab order.
//
// `size` accepts a numeric token key ("1".."32") OR a raw CSS length
// ("32px", "2rem", "10%"). Numeric keys in the emitted spacing scale resolve to
// var(--hbd-space-N); anything else passes through verbatim. The inline
// width/height style is the documented dynamic exception (same pattern as
// skeleton rect height and progress fill width).

const AXES = ["vertical", "horizontal", "both"] as const;
type Axis = (typeof AXES)[number];

// Mirror of the emitted spacing scale (tokens.json → spacing → --hbd-space-N).
// Numeric keys outside this set fall through to "treat as raw CSS".
const VALID_SCALE = new Set(["1", "2", "3", "4", "6", "8", "12", "16", "24", "32"]);

function resolveSize(size?: string | number): string {
  if (size === undefined || size === null || size === "") return "";
  const key = String(size);
  if (VALID_SCALE.has(key)) return `var(--hbd-space-${key})`;
  return key;
}

export interface SpacerProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Numeric token key ("1".."32") or a raw CSS length ("32px", "2rem", "10%"). */
  size?: string | number;
  /** "vertical" (default) | "horizontal" | "both". */
  axis?: Axis;
}

const Spacer = React.forwardRef<HTMLDivElement, SpacerProps>(
  ({ size, axis = "vertical", className, style, ...props }, ref) => {
    const value = resolveSize(size);
    // Match the WC _axis(): lowercase-normalize, fall back to "vertical" for any
    // unrecognized value (mirrors VALID_AXES.includes(raw) ? raw : 'vertical').
    const raw = String(axis ?? "vertical").toLowerCase();
    const a: Axis = (AXES as readonly string[]).includes(raw) ? (raw as Axis) : "vertical";

    // Reset whichever inline dimension isn't in play so toggling axis at runtime
    // never leaves a stale value behind (matches the WC _render reset).
    const dynamicStyle: React.CSSProperties = {
      height: a === "vertical" || a === "both" ? value || undefined : undefined,
      width: a === "horizontal" || a === "both" ? value || undefined : undefined,
    };

    return (
      <div
        ref={ref}
        className={cn("hbd-spacer", className)}
        role="none"
        aria-hidden="true"
        style={{ ...dynamicStyle, ...style }}
        {...props}
      />
    );
  },
);
Spacer.displayName = "Spacer";

export { Spacer };
