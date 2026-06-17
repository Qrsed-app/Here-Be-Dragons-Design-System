"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

// Ported from ds/components/hbd-switch.js + the §2m Switch block of
// ds/styles/components/input.css (label/hint from checkbox.css, error from
// input.css), flattened into ./styles/components/switch.css.
//
// Hand-ported (not Radix): the de-shadowed CSS relies on the legacy markup —
// a visually-hidden native <input role="switch"> immediately followed by the
// presentational track/thumb (`.hbd-switch__input:focus-visible + .hbd-switch__track`).
// Keeping that exact structure makes the token-backed CSS render 1:1 while the
// native input preserves keyboard activation (Space toggles) and form value.
//
// Controlled-first: `checked` + `onCheckedChange`, with `defaultChecked`
// uncontrolled fallback via the inline useControllableState helper below.

// ── useControllableState ──────────────────────────────────────────────
// Small controlled/uncontrolled hook (defined inline per port conventions).
function useControllableState<T>({
  prop,
  defaultProp,
  onChange,
}: {
  prop?: T;
  defaultProp?: T;
  onChange?: (value: T) => void;
}): [T | undefined, (next: T) => void] {
  const [uncontrolled, setUncontrolled] = React.useState<T | undefined>(defaultProp);
  const isControlled = prop !== undefined;
  const value = isControlled ? prop : uncontrolled;

  const setValue = React.useCallback(
    (next: T) => {
      if (!isControlled) setUncontrolled(next);
      onChange?.(next);
    },
    [isControlled, onChange],
  );

  return [value, setValue];
}

const switchVariants = cva("hbd-switch", {
  variants: {
    size: {
      sm: "hbd-switch--sm",
      md: "",
      lg: "hbd-switch--lg",
    },
    labelPosition: {
      left: "hbd-switch--label-left",
      right: "",
    },
  },
  defaultVariants: { size: "md", labelPosition: "right" },
});

let switchUid = 0;

export interface SwitchChangeDetail {
  checked: boolean;
  value: string;
}

export interface SwitchProps
  extends
    Omit<
      React.InputHTMLAttributes<HTMLInputElement>,
      "size" | "onChange" | "defaultChecked" | "checked"
    >,
    VariantProps<typeof switchVariants> {
  /** Controlled on/off state. */
  checked?: boolean;
  /** Uncontrolled initial state. */
  defaultChecked?: boolean;
  /** Fires with the new state (mirrors the WC `hbd:change` event detail). */
  onCheckedChange?: (checked: boolean, detail: SwitchChangeDetail) => void;
  disabled?: boolean;
  /** Visible label rendered next to the track. */
  label?: React.ReactNode;
  /** Helper text under the label. */
  hint?: React.ReactNode;
  /** Error message; sets the error state + aria-invalid when present. */
  error?: React.ReactNode;
  /** Form value submitted when checked (default "on"). */
  value?: string;
  name?: string;
}

const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
  (
    {
      className,
      size,
      labelPosition,
      checked,
      defaultChecked,
      onCheckedChange,
      disabled = false,
      label,
      hint,
      error,
      value = "on",
      name,
      id,
      "aria-label": ariaLabel,
      ...props
    },
    ref,
  ) => {
    const [isChecked = false, setChecked] = useControllableState<boolean>({
      prop: checked,
      defaultProp: defaultChecked,
      onChange: undefined,
    });

    const uid = React.useMemo(() => `hbd-switch-${++switchUid}`, []);
    const hintId = `hint-${uid}`;
    const errorId = `error-${uid}`;
    const hasError = error != null && error !== "";
    const hasVisibleLabel = label != null && label !== "";

    const describedBy =
      [hint ? hintId : "", hasError ? errorId : ""].filter(Boolean).join(" ") || undefined;

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const next = event.target.checked;
      setChecked(next);
      onCheckedChange?.(next, { checked: next, value });
    };

    return (
      <>
        <label
          className={cn(
            switchVariants({ size, labelPosition }),
            isChecked && "hbd-switch--checked",
            disabled && "hbd-switch--disabled",
            hasError && "hbd-switch--error hbd-field--error",
            className,
          )}
        >
          <input
            ref={ref}
            id={id}
            className="hbd-switch__input"
            type="checkbox"
            role="switch"
            name={name}
            value={value}
            checked={isChecked}
            disabled={disabled}
            aria-checked={isChecked}
            aria-label={!hasVisibleLabel ? ariaLabel : undefined}
            aria-describedby={describedBy}
            aria-invalid={hasError || undefined}
            onChange={handleChange}
            {...props}
          />
          <span className="hbd-switch__track" aria-hidden="true">
            <span className="hbd-switch__thumb" />
          </span>
          {hasVisibleLabel ? (
            <span className="hbd-switch__label-text">
              <span className="hbd-switch__label">{label}</span>
              {hint ? (
                <span className="hbd-switch__hint" id={hintId}>
                  {hint}
                </span>
              ) : null}
            </span>
          ) : null}
        </label>
        {hasError ? (
          <span className="hbd-switch__error hbd-field__error" id={errorId} role="alert">
            {error}
          </span>
        ) : null}
      </>
    );
  },
);
Switch.displayName = "Switch";

export { Switch, switchVariants };
