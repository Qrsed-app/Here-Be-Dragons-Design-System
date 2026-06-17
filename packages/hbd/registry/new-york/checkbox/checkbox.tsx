"use client";

import * as React from "react";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

// Ported from ds/components/hbd-checkbox.js + ds/styles/components/checkbox.css.
// Self-contained control: a native <input type="checkbox"> visually hidden via
// the clip technique, with a CSS-drawn .hbd-checkbox__control box (brutalist
// offset shadow from --hbd-checkbox-shadow*). The React markup re-emits the
// EXACT legacy .hbd-checkbox markup/classes so the de-shadowed checkbox.css
// reproduces the HBD look 1:1. Tailwind utilities are NOT used for the visual
// design — the token-backed component CSS is.
//
// Controlled-first: `checked` + `onCheckedChange`, with `defaultChecked`
// uncontrolled fallback (useControllableState pattern, defined inline below).
// `indeterminate` cannot be expressed in HTML so it is applied to the input
// via a ref effect (input.indeterminate = ...), mirroring the WC's _sync().

// ── useControllableState (inline, no external dep) ──────────────────────
function useControllableState<T>({
  value,
  defaultValue,
  onChange,
}: {
  value: T | undefined;
  defaultValue: T;
  onChange?: (next: T) => void;
}): [T, (next: T) => void] {
  const isControlled = value !== undefined;
  const [uncontrolled, setUncontrolled] = React.useState<T>(defaultValue);
  const current = isControlled ? (value as T) : uncontrolled;

  const setValue = React.useCallback(
    (next: T) => {
      if (!isControlled) setUncontrolled(next);
      onChange?.(next);
    },
    [isControlled, onChange],
  );

  return [current, setValue];
}

const checkboxVariants = cva("hbd-checkbox", {
  variants: {
    checked: { true: "hbd-checkbox--checked", false: "" },
    indeterminate: { true: "hbd-checkbox--indeterminate", false: "" },
    disabled: { true: "hbd-checkbox--disabled", false: "" },
    error: { true: "hbd-checkbox--error hbd-field--error", false: "" },
  },
  defaultVariants: {
    checked: false,
    indeterminate: false,
    disabled: false,
    error: false,
  },
});

export interface CheckboxChangeDetail {
  checked: boolean;
  value: string | undefined;
}

export interface CheckboxProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "checked" | "defaultChecked" | "onChange" | "type" | "value"
> {
  /** Controlled checked state. Pair with onCheckedChange. */
  checked?: boolean;
  /** Uncontrolled initial checked state. */
  defaultChecked?: boolean;
  /** Mixed/partial state — drives .hbd-checkbox--indeterminate + input.indeterminate. */
  indeterminate?: boolean;
  /** Fired on toggle with the WC's hbd:change detail shape. */
  onCheckedChange?: (detail: CheckboxChangeDetail) => void;
  /** Submitted value when checked (defaults to "on"). */
  value?: string;
  /** Error message — renders the .hbd-checkbox__error alert + error visuals. */
  error?: string;
  /** Helper text rendered in the .hbd-checkbox__hint span. */
  hint?: React.ReactNode;
  /** Visible label content (default slot). */
  children?: React.ReactNode;
  /** Extra class on the root <label>. */
  className?: string;
}

let uidCounter = 0;

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  (
    {
      className,
      checked,
      defaultChecked = false,
      indeterminate = false,
      onCheckedChange,
      value,
      error,
      hint,
      disabled = false,
      required = false,
      name,
      children,
      id,
      ...props
    },
    forwardedRef,
  ) => {
    const reactId = React.useId();
    const uid = React.useMemo(() => `hbd-checkbox-${++uidCounter}`, []);
    const hintId = `hint-${uid}`;
    const errorId = `error-${uid}`;

    const hasError = error != null && error !== "";

    const [isChecked, setChecked] = useControllableState<boolean>({
      value: checked,
      defaultValue: defaultChecked,
      onChange: (next) => onCheckedChange?.({ checked: next, value }),
    });

    // Merge forwarded ref with our internal ref so we can drive `indeterminate`.
    const innerRef = React.useRef<HTMLInputElement>(null);
    React.useImperativeHandle(forwardedRef, () => innerRef.current as HTMLInputElement);

    // indeterminate cannot be set via HTML; apply the JS property (WC _sync()).
    React.useEffect(() => {
      if (innerRef.current) innerRef.current.indeterminate = indeterminate;
    }, [indeterminate, isChecked]);

    // aria-describedby: hint span is the stable anchor (exists even when empty),
    // plus the error span when present — matches the WC verbatim.
    const describedBy = [hintId, hasError ? errorId : ""].filter(Boolean).join(" ");

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      // A real toggle clears any indeterminate state (WC _handleChange()).
      if (innerRef.current) innerRef.current.indeterminate = false;
      setChecked(e.target.checked);
    };

    // Mirrors the WC shadow tree exactly: the <label.hbd-checkbox> wraps only
    // the input + control + label spans; the hint + error spans are siblings
    // that follow the label (Fragment stands in for the shadow root).
    return (
      <>
        <label
          className={cn(
            checkboxVariants({
              checked: isChecked,
              indeterminate,
              disabled,
              error: hasError,
            }),
            className,
          )}
        >
          <input
            ref={innerRef}
            id={id ?? reactId}
            className="hbd-checkbox__input"
            type="checkbox"
            name={name}
            value={value}
            checked={isChecked}
            disabled={disabled}
            required={required}
            aria-describedby={describedBy}
            aria-invalid={hasError ? true : undefined}
            aria-required={required ? true : undefined}
            onChange={handleChange}
            {...props}
          />
          <span className="hbd-checkbox__control" aria-hidden="true" />
          <span className="hbd-checkbox__label">{children}</span>
        </label>
        <span className="hbd-checkbox__hint" id={hintId}>
          {hint}
        </span>
        <span className="hbd-checkbox__error hbd-field__error" id={errorId} role="alert">
          {error || ""}
        </span>
      </>
    );
  },
);
Checkbox.displayName = "Checkbox";

export { Checkbox, checkboxVariants };
