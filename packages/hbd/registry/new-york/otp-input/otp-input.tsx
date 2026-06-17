"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

// Ported from ds/components/hbd-otp-input.js + the §2q OTP rules of
// ds/styles/components/input.css (de-shadowed into styles/components/otp-input.css).
//
// One-time password / verification code input: a row of single-character
// cells that auto-advance on entry, accept paste from the clipboard
// (splitting across cells), and support arrow + backspace navigation.
// 4 or 6 digit lengths; numeric or alphanumeric.
//
// Reuses the shared .hbd-field label / hint / error / footer chrome from
// @hbd/input, so the de-shadowed otp-input.css only carries the OTP-specific
// rules. The multi-cell focus/paste/backspace machine is hand-ported verbatim
// from hbd-otp-input.js. Controlled-first: value + onValueChange + onComplete.

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

export type OtpType = "numeric" | "alphanumeric";
export type OtpLength = 4 | 6;

export interface OtpInputProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "onChange" | "defaultValue"
> {
  /** Number of cells — only 4 or 6 (anything else falls back to 6). */
  length?: OtpLength;
  /** Allowed characters: digits only, or letters + digits. */
  type?: OtpType;
  /** Controlled joined value (one char per cell). */
  value?: string;
  /** Uncontrolled initial joined value. */
  defaultValue?: string;
  /** Visible field label, associated with the first cell via for/id. */
  label?: string;
  /** Helper text shown below the cells (hidden when an error shows). */
  hint?: string;
  /** Error message — sets aria-invalid + the error state when non-empty. */
  error?: string;
  /** Success state — tints filled cells (mirrors the WC `success` attribute). */
  success?: boolean;
  /** Disables every cell. */
  disabled?: boolean;
  /** Form field name (carried onto the hidden joined input). */
  name?: string;
  /** Renders an inline separator between the two groups of three (length 6). */
  separator?: boolean;
  /** Autofocus the first cell on mount (when not disabled). */
  autoFocus?: boolean;
  /** autocomplete on the first cell (e.g. "one-time-code"). */
  autoComplete?: string;
  /** Fired on every value change with the joined string (hbd:change). */
  onValueChange?: (value: string) => void;
  /** Fired once every cell is filled (hbd:complete). */
  onComplete?: (value: string) => void;
}

function lengthFromProp(len: number | undefined): OtpLength {
  return len === 4 ? 4 : 6;
}

const OtpInput = React.forwardRef<HTMLDivElement, OtpInputProps>(
  (
    {
      className,
      length: lengthProp,
      type = "numeric",
      value: valueProp,
      defaultValue,
      label,
      hint,
      error,
      success = false,
      disabled = false,
      name,
      separator = false,
      autoFocus = false,
      autoComplete,
      onValueChange,
      onComplete,
      ...props
    },
    ref,
  ) => {
    const reactId = React.useId();
    const len = lengthFromProp(lengthProp);
    const isNumeric = (type || "numeric").toLowerCase() !== "alphanumeric";

    const sanitize = React.useCallback(
      (s: string) => (isNumeric ? s.replace(/\D/g, "") : s.replace(/[^A-Za-z0-9]/g, "")),
      [isNumeric],
    );

    // ── controlled-first joined value, normalised into a fixed-length cell array
    const [joined, setJoined] = useControllableState<string>({
      value: valueProp,
      defaultValue: defaultValue ?? "",
      onChange: onValueChange,
    });

    // Derive the per-cell array from the joined value (sanitized, length-capped).
    const values = React.useMemo(() => {
      const s = sanitize(String(joined ?? ""));
      const next = new Array<string>(len).fill("");
      for (let i = 0; i < Math.min(s.length, len); i++) next[i] = s[i];
      return next;
    }, [joined, len, sanitize]);

    const cellRefs = React.useRef<Array<HTMLInputElement | null>>([]);
    if (cellRefs.current.length !== len) {
      cellRefs.current = new Array(len).fill(null);
    }

    const cellAt = (i: number) => cellRefs.current[i] ?? null;
    const focusCell = (i: number) => {
      const el = cellAt(i);
      if (el) {
        el.focus();
        el.select();
      }
    };

    const isFull = (vals: string[]) => vals.every((v) => v && v.length > 0);

    // Commit a fresh cell array: join, push through controllable state, and
    // fire onComplete when every cell is filled (mirrors the WC ordering).
    const commit = (next: string[]) => {
      const value = next.map((v) => v || "").join("");
      setJoined(value);
      if (isFull(next)) onComplete?.(value);
    };

    // ── helpers mirroring _distributeFromIndex / spread logic
    const distributeFromIndex = (startIdx: number, rawText: string) => {
      const cleaned = sanitize(String(rawText)).slice(0, len - startIdx);
      if (!cleaned) return;

      const next = values.slice();
      for (let i = 0; i < cleaned.length; i++) {
        const cellIdx = startIdx + i;
        if (cellIdx >= len) break;
        next[cellIdx] = cleaned[i];
      }
      commit(next);

      // Focus the first remaining empty cell, or the last cell when full.
      const nextEmpty = next.findIndex((v) => !v);
      const focusIdx = nextEmpty === -1 ? len - 1 : nextEmpty;
      // Defer focus until after the controlled re-render paints the new values.
      requestAnimationFrame(() => focusCell(focusIdx));
    };

    // ── focus: select on focus so a keystroke overwrites the existing char.
    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      e.target.select();
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, idx: number) => {
      const cell = e.currentTarget;
      switch (e.key) {
        case "Backspace":
          if (cell.value === "") {
            const prev = cellAt(idx - 1);
            if (prev) {
              e.preventDefault();
              prev.focus();
              prev.select();
              const next = values.slice();
              next[idx - 1] = "";
              commit(next);
            }
          }
          // If the cell has a value, native Backspace clears it; the
          // input handler then updates the value + class state.
          return;
        case "ArrowLeft": {
          e.preventDefault();
          focusCell(idx - 1);
          return;
        }
        case "ArrowRight": {
          e.preventDefault();
          focusCell(idx + 1);
          return;
        }
        case "ArrowUp":
        case "ArrowDown":
          e.preventDefault();
          return;
        case "Home": {
          e.preventDefault();
          focusCell(0);
          return;
        }
        case "End": {
          e.preventDefault();
          focusCell(len - 1);
          return;
        }
        default:
          return;
      }
    };

    const handleInput = (e: React.ChangeEvent<HTMLInputElement>, idx: number) => {
      const raw = e.target.value;
      const cleaned = sanitize(raw);

      if (!cleaned) {
        // Disallowed character or pure deletion.
        const next = values.slice();
        next[idx] = "";
        commit(next);
        return;
      }

      // Multiple characters landed in one cell (mobile autofill / pasted text
      // that bypassed the paste handler) — spread from this index.
      if (cleaned.length > 1) {
        distributeFromIndex(idx, cleaned);
        return;
      }

      // Single character.
      const ch = cleaned[0];
      const next = values.slice();
      next[idx] = ch;
      commit(next);

      if (idx < len - 1) {
        requestAnimationFrame(() => focusCell(idx + 1));
      }
      // onComplete for the full case is handled inside commit().
    };

    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>, idx: number) => {
      e.preventDefault();
      const text = e.clipboardData?.getData("text") ?? "";
      if (!text) return;
      // Insert at the focused cell, unless it's already filled — then jump to
      // the first empty cell (the natural insert point).
      let startIdx = idx;
      if (values[idx]) {
        const firstEmpty = values.findIndex((v) => !v);
        startIdx = firstEmpty === -1 ? idx : firstEmpty;
      }
      distributeFromIndex(startIdx, text);
    };

    // ── mount autofocus (first cell, when enabled)
    React.useEffect(() => {
      if (autoFocus && !disabled) {
        cellAt(0)?.focus();
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const hasError = error != null && error !== "";
    const hasHint = hint != null && hint !== "";
    const showSeparator = separator && len === 6;

    const describedBy =
      [hasHint ? `hint-${reactId}` : "", hasError ? `error-${reactId}` : ""]
        .filter(Boolean)
        .join(" ") || undefined;

    const firstCellId = `otp-cell-${reactId}-0`;

    const cells: React.ReactNode[] = [];
    for (let i = 0; i < len; i++) {
      const value = values[i] || "";
      const filled = value !== "";
      const inputMode = isNumeric ? "numeric" : "text";
      const pattern = isNumeric ? "[0-9]" : "[a-zA-Z0-9]";
      const ac = i === 0 ? autoComplete || "off" : "off";
      const ariaLabel = `${label || "Code"} digit ${i + 1} of ${len}`;

      cells.push(
        <input
          key={`cell-${i}`}
          ref={(el) => {
            cellRefs.current[i] = el;
          }}
          className={cn("hbd-otp__cell", filled && "is-filled")}
          id={`otp-cell-${reactId}-${i}`}
          data-index={i}
          type="text"
          inputMode={inputMode}
          pattern={pattern}
          maxLength={1}
          autoComplete={ac}
          aria-label={ariaLabel}
          aria-invalid={hasError || undefined}
          value={value}
          disabled={disabled}
          onFocus={handleFocus}
          onKeyDown={(e) => handleKeyDown(e, i)}
          onChange={(e) => handleInput(e, i)}
          onPaste={(e) => handlePaste(e, i)}
        />,
      );

      if (showSeparator && i === 2) {
        cells.push(
          <span key="separator" className="hbd-otp__separator" aria-hidden="true">
            –
          </span>,
        );
      }
    }

    return (
      <div
        ref={ref}
        className={cn(
          "hbd-field",
          "hbd-otp-field",
          hasError && "hbd-otp-field--error",
          hasError && "hbd-field--error",
          disabled && "hbd-otp-field--disabled",
          disabled && "hbd-field--disabled",
          success && "hbd-otp-field--success",
          className,
        )}
        {...props}
      >
        {label ? (
          <label className="hbd-field__label" id={`label-${reactId}`} htmlFor={firstCellId}>
            {label}
          </label>
        ) : null}

        <div
          className="hbd-otp__cells"
          role="group"
          aria-labelledby={label ? `label-${reactId}` : undefined}
          aria-describedby={describedBy}
        >
          {cells}
        </div>

        <div className="hbd-field__footer">
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
        </div>

        {name ? (
          <input type="hidden" name={name} value={values.map((v) => v || "").join("")} />
        ) : null}
      </div>
    );
  },
);
OtpInput.displayName = "OtpInput";

export { OtpInput };
