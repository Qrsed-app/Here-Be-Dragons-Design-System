"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

// Ported from ds/components/hbd-stepper.js + the §2o "Numeric stepper" rules of
// ds/styles/components/input.css (shipped as stepper.css, .hbd-stepper* only).
//
// Numeric stepper: a native number input flanked by decrement (−) and
// increment (+) buttons, wrapped in the shared .hbd-field chrome (label + hint
// + error) that the @hbd/input dependency styles. Variants map to the legacy
// .hbd-field--{size}/state + .hbd-stepper* classes so the de-shadowed CSS
// reproduces the exact HBD look 1:1. Tailwind utilities are additive only.
//
// Keyboard model (mirrors the WC): the native <input type="number"> is the SOLE
// Tab stop. The two step buttons are tabIndex={-1} — clickable by mouse/touch,
// but keyboard users increment/decrement via the input's arrow keys (and
// PageUp/PageDown = ±10·step, Home = min, End = max handled in handleKeyDown).

// ── useControllableState (inline, controlled-first with uncontrolled fallback)
//
// The setter receives an optional `notify` flag so callers can distinguish a
// COMMIT (button / arrow key / blur -> fire onValueChange, the hbd:change
// analogue) from a raw display update during free typing (-> update the
// uncontrolled value silently; hbd:change must NOT fire mid-type, matching the
// WC where _onInput dispatches only hbd:input).
function useControllableState<T>({
  value,
  defaultValue,
  onChange,
}: {
  value?: T;
  defaultValue: T;
  onChange?: (value: T) => void;
}): [T, (next: T, notify?: boolean) => void] {
  const [uncontrolled, setUncontrolled] = React.useState<T>(defaultValue);
  const isControlled = value !== undefined;
  const state = isControlled ? (value as T) : uncontrolled;

  const setState = React.useCallback(
    (next: T, notify = true) => {
      if (!isControlled) setUncontrolled(next);
      if (notify) onChange?.(next);
    },
    [isControlled, onChange],
  );

  return [state, setState];
}

const fieldVariants = cva("hbd-field", {
  variants: {
    size: {
      sm: "hbd-field--sm",
      md: "hbd-field--md",
      lg: "hbd-field--lg",
    },
  },
  defaultVariants: { size: "md" },
});

// detail payload shape carried by the legacy hbd:input / hbd:change events.
export interface StepperChangeDetail {
  value: string;
  name: string | null;
}

export interface StepperProps
  extends
    Omit<React.HTMLAttributes<HTMLDivElement>, "onChange" | "onInput" | "defaultValue">,
    VariantProps<typeof fieldVariants> {
  /** Controlled value (string, mirroring the WC's string-typed value). */
  value?: string;
  /** Uncontrolled initial value (defaults to "0"). */
  defaultValue?: string;
  /** Lower bound; omit for an open lower range. */
  min?: number;
  /** Upper bound; omit for an open upper range. */
  max?: number;
  /** Step increment (must be > 0; falls back to 1). */
  step?: number;
  /** Visible field label, associated with the input via for/id. */
  label?: string;
  /** Helper text shown below the input (hidden when an error shows). */
  hint?: string;
  /** Error message — sets aria-invalid + the error state when non-empty. */
  error?: string;
  /** Marks the field required (adds the * + aria-required). */
  required?: boolean;
  /** Disables the input and both step buttons. */
  disabled?: boolean;
  /** Form field name. */
  name?: string;
  /** Fired on commit (button/key/blur) with the {value, name} detail (hbd:change). */
  onValueChange?: (value: string) => void;
  /** Fired on every keystroke with the {value, name} detail (hbd:change). */
  onChange?: (detail: StepperChangeDetail) => void;
  /** Fired on every raw keystroke with the {value, name} detail (hbd:input). */
  onInput?: (detail: StepperChangeDetail) => void;
}

let uidCounter = 0;

// Decimal precision of the step value — used to round results and avoid float
// drift like 0.1 + 0.2 = 0.30000000000000004.
function decimalPlaces(n: number): number {
  const s = String(n);
  const i = s.indexOf(".");
  return i === -1 ? 0 : s.length - i - 1;
}

const Stepper = React.forwardRef<HTMLInputElement, StepperProps>(
  (
    {
      className,
      size,
      value: valueProp,
      defaultValue,
      min,
      max,
      step: stepProp,
      label,
      hint,
      error,
      required = false,
      disabled = false,
      name,
      id: idProp,
      onValueChange,
      onChange,
      onInput,
      ...props
    },
    ref,
  ) => {
    // Stable per-instance uid (mirrors the WC's `hbd-stepper-N` ids).
    const uid = React.useMemo(() => `hbd-stepper-${++uidCounter}`, []);
    const fieldId = idProp ?? uid;

    const [value, setValue] = useControllableState<string>({
      value: valueProp,
      defaultValue: defaultValue ?? "0",
      onChange: onValueChange,
    });

    const inputRef = React.useRef<HTMLInputElement>(null);
    React.useImperativeHandle(ref, () => inputRef.current as HTMLInputElement);

    // ── Normalised numeric helpers (mirror the WC getters) ──────────────
    const stepValue =
      typeof stepProp === "number" && Number.isFinite(stepProp) && stepProp > 0 ? stepProp : 1;
    const minValue = typeof min === "number" && Number.isFinite(min) ? min : null;
    const maxValue = typeof max === "number" && Number.isFinite(max) ? max : null;

    const hasError = error != null && error !== "";
    const hasHint = hint != null && hint !== "";

    const describedBy = [hasHint ? `hint-${uid}` : "", hasError ? `error-${uid}` : ""]
      .filter(Boolean)
      .join(" ");

    const ariaLabelDec = `Decrease ${label || "value"}`;
    const ariaLabelInc = `Increase ${label || "value"}`;

    // Commit a numeric value: round to step precision, clamp already applied by
    // callers, then fire hbd:change. Mirrors the WC's _setValue.
    const commitValue = React.useCallback(
      (n: number) => {
        const dp = decimalPlaces(stepValue);
        const rounded = parseFloat(n.toFixed(dp));
        const str = String(rounded);
        setValue(str);
        onChange?.({ value: str, name: name ?? null });
      },
      [stepValue, setValue, onChange, name],
    );

    const increment = React.useCallback(
      (multiplier = 1) => {
        const current = parseFloat(inputRef.current?.value ?? value);
        const base = Number.isFinite(current) ? current : (minValue ?? 0);
        let next = base + stepValue * multiplier;
        if (maxValue !== null && next > maxValue) next = maxValue;
        commitValue(next);
      },
      [value, minValue, maxValue, stepValue, commitValue],
    );

    const decrement = React.useCallback(
      (multiplier = 1) => {
        const current = parseFloat(inputRef.current?.value ?? value);
        const base = Number.isFinite(current) ? current : (maxValue ?? 0);
        let next = base - stepValue * multiplier;
        if (minValue !== null && next < minValue) next = minValue;
        commitValue(next);
      },
      [value, minValue, maxValue, stepValue, commitValue],
    );

    // Boundary disabling — mirrors the WC's _updateBoundaries.
    const val = parseFloat(value);
    const atMin = disabled || (Number.isFinite(val) && minValue !== null && val <= minValue);
    const atMax = disabled || (Number.isFinite(val) && maxValue !== null && val >= maxValue);

    // ── Handlers ────────────────────────────────────────────────────────
    const handleIncrement = () => {
      if (disabled) return;
      increment();
      inputRef.current?.focus();
    };
    const handleDecrement = () => {
      if (disabled) return;
      decrement();
      inputRef.current?.focus();
    };

    // Free typing — sync the in-flight raw value + fire hbd:input, no clamping
    // (clamping mid-type would block valid intermediates like "-" or ".5").
    const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
      const next = e.target.value;
      // notify=false: update the displayed value WITHOUT firing onValueChange —
      // the WC's _onInput dispatches hbd:input only, never hbd:change mid-type.
      setValue(next, false);
      onInput?.({ value: next, name: name ?? null });
    };

    // On blur: parse, revert to last valid if NaN, else clamp + round to step.
    const handleBlur = () => {
      const raw = inputRef.current?.value ?? "";
      const parsed = parseFloat(raw);
      if (!Number.isFinite(parsed)) {
        if (inputRef.current) inputRef.current.value = value;
        return;
      }
      let next = parsed;
      if (minValue !== null && next < minValue) next = minValue;
      if (maxValue !== null && next > maxValue) next = maxValue;
      commitValue(next);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (disabled) return;
      switch (e.key) {
        case "ArrowUp":
          e.preventDefault();
          increment();
          return;
        case "ArrowDown":
          e.preventDefault();
          decrement();
          return;
        case "PageUp":
          e.preventDefault();
          increment(10);
          return;
        case "PageDown":
          e.preventDefault();
          decrement(10);
          return;
        case "Home":
          if (minValue !== null) {
            e.preventDefault();
            commitValue(minValue);
          }
          return;
        case "End":
          if (maxValue !== null) {
            e.preventDefault();
            commitValue(maxValue);
          }
          return;
        default:
          return;
      }
    };

    return (
      <div
        className={cn(
          fieldVariants({ size }),
          hasError && "hbd-field--error",
          disabled && "hbd-field--disabled",
          className,
        )}
        {...props}
      >
        {label ? (
          <label className="hbd-field__label" htmlFor={fieldId} id={`label-${uid}`}>
            {label}
            {required ? (
              <span className="hbd-field__label-required" aria-hidden="true">
                *
              </span>
            ) : null}
          </label>
        ) : null}

        <div className="hbd-field__input-wrapper">
          <div
            className="hbd-stepper"
            role="group"
            aria-labelledby={label ? `label-${uid}` : undefined}
          >
            <button
              type="button"
              className={cn(
                "hbd-stepper__button hbd-stepper__button--decrement",
                atMin && "is-disabled",
              )}
              aria-label={ariaLabelDec}
              tabIndex={-1}
              disabled={atMin}
              onClick={handleDecrement}
            >
              {"−"}
            </button>

            <input
              ref={inputRef}
              className="hbd-stepper__input"
              id={fieldId}
              type="number"
              value={value}
              min={minValue !== null ? minValue : undefined}
              max={maxValue !== null ? maxValue : undefined}
              step={stepValue}
              name={name}
              aria-describedby={describedBy || undefined}
              aria-required={required || undefined}
              required={required}
              aria-invalid={hasError || undefined}
              disabled={disabled}
              onChange={handleInput}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
            />

            <button
              type="button"
              className={cn(
                "hbd-stepper__button hbd-stepper__button--increment",
                atMax && "is-disabled",
              )}
              aria-label={ariaLabelInc}
              tabIndex={-1}
              disabled={atMax}
              onClick={handleIncrement}
            >
              +
            </button>
          </div>
        </div>

        <div className="hbd-field__footer">
          {hasHint ? (
            <span className="hbd-field__hint" id={`hint-${uid}`}>
              {hint}
            </span>
          ) : null}
          {hasError ? (
            <span className="hbd-field__error" id={`error-${uid}`} role="alert">
              {error}
            </span>
          ) : null}
        </div>
      </div>
    );
  },
);
Stepper.displayName = "Stepper";

export { Stepper, fieldVariants };
