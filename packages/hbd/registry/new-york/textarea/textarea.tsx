"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

// Ported from ds/components/hbd-textarea.js (+ the .hbd-field chrome from
// @hbd/input's input.css; the textarea-specific delta ships in textarea.css).
//
// The legacy <hbd-textarea> wraps a native <textarea> in the shared .hbd-field
// structure: label + input-wrapper + footer (hint/error/success + char-count).
// This React port emits those exact BEM classes (via cn()) so the de-shadowed
// CSS reproduces the HBD look 1:1. It is CONTROLLED-FIRST: pass value +
// onValueChange, or omit them and rely on defaultValue (uncontrolled) via the
// inline useControllableState helper. hbd:input / hbd:change CustomEvents map to
// onInput / onChange callbacks receiving the event.detail shape { value, name }.

type TextareaSize = "sm" | "md" | "lg";

interface TextareaDetail {
  value: string;
  name: string | null;
}

export interface TextareaProps extends Omit<
  React.TextareaHTMLAttributes<HTMLTextAreaElement>,
  "size" | "onInput" | "onChange" | "value" | "defaultValue"
> {
  /** Visible field label (rendered as a <label> wired to the textarea). */
  label?: string;
  /** Helper text shown in the footer when there is no error/success. */
  hint?: string;
  /** Error message — sets the error look + aria-invalid + role="alert". */
  error?: string;
  /** Success message — sets the success look + role="status". */
  success?: string;
  /** Field size. */
  size?: TextareaSize;
  /** Number of visible text rows. */
  rows?: number;
  /** Grow the textarea to fit its content (height set inline from scrollHeight). */
  autoresize?: boolean;
  /** Controlled value. */
  value?: string;
  /** Uncontrolled initial value. */
  defaultValue?: string;
  /** Fired on every keystroke with the new value. */
  onValueChange?: (value: string) => void;
  /** hbd:input — fired on every keystroke with { value, name }. */
  onInput?: (detail: TextareaDetail) => void;
  /** hbd:change — fired on blur/commit with { value, name }. */
  onChange?: (detail: TextareaDetail) => void;
}

// ── Inline controllable-state helper (controlled-first with uncontrolled
//    fallback) — mirrors the shadcn useControllableState pattern. ───────────
function useControllableState<T>({
  prop,
  defaultProp,
  onChange,
}: {
  prop?: T;
  defaultProp?: T;
  onChange?: (value: T) => void;
}): [T, (next: T) => void] {
  const [uncontrolled, setUncontrolled] = React.useState<T | undefined>(defaultProp);
  const isControlled = prop !== undefined;
  const value = (isControlled ? prop : uncontrolled) as T;

  const setValue = React.useCallback(
    (next: T) => {
      if (!isControlled) setUncontrolled(next);
      onChange?.(next);
    },
    [isControlled, onChange],
  );

  return [value, setValue];
}

let uidCounter = 0;

function countClass(len: number, max: number | undefined): string {
  if (!max) return "";
  if (len >= max) return "hbd-field__char-count--over";
  if (len >= max * 0.8) return "hbd-field__char-count--warning";
  return "";
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      className,
      label,
      hint,
      error,
      success,
      size = "md",
      rows = 4,
      autoresize = false,
      name,
      placeholder,
      required = false,
      disabled = false,
      readOnly = false,
      maxLength,
      value: valueProp,
      defaultValue,
      onValueChange,
      onInput,
      onChange,
      ...props
    },
    forwardedRef,
  ) => {
    const uid = React.useMemo(() => `hbd-textarea-${++uidCounter}`, []);

    const [value, setValue] = useControllableState<string>({
      prop: valueProp,
      defaultProp: defaultValue ?? "",
      onChange: onValueChange,
    });

    // Merge the forwarded ref with our local ref (needed for auto-resize).
    const innerRef = React.useRef<HTMLTextAreaElement | null>(null);
    const setRefs = React.useCallback(
      (node: HTMLTextAreaElement | null) => {
        innerRef.current = node;
        if (typeof forwardedRef === "function") forwardedRef(node);
        else if (forwardedRef) forwardedRef.current = node;
      },
      [forwardedRef],
    );

    const hasError = error != null && error !== "";
    const hasSuccess = !hasError && success != null && success !== "";
    const hasHint = hint != null && hint !== "";
    const hasFooter = hasHint || hasError || hasSuccess || maxLength != null;

    // aria-describedby from only the non-empty footer message ids.
    const describedBy =
      [
        hasHint ? `hint-${uid}` : "",
        hasError ? `error-${uid}` : "",
        hasSuccess ? `success-${uid}` : "",
        maxLength != null ? `count-${uid}` : "",
      ]
        .filter(Boolean)
        .join(" ") || undefined;

    const currentLen = value.length;

    // Auto-resize: the ONE documented dynamic inline-style exception — a
    // textarea has no intrinsic content-height in flow layout, so JS measures
    // scrollHeight and writes it to style.height. Reset to 'auto' first so the
    // measurement reflects the new content rather than the previous size.
    React.useLayoutEffect(() => {
      if (!autoresize) return;
      const t = innerRef.current;
      if (!t) return;
      t.style.height = "auto";
      t.style.height = `${t.scrollHeight}px`;
    }, [autoresize, value, rows]);

    const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const next = e.target.value;
      setValue(next);
      onInput?.({ value: next, name: name ?? null });
    };

    const handleBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
      onChange?.({ value: e.target.value, name: name ?? null });
      props.onBlur?.(e);
    };

    return (
      <div
        className={cn(
          "hbd-field",
          `hbd-field--${size}`,
          hasError && "hbd-field--error",
          hasSuccess && "hbd-field--success",
          disabled && "hbd-field--disabled",
          readOnly && "hbd-field--readonly",
          autoresize && "hbd-field--autoresize",
          className,
        )}
      >
        {label ? (
          <label className="hbd-field__label" htmlFor={uid}>
            {label}
            {required ? (
              <span className="hbd-field__label-required" aria-hidden="true">
                *
              </span>
            ) : null}
          </label>
        ) : null}

        <div className="hbd-field__input-wrapper">
          <textarea
            ref={setRefs}
            className="hbd-field__textarea"
            id={uid}
            name={name}
            placeholder={placeholder}
            rows={rows}
            value={value}
            aria-describedby={describedBy}
            aria-required={required || undefined}
            required={required}
            aria-invalid={hasError || undefined}
            disabled={disabled}
            readOnly={readOnly}
            maxLength={maxLength}
            onChange={handleInput}
            {...props}
            onBlur={handleBlur}
          />
        </div>

        {hasFooter ? (
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
            {hasSuccess ? (
              <span className="hbd-field__success" id={`success-${uid}`} role="status">
                {success}
              </span>
            ) : null}
            {maxLength != null ? (
              <span
                className={cn("hbd-field__char-count", countClass(currentLen, maxLength))}
                id={`count-${uid}`}
                aria-live="polite"
                aria-atomic="true"
              >
                {currentLen}/{maxLength}
              </span>
            ) : null}
          </div>
        ) : null}
      </div>
    );
  },
);
Textarea.displayName = "Textarea";

export { Textarea };
