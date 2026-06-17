import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

// Ported 1:1 from ds/components/hbd-progress.js (light DOM — no Shadow DOM).
// Three modes, picked by props (mirroring the WC attribute logic):
//   1. Determinate    — `value` set, renders a sized fill bar.
//   2. Indeterminate  — `value` undefined; the fill shimmers from CSS.
//   3. Segmented      — `segments` set; N filled cells of M.
//
// The fill's `width` (and segment fill count) is the one documented inline-style
// exception for this component — everything else (track, colours, durations,
// easing, the two @keyframes) lives in the token-backed progress.css.
//
// The markup MUST emit the legacy BEM + ARIA exactly as the WC's _render():
//   .hbd-progress / __label-row / __label / __value / __track / __fill /
//   __segments / __segment.is-filled, plus role="progressbar" + aria-value*.

const progressVariants = cva("hbd-progress", {
  variants: {
    variant: {
      default: "",
      success: "hbd-progress--success",
      warning: "hbd-progress--warning",
      error: "hbd-progress--error",
    },
    size: {
      sm: "hbd-progress--sm",
      md: "",
      lg: "hbd-progress--lg",
    },
  },
  defaultVariants: { variant: "default", size: "md" },
});

export interface ProgressProps
  extends
    Omit<React.HTMLAttributes<HTMLDivElement>, "children">,
    VariantProps<typeof progressVariants> {
  /** Current value (0..max). When undefined → indeterminate mode. */
  value?: number;
  /** Upper bound. Default 100. */
  max?: number;
  /** Visible label rendered in the label row. */
  label?: string;
  /** Render "N%" alongside the label (determinate only). */
  showValue?: boolean;
  /** Animated diagonal stripe overlay (determinate only). */
  striped?: boolean;
  /** Enables segmented mode with N segments. */
  segments?: number;
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(n, max));
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  (
    {
      className,
      variant = "default",
      size = "md",
      value,
      max,
      label,
      showValue = false,
      striped = false,
      segments,
      ...props
    },
    ref,
  ) => {
    // Mirror the WC's normalisation: max>0 else 100; segments>0 enables segmented.
    const safeMax = Number.isFinite(max as number) && (max as number) > 0 ? (max as number) : 100;
    const hasValue = value != null;
    const rawValue = Number.isFinite(value as number) ? (value as number) : 0;
    const clampedValue = clamp(rawValue, 0, safeMax);
    const percent = (clampedValue / safeMax) * 100;

    const segCount =
      Number.isFinite(segments as number) && (segments as number) > 0
        ? Math.trunc(segments as number)
        : 0;

    const mode: "segmented" | "indeterminate" | "determinate" =
      segCount > 0 ? "segmented" : !hasValue ? "indeterminate" : "determinate";

    const ariaLabel = label || "Progress";

    const formatValueText = (val: number) => {
      const pct = Math.round((val / safeMax) * 100);
      return label ? `${pct}% — ${label}` : `${pct}%`;
    };

    // Host modifier classes — segmented/indeterminate/striped, plus variant/size.
    const hostClasses = cn(
      progressVariants({ variant, size }),
      mode === "indeterminate" && "hbd-progress--indeterminate",
      mode === "segmented" && "hbd-progress--segmented",
      striped && mode === "determinate" && "hbd-progress--striped",
      className,
    );

    // Label row — only rendered when there's a label or a value to display.
    const valueDisplay = mode === "determinate" && showValue ? `${Math.round(percent)}%` : "";
    const labelRow =
      label || valueDisplay ? (
        <div className="hbd-progress__label-row">
          {label ? <span className="hbd-progress__label">{label}</span> : <span />}
          {valueDisplay ? (
            <span className="hbd-progress__value" aria-hidden="true">
              {valueDisplay}
            </span>
          ) : null}
        </div>
      ) : null;

    let body: React.ReactNode;
    if (mode === "segmented") {
      const filled = Math.round((clampedValue / safeMax) * segCount);
      body = (
        <div
          className="hbd-progress__segments"
          role="progressbar"
          aria-label={ariaLabel}
          aria-valuemin={0}
          aria-valuemax={segCount}
          aria-valuenow={filled}
          aria-valuetext={`${filled} of ${segCount}`}
        >
          {Array.from({ length: segCount }, (_, i) => (
            <div
              key={i}
              className={cn("hbd-progress__segment", i < filled && "is-filled")}
              aria-hidden="true"
            />
          ))}
        </div>
      );
    } else if (mode === "indeterminate") {
      body = (
        <div
          className="hbd-progress__track"
          role="progressbar"
          aria-label={ariaLabel}
          aria-valuemin={0}
          aria-valuemax={safeMax}
        >
          <div className="hbd-progress__fill" />
        </div>
      );
    } else {
      // determinate — the fill width is the documented inline-style exception.
      body = (
        <div
          className="hbd-progress__track"
          role="progressbar"
          aria-label={ariaLabel}
          aria-valuemin={0}
          aria-valuemax={safeMax}
          aria-valuenow={clampedValue}
          aria-valuetext={formatValueText(clampedValue)}
        >
          <div className="hbd-progress__fill" style={{ width: `${percent}%` }} />
        </div>
      );
    }

    return (
      <div ref={ref} className={hostClasses} {...props}>
        {labelRow}
        {body}
      </div>
    );
  },
);
Progress.displayName = "Progress";

export { Progress, progressVariants };
