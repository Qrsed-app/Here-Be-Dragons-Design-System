"use client";

import * as React from "react";
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";
import { cn } from "@/lib/utils";

// Ported from ds/components/hbd-radio-group.js + the radio-group section of
// ds/styles/components/input.css. The legacy WC was a <fieldset>/<legend>
// radiogroup with a roving-tabindex keyboard model and per-option label/hint.
// Radix RadioGroup gives us the exact same a11y + keyboard behaviour
// (ArrowUp/Down/Left/Right move + select, roving tabindex, Home/End), so we
// re-apply the .hbd-* BEM classes to its parts for a 1:1 render.
//
// Controlled-first: value + onValueChange, with a defaultValue uncontrolled
// fallback. onValueChange receives the legacy `hbd:change` detail shape
// ({ value, name }) — matching the WC's CustomEvent.

let uidCounter = 0;
function useUid(prefix: string) {
  const ref = React.useRef<string | undefined>(undefined);
  if (!ref.current) ref.current = `${prefix}-${++uidCounter}`;
  return ref.current;
}

export interface RadioOption {
  value: string;
  label: React.ReactNode;
  hint?: React.ReactNode;
  disabled?: boolean;
}

export interface RadioGroupProps extends Omit<
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root>,
  "onValueChange" | "orientation"
> {
  /** Group legend / label. Rendered in a real <legend>. */
  label?: React.ReactNode;
  /** Non-error helper text below the options. */
  hint?: React.ReactNode;
  /** Error message. When present, the group enters the error state. */
  error?: React.ReactNode;
  /** Marks the group required (adds the * marker + aria-required). */
  required?: boolean;
  /** Layout direction of the option list. */
  orientation?: "vertical" | "horizontal";
  /** Declarative option list. Alternative to <RadioGroup.Item> children. */
  items?: RadioOption[];
  /** Fires with the legacy { value, name } detail on selection. */
  onValueChange?: (detail: { value: string; name?: string }) => void;
}

const RadioGroup = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Root>,
  RadioGroupProps
>(
  (
    {
      className,
      label,
      hint,
      error,
      required = false,
      disabled,
      orientation = "vertical",
      name,
      items,
      children,
      onValueChange,
      ...props
    },
    ref,
  ) => {
    const uid = useUid("hbd-radio-group");
    const hasError = error != null && error !== "";
    const hasHint = hint != null && hint !== "";

    const hintId = `hint-${uid}`;
    const errorId = `error-${uid}`;
    const legendId = `legend-${uid}`;
    const describedBy =
      [hasHint ? hintId : "", hasError ? errorId : ""].filter(Boolean).join(" ") || undefined;

    const handleValueChange = React.useCallback(
      (value: string) => onValueChange?.({ value, name }),
      [onValueChange, name],
    );

    return (
      <>
        {/* Real <fieldset>/<legend> for native group semantics, matching the WC. */}
        <fieldset
          className={cn(
            "hbd-radio-group",
            hasError && "hbd-radio-group--error hbd-field--error",
            className,
          )}
          disabled={disabled}
        >
          {label ? (
            <legend className="hbd-radio-group__legend" id={legendId}>
              {label}
              {required ? <span aria-hidden="true"> *</span> : null}
            </legend>
          ) : null}

          <RadioGroupPrimitive.Root
            ref={ref}
            className={cn(
              "hbd-radio-group__options",
              orientation === "horizontal" && "hbd-radio-group__options--horizontal",
            )}
            orientation={orientation}
            name={name}
            disabled={disabled}
            required={required}
            aria-labelledby={label ? legendId : undefined}
            aria-describedby={describedBy}
            aria-invalid={hasError || undefined}
            onValueChange={handleValueChange}
            {...props}
          >
            {items
              ? items.map((opt) => (
                  <RadioGroupItem
                    key={opt.value}
                    value={opt.value}
                    label={opt.label}
                    hint={opt.hint}
                    disabled={opt.disabled}
                  />
                ))
              : children}
          </RadioGroupPrimitive.Root>

          {hasHint ? (
            <span className="hbd-radio-group__hint hbd-field__hint" id={hintId}>
              {hint}
            </span>
          ) : null}
          {hasError ? (
            <span className="hbd-radio-group__error hbd-field__error" id={errorId} role="alert">
              {error}
            </span>
          ) : null}
        </fieldset>
      </>
    );
  },
);
RadioGroup.displayName = "RadioGroup";

export interface RadioGroupItemProps extends Omit<
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item>,
  "children"
> {
  /** Visible option label. */
  label?: React.ReactNode;
  /** Optional per-option helper text below the label. */
  hint?: React.ReactNode;
}

const RadioGroupItem = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Item>,
  RadioGroupItemProps
>(({ className, label, hint, disabled, id, ...props }, ref) => {
  const generatedId = React.useId();
  const inputId = id ?? generatedId;
  const hintId = `${inputId}-hint`;

  return (
    <label
      className={cn("hbd-radio", disabled && "hbd-radio--disabled", className)}
      htmlFor={inputId}
    >
      {/* The Radix Item is the focusable control AND the visual circle.
          Radix sets data-state="checked" on it, which the de-shadowed CSS
          targets directly (alongside the legacy .hbd-radio--checked class)
          so the checked look matches 1:1. */}
      <RadioGroupPrimitive.Item
        ref={ref}
        id={inputId}
        disabled={disabled}
        aria-describedby={hint ? hintId : undefined}
        className="hbd-radio__control"
        {...props}
      >
        {/* Inner dot is drawn by .hbd-radio__control::after; the Indicator
            simply gates its visibility via the parent's data-state. */}
        <RadioGroupPrimitive.Indicator />
      </RadioGroupPrimitive.Item>
      <span className="hbd-radio__label-wrap">
        {label != null ? <span className="hbd-radio__label">{label}</span> : null}
        {hint != null && hint !== "" ? (
          <span className="hbd-radio__hint" id={hintId}>
            {hint}
          </span>
        ) : null}
      </span>
    </label>
  );
});
RadioGroupItem.displayName = "RadioGroupItem";

// Compound API: <RadioGroup.Item> mirrors the legacy <hbd-radio> child, while
// the named export stays available for direct use / the items[] prop path.
const RadioGroupCompound = Object.assign(RadioGroup, { Item: RadioGroupItem });

export { RadioGroupCompound as RadioGroup, RadioGroupItem };
