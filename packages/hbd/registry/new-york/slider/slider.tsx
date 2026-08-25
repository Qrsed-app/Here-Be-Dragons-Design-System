"use client";

import * as React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

// Ported from ds/components/hbd-slider.js + the slider rules in
// ds/styles/components/input.css (de-shadowed into slider.css).
//
// The legacy WC layered a styled track + custom thumb over native
// input[type=range]. We re-base on @radix-ui/react-slider — it gives the
// same single/range value model + full keyboard (Arrow/Home/End/Page) for
// free — and re-apply the exact .hbd-slider* classes to its Track/Range/
// Thumb parts so the de-shadowed CSS renders 1:1. The surrounding field
// chrome (label, value display, ticks, hint/error footer) is hand-built
// with the legacy .hbd-slider-field* / .hbd-field* classes verbatim.

let uidCounter = 0;

const sliderFieldVariants = cva("hbd-slider-field", {
  variants: {
    size: {
      sm: "hbd-slider-field--sm",
      md: "",
      lg: "hbd-slider-field--lg",
    },
  },
  defaultVariants: { size: "md" },
});

// ── useControllableState (controlled-first w/ uncontrolled fallback) ─────
function useControllableState<T>(
  controlled: T | undefined,
  defaultValue: T,
  onChange?: (v: T) => void,
): [T, (v: T) => void] {
  const [uncontrolled, setUncontrolled] = React.useState<T>(defaultValue);
  const isControlled = controlled !== undefined;
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

export interface SliderProps
  extends
    Omit<
      React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>,
      "value" | "defaultValue" | "onValueChange" | "onValueCommit" | "min" | "max" | "step"
    >,
    VariantProps<typeof sliderFieldVariants> {
  min?: number;
  max?: number;
  step?: number;
  /** Two-handle range slider (value is a [low, high] tuple). */
  range?: boolean;
  /** Controlled value: a number (single) or [low, high] (range). */
  value?: number | [number, number];
  /** Uncontrolled initial value. */
  defaultValue?: number | [number, number];
  /** Fires on every change (drag/keyboard) with the new value/[low,high]. */
  onValueChange?: (value: number | [number, number]) => void;
  /** Fires when interaction commits (Radix onValueCommit). */
  onValueCommit?: (value: number | [number, number]) => void;
  /** Visible field label. */
  label?: string;
  /** Helper text below the track. */
  hint?: string;
  /** Error message — switches the field to its error look + role=alert. */
  error?: string;
  /** Render the current value readout in the header. */
  showValue?: boolean;
  /** Render evenly-spaced tick marks + labels below the track. */
  showTicks?: boolean;
  /** Number of ticks when showTicks is set (min 2, default 5). */
  tickCount?: number;
  disabled?: boolean;
  /** Form field name (single value). */
  name?: string;
}

const Slider = React.forwardRef<React.ElementRef<typeof SliderPrimitive.Root>, SliderProps>(
  (
    {
      className,
      size,
      range = false,
      value,
      defaultValue,
      onValueChange,
      onValueCommit,
      min = 0,
      max = 100,
      step = 1,
      label,
      hint,
      error,
      showValue = false,
      showTicks = false,
      tickCount = 5,
      disabled = false,
      name,
      ...props
    },
    ref,
  ) => {
    const uid = React.useMemo(() => `hbd-slider-${++uidCounter}`, []);
    const hasError = error != null && error !== "";
    const hasHint = hint != null && hint !== "";

    // Normalise to the array form Radix uses internally, while exposing the
    // legacy-shaped value (number for single, [low, high] for range).
    const toArray = React.useCallback(
      (v: number | [number, number] | undefined): number[] | undefined => {
        if (v == null) return undefined;
        return Array.isArray(v) ? [...v] : [v];
      },
      [],
    );

    const fallback: number | [number, number] = range ? [min, max] : min;

    const [current, setCurrent] = useControllableState<number | [number, number]>(
      value,
      defaultValue ?? fallback,
      onValueChange,
    );

    const currentArray = toArray(current) ?? (range ? [min, max] : [min]);

    const fromArray = React.useCallback(
      (arr: number[]): number | [number, number] =>
        range ? ([arr[0], arr[1]] as [number, number]) : arr[0],
      [range],
    );

    const handleValueChange = React.useCallback(
      (arr: number[]) => setCurrent(fromArray(arr)),
      [fromArray, setCurrent],
    );

    const handleValueCommit = React.useCallback(
      (arr: number[]) => onValueCommit?.(fromArray(arr)),
      [fromArray, onValueCommit],
    );

    const describedBy =
      [hasHint ? `hint-${uid}` : "", hasError ? `error-${uid}` : ""].filter(Boolean).join(" ") ||
      undefined;

    const displayValue = range
      ? `${currentArray[0]} – ${currentArray[1]}`
      : String(currentArray[0]);

    // Tick values, rounded to step granularity (parity with the WC).
    const ticks = React.useMemo(() => {
      if (!showTicks) return [] as number[];
      const count = Math.max(2, tickCount || 5);
      return Array.from({ length: count }, (_, i) => {
        const v = min + ((max - min) * i) / (count - 1);
        return step >= 1 ? Math.round(v) : Math.round(v * 100) / 100;
      });
    }, [showTicks, tickCount, min, max, step]);

    return (
      <div
        className={cn(
          sliderFieldVariants({ size }),
          disabled && "hbd-slider-field--disabled",
          hasError && "hbd-slider-field--error",
          disabled && "is-disabled",
          hasError && "is-invalid",
          className,
        )}
      >
        {(label || showValue) && (
          <div className="hbd-slider-field__header">
            {label ? (
              <label className="hbd-slider-field__label" htmlFor={`slider-${uid}`}>
                {label}
              </label>
            ) : (
              <span />
            )}
            {showValue && (
              <span
                className="hbd-slider-field__value-display"
                aria-live="polite"
                aria-atomic="true"
              >
                {displayValue}
              </span>
            )}
          </div>
        )}

        <div className="hbd-slider__track-container">
          <SliderPrimitive.Root
            ref={ref}
            id={`slider-${uid}`}
            className="hbd-slider"
            min={min}
            max={max}
            step={step}
            value={currentArray}
            onValueChange={handleValueChange}
            onValueCommit={handleValueCommit}
            disabled={disabled}
            name={name}
            aria-label={label || "Slider"}
            aria-describedby={describedBy}
            aria-invalid={hasError || undefined}
            {...props}
          >
            <SliderPrimitive.Track className="hbd-slider__track">
              <SliderPrimitive.Range className="hbd-slider__fill" />
            </SliderPrimitive.Track>
            {currentArray.map((_, i) => (
              <SliderPrimitive.Thumb
                key={i}
                className="hbd-slider__thumb"
                aria-label={
                  range
                    ? `${label || "Slider"} ${i === 0 ? "minimum" : "maximum"}`
                    : label || "Slider"
                }
                aria-describedby={describedBy}
                aria-invalid={hasError || undefined}
              />
            ))}
          </SliderPrimitive.Root>
        </div>

        {showTicks && (
          <div className="hbd-slider__ticks" aria-hidden="true">
            {ticks.map((t, i) => (
              <div className="hbd-slider__tick" key={i}>
                <span className="hbd-slider__tick-mark" />
                <span className="hbd-slider__tick-label">{t}</span>
              </div>
            ))}
          </div>
        )}

        {(hasHint || hasError) && (
          <div className="hbd-field__footer">
            {hasHint && (
              <span className="hbd-field__hint" id={`hint-${uid}`}>
                {hint}
              </span>
            )}
            {hasError && (
              <span className="hbd-field__error" id={`error-${uid}`} role="alert">
                {error}
              </span>
            )}
          </div>
        )}
      </div>
    );
  },
);
Slider.displayName = "Slider";

export { Slider, sliderFieldVariants };
