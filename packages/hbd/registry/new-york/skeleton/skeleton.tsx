import * as React from "react";
import { cn } from "@/lib/utils";

// Ported 1:1 from ds/components/hbd-skeleton.js + ds/styles/components/skeleton.css
// (light DOM — no Shadow DOM).
//
// A decorative placeholder shape shown while real content loads. The
// skeleton itself is aria-hidden — the SURROUNDING container that becomes
// the real content owns the aria-busy loading affordance:
//
//   <div aria-busy="true" aria-label="Loading spell list">
//     <Skeleton variant="text" />
//   </div>
//
// width/height are author-supplied, value-driven properties carried via the
// inline style prop (documented dynamic exception, same as progress fill
// width). They are NOT tokenised. Everything else lives in skeleton.css.

const VARIANTS = ["text", "text-sm", "text-lg", "circle", "rect"] as const;

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  /** text (default) · text-sm · text-lg · circle · rect (height required) */
  variant?: (typeof VARIANTS)[number];
  /** CSS width override (e.g. "120px", "60%"). */
  width?: string;
  /** CSS height override (required for the "rect" variant). */
  height?: string;
  /** Disable the shimmer animation (static placeholder / reduced-motion look). */
  noShimmer?: boolean;
}

const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  ({ variant = "text", width, height, noShimmer = false, className, style, ...props }, ref) => {
    // Match the WC: lowercase the raw value, then fall back to "text" for
    // anything not in VARIANTS (the WC does `(variant || 'text').toLowerCase()`).
    const raw = String(variant).toLowerCase() as (typeof VARIANTS)[number];
    const safeVariant = VARIANTS.includes(raw) ? raw : "text";

    return (
      <div
        ref={ref}
        aria-hidden="true"
        className={cn(
          "hbd-skeleton",
          `hbd-skeleton--${safeVariant}`,
          noShimmer && "hbd-skeleton--no-shimmer",
          className,
        )}
        style={{
          ...(width != null ? { width } : null),
          ...(height != null ? { height } : null),
          ...style,
        }}
        {...props}
      />
    );
  },
);
Skeleton.displayName = "Skeleton";

export { Skeleton };
