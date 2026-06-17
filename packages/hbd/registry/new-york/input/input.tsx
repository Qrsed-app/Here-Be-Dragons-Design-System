"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

// Ported from ds/components/hbd-input.js + ds/styles/components/input.css.
// This is the canonical HBD form field: it owns the shared .hbd-field chrome
// (label + input + hint/error/success + char-count + prefix/suffix + password
// eye toggle) that later fields (textarea, otp-input, select trigger, stepper,
// combobox) reuse. Variants map to the legacy .hbd-field--{size}/state classes
// so the de-shadowed input.css reproduces the exact HBD look 1:1. Tailwind
// utilities are additive only — the token-backed component CSS is the styling.

// ── useControllableState (inline, controlled-first with uncontrolled fallback)
function useControllableState<T>({
  value,
  defaultValue,
  onChange,
}: {
  value?: T;
  defaultValue: T;
  onChange?: (value: T) => void;
}): [T, (next: T) => void] {
  const [uncontrolled, setUncontrolled] = React.useState<T>(defaultValue);
  const isControlled = value !== undefined;
  const state = isControlled ? (value as T) : uncontrolled;

  const setState = React.useCallback(
    (next: T) => {
      if (!isControlled) setUncontrolled(next);
      onChange?.(next);
    },
    [isControlled, onChange],
  );

  return [state, setState];
}

// Mirrors the WC's ALLOWED_TYPES allow-list; anything else falls back to text.
const ALLOWED_TYPES = new Set(["text", "email", "password", "search", "tel", "url", "number"]);

export type InputType = "text" | "email" | "password" | "search" | "tel" | "url" | "number";

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
export interface InputChangeDetail {
  value: string;
  name: string | null;
}

export interface InputProps
  extends
    Omit<
      React.InputHTMLAttributes<HTMLInputElement>,
      "size" | "type" | "value" | "defaultValue" | "onChange" | "onInput" | "prefix"
    >,
    VariantProps<typeof fieldVariants> {
  /** Input type — restricted to the HBD allow-list (others fall back to text). */
  type?: InputType;
  /** Controlled value. */
  value?: string;
  /** Uncontrolled initial value. */
  defaultValue?: string;
  /** Visible field label, associated with the input via for/id. */
  label?: string;
  /** Helper text shown below the input (hidden when an error/success shows). */
  hint?: string;
  /** Error message — sets aria-invalid + the error state when non-empty. */
  error?: string;
  /** Success message — shown when no error is present. */
  success?: string;
  /** Static text rendered inside the field's leading edge. */
  prefix?: string;
  /** Static text rendered inside the field's trailing edge (ignored for password). */
  suffix?: string;
  /** Maximum length; also drives the live character counter. */
  maxLength?: number;
  /** Fired on every keystroke with the {value, name} detail (hbd:input). */
  onValueChange?: (value: string) => void;
  /** Lower-level input event carrying the full detail (hbd:input). */
  onInput?: (detail: InputChangeDetail) => void;
  /** Fired on commit (blur/Enter) with the {value, name} detail (hbd:change). */
  onChange?: (detail: InputChangeDetail) => void;
}

let uidCounter = 0;

const EyeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
    <path
      d="M1 9s3-5.5 8-5.5S17 9 17 9s-3 5.5-8 5.5S1 9 1 9Z"
      stroke="currentColor"
      strokeWidth="1.3"
    />
    <circle cx="9" cy="9" r="2.25" stroke="currentColor" strokeWidth="1.3" />
  </svg>
);

const EyeOffIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
    <path
      d="M1 9s3-5.5 8-5.5c1.2 0 2.3.32 3.3.82M17 9s-3 5.5-8 5.5c-1.2 0-2.3-.32-3.3-.82"
      stroke="currentColor"
      strokeWidth="1.3"
    />
    <path d="M3 15 15 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
  </svg>
);

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      size,
      type = "text",
      value: valueProp,
      defaultValue,
      name,
      placeholder,
      label,
      hint,
      error,
      success,
      prefix,
      suffix,
      required = false,
      disabled = false,
      readOnly = false,
      maxLength,
      id: idProp,
      onValueChange,
      onInput,
      onChange,
      onBlur,
      onKeyDown,
      "aria-describedby": ariaDescribedBy,
      ...props
    },
    ref,
  ) => {
    const reactId = React.useId();
    // Stable per-instance uid (mirrors the WC's `hbd-input-N` ids).
    const uid = React.useMemo(() => `hbd-input-${++uidCounter}`, []);
    const fieldId = idProp ?? uid;

    const [value, setValue] = useControllableState<string>({
      value: valueProp,
      defaultValue: defaultValue ?? "",
      onChange: onValueChange,
    });

    const [passwordVisible, setPasswordVisible] = React.useState(false);

    const resolvedType: InputType = ALLOWED_TYPES.has(type) ? type : "text";
    const isPassword = resolvedType === "password";
    const inputType = isPassword && passwordVisible ? "text" : resolvedType;

    const hasError = error != null && error !== "";
    const hasSuccess = !hasError && success != null && success !== "";
    const hasHint = hint != null && hint !== "";
    const hasPrefix = prefix != null && prefix !== "";
    // Password toggle always occupies the suffix slot, ignoring `suffix`.
    const hasSuffix = !isPassword && suffix != null && suffix !== "";

    // aria-describedby: only ids of elements that will actually have content.
    const describedBy = [
      ariaDescribedBy || "",
      hasHint ? `hint-${reactId}` : "",
      hasError ? `error-${reactId}` : "",
      hasSuccess ? `success-${reactId}` : "",
      maxLength != null ? `count-${reactId}` : "",
    ]
      .filter(Boolean)
      .join(" ");

    const currentLen = value.length;
    const atLimit = maxLength != null && currentLen >= maxLength;

    const inputRef = React.useRef<HTMLInputElement>(null);
    React.useImperativeHandle(ref, () => inputRef.current as HTMLInputElement);

    const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
      const next = e.target.value;
      setValue(next);
      onInput?.({ value: next, name: name ?? null });
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const next = e.target.value;
      // React's onChange fires per-keystroke; the WC's hbd:change is commit
      // (blur/Enter), so map our hbd:change callback onto onBlur below and
      // keep the React change for value sync only.
      setValue(next);
    };

    const handleCommit = (
      e: React.FocusEvent<HTMLInputElement> | React.KeyboardEvent<HTMLInputElement>,
    ) => {
      const next = (e.target as HTMLInputElement).value;
      onChange?.({ value: next, name: name ?? null });
    };

    const handleToggle = () => {
      if (disabled) return;
      setPasswordVisible((v) => !v);
      // Preserve caret at the end after the type swap (mirrors the WC).
      requestAnimationFrame(() => {
        const el = inputRef.current;
        if (el) {
          el.focus();
          const end = el.value.length;
          el.setSelectionRange(end, end);
        }
      });
    };

    return (
      <div
        className={cn(
          fieldVariants({ size }),
          hasError && "hbd-field--error",
          hasSuccess && "hbd-field--success",
          disabled && "hbd-field--disabled",
          readOnly && "hbd-field--readonly",
          hasPrefix && "hbd-field--with-prefix",
          hasSuffix && "hbd-field--with-suffix",
          isPassword && "hbd-field--with-toggle",
          className,
        )}
      >
        {label ? (
          <label className="hbd-field__label" htmlFor={fieldId}>
            {label}
            {required ? (
              <span className="hbd-field__label-required" aria-hidden="true">
                *
              </span>
            ) : null}
          </label>
        ) : null}

        <div className="hbd-field__input-wrapper">
          {hasPrefix ? (
            <span className="hbd-field__prefix" aria-hidden="true">
              {prefix}
            </span>
          ) : null}

          <input
            ref={inputRef}
            className="hbd-field__input"
            id={fieldId}
            type={inputType}
            name={name}
            value={value}
            placeholder={placeholder}
            aria-describedby={describedBy || undefined}
            aria-required={required || undefined}
            required={required}
            aria-invalid={hasError || undefined}
            disabled={disabled}
            readOnly={readOnly}
            maxLength={maxLength}
            onChange={(e) => {
              handleChange(e);
              handleInput(e);
            }}
            onBlur={(e) => {
              handleCommit(e);
              onBlur?.(e);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleCommit(e);
              onKeyDown?.(e);
            }}
            {...props}
          />

          {hasSuffix ? (
            <span className="hbd-field__suffix" aria-hidden="true">
              {suffix}
            </span>
          ) : null}

          {isPassword ? (
            <button
              type="button"
              className="hbd-field__toggle"
              aria-label={passwordVisible ? "Hide password" : "Show password"}
              disabled={disabled}
              onClick={handleToggle}
            >
              {passwordVisible ? <EyeOffIcon /> : <EyeIcon />}
            </button>
          ) : null}
        </div>

        {hasHint ? (
          <span className="hbd-field__hint" id={`hint-${reactId}`}>
            {hint}
          </span>
        ) : null}
        {hasError ? (
          <span className="hbd-field__error" id={`error-${reactId}`} role="alert">
            {error}
          </span>
        ) : null}
        {hasSuccess ? (
          <span className="hbd-field__success" id={`success-${reactId}`} role="status">
            {success}
          </span>
        ) : null}
        {maxLength != null ? (
          <span
            className={cn("hbd-field__char-count", atLimit && "is-at-limit")}
            id={`count-${reactId}`}
            aria-live="polite"
          >
            {currentLen}/{maxLength}
          </span>
        ) : null}
      </div>
    );
  },
);
Input.displayName = "Input";

export { Input, fieldVariants };
