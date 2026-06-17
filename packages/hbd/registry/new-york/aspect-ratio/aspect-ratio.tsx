import * as React from "react";
import { cn } from "@/lib/utils";

// Ported 1:1 from ds/components/hbd-aspect-ratio.js + ds/styles/components/aspect-ratio.css.
// Light-DOM layout wrapper that constrains its first child to a fixed aspect ratio
// via the native CSS `aspect-ratio` property. The token-backed aspect-ratio.css owns
// the visuals; the only inline style is the documented dynamic exception --_hbd-ar
// (instance-private, per-author ratio — never tokenised).

/**
 * Parse the WC's three ratio notations into a CSS `aspect-ratio` value:
 *   "16:9"  -> "16 / 9"   (colon)
 *   "16/9"  -> "16 / 9"   (slash)
 *   "1.777" -> "1.777"    (decimal — CSS accepts a number)
 * Falls back to "16 / 9".
 */
function parseRatio(raw?: string): string {
  const value = String(raw ?? "").trim();
  if (!value) return "16 / 9";
  if (value.includes(":")) {
    const [w, h] = value.split(":").map((s) => s.trim());
    if (w && h) return `${w} / ${h}`;
  }
  if (value.includes("/")) {
    const [w, h] = value.split("/").map((s) => s.trim());
    if (w && h) return `${w} / ${h}`;
  }
  if (/^\d+(\.\d+)?$/.test(value)) return value;
  return "16 / 9";
}

export interface AspectRatioProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Target ratio. Accepts "16:9" / "4:3" / "1:1" / "3:2" / "21:9" / "9:16"
   * (colon), "16/9" (slash), or a decimal like "1.777". Defaults to "16:9".
   *
   * Accessibility: the wrapper carries no ARIA of its own — slot a child with
   * its own accessible name (alt on <img>, aria-label on <iframe>/<canvas>,
   * role="img" + aria-label on a styled <div>, etc.).
   */
  ratio?: string;
}

const AspectRatio = React.forwardRef<HTMLDivElement, AspectRatioProps>(
  ({ ratio, className, style, children, ...props }, ref) => {
    const cssRatio = parseRatio(ratio);
    return (
      <div
        ref={ref}
        className={cn("hbd-aspect-ratio", className)}
        style={{ ["--_hbd-ar" as string]: cssRatio, ...style }}
        {...props}
      >
        {children}
      </div>
    );
  },
);
AspectRatio.displayName = "AspectRatio";

export { AspectRatio };
