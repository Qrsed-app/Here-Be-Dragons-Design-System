import * as React from "react";
import { cn } from "@/lib/utils";

// Ported 1:1 from ds/components/hbd-spinner.js (light DOM — no Shadow DOM).
// Indeterminate progress arc. The SVG is aria-hidden; the accessible name is
// carried by a visually-hidden role="status" aria-live="polite" span.
// SVG geometry (cx=12 cy=12 r=10 on a 24 viewBox) + the 47/16 dash-array are
// constants paired with spinner.css — do not tokenise.

const SIZES = ["sm", "md", "lg", "xl"] as const;
const VARIANTS = ["default", "muted", "inherit"] as const;

export interface SpinnerProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** sm 16px · md 24px (default) · lg 40px · xl 64px */
  size?: (typeof SIZES)[number];
  /** default = action colour · muted · inherit = currentColor (use inside buttons) */
  variant?: (typeof VARIANTS)[number];
  /** Accessible label announced via role="status". Defaults to "Loading". */
  label?: string;
}

const Spinner = React.forwardRef<HTMLSpanElement, SpinnerProps>(
  ({ size = "md", variant = "default", label = "Loading", className, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(
          "hbd-spinner",
          size !== "md" && `hbd-spinner--${size}`,
          variant !== "default" && `hbd-spinner--${variant}`,
          className,
        )}
        {...props}
      >
        <svg
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
          focusable="false"
        >
          <circle className="hbd-spinner__track" cx="12" cy="12" r="10" />
          <circle
            className="hbd-spinner__fill"
            cx="12"
            cy="12"
            r="10"
            transform="rotate(-90 12 12)"
          />
        </svg>
        <span className="hbd-sr-only" role="status" aria-live="polite">
          {label}
        </span>
      </span>
    );
  },
);
Spinner.displayName = "Spinner";

export { Spinner };
