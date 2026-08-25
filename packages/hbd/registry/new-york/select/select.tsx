"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

// Ported from ds/components/hbd-select.js + the select section of
// ds/styles/components/input.css.
//
// A fully-accessible custom select built as a combobox + listbox pattern
// (native <select> can't be styled to the HBD spec). It REUSES the shared
// .hbd-field chrome shipped by @hbd/input (label, input-wrapper, footer,
// messages, the trigger surface base/state/size rules) and ships the
// select-specific panel/option/chip rules in select.css.
//
// This file OWNS the option/group model — Select.Option + Select.Group are
// authored as compound children (data carriers, never rendered directly) and
// are read/flattened the same way the WC reads <hbd-option>/<hbd-option-group>
// children. The combobox port reuses these exports.
//
// Controlled-first: value + onValueChange + defaultValue via an inline
// useControllableState helper. A hidden native <select> mirrors the value for
// form submission, exactly as the WC does.

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

export type SelectSize = "sm" | "md" | "lg";

// detail payload carried by the legacy hbd:change event.
export interface SelectChangeDetail {
  value: string;
  label: string | null;
}

// ── Compound data-carrier members (NOT rendered directly) ──────────────────
// Mirror the WC's <hbd-option> / <hbd-option-group>. They exist purely so the
// option/group model can be authored declaratively as children; Select reads
// their props the way the WC reads attributes/textContent.

export interface SelectOptionProps {
  /** Option value; falls back to the text children if omitted. */
  value?: string;
  disabled?: boolean;
  children?: React.ReactNode;
}
const SelectOption: React.FC<SelectOptionProps> = () => null;
SelectOption.displayName = "Select.Option";

export interface SelectGroupProps {
  /** Group heading rendered as a non-selectable label. */
  label: string;
  children?: React.ReactNode;
}
const SelectGroup: React.FC<SelectGroupProps> = () => null;
SelectGroup.displayName = "Select.Group";

// ── Internal flattened model (parallels the WC's _readOptions) ─────────────
interface FlatOption {
  value: string;
  label: string;
  disabled: boolean;
  index: number;
}
interface OptionGroupModel {
  label: string | null;
  options: FlatOption[];
}

function textContent(node: React.ReactNode): string {
  if (node == null || node === false || node === true) return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(textContent).join("");
  if (React.isValidElement(node)) {
    return textContent((node.props as { children?: React.ReactNode }).children);
  }
  return "";
}

// Flatten Select.Option / Select.Group children into a uniform list, keeping a
// parallel groups array for rendering structure. Matches the WC's _readOptions.
function readOptions(children: React.ReactNode): {
  groups: OptionGroupModel[];
  flat: FlatOption[];
} {
  const groups: OptionGroupModel[] = [];
  const flat: FlatOption[] = [];

  const makeEntry = (el: React.ReactElement<SelectOptionProps>): FlatOption => {
    const label = textContent(el.props.children).trim();
    const value = el.props.value != null ? el.props.value : label;
    return {
      value,
      label,
      disabled: !!el.props.disabled,
      index: flat.length,
    };
  };

  React.Children.forEach(children, (child) => {
    if (!React.isValidElement(child)) return;
    const type = child.type as React.FC;
    if (type === SelectGroup) {
      const groupEl = child as React.ReactElement<SelectGroupProps>;
      const grp: OptionGroupModel = {
        label: groupEl.props.label || "",
        options: [],
      };
      React.Children.forEach(groupEl.props.children, (opt) => {
        if (React.isValidElement(opt) && (opt.type as React.FC) === SelectOption) {
          const entry = makeEntry(opt as React.ReactElement<SelectOptionProps>);
          grp.options.push(entry);
          flat.push(entry);
        }
      });
      groups.push(grp);
    } else if (type === SelectOption) {
      const entry = makeEntry(child as React.ReactElement<SelectOptionProps>);
      flat.push(entry);
      groups.push({ label: null, options: [entry] });
    }
  });

  return { groups, flat };
}

let uidCounter = 0;

const ChevronIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path
      d="M3 5l4 4 4-4"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const ClearIcon = () => (
  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
    <path
      d="M2.5 2.5l5 5M7.5 2.5l-5 5"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

const CheckIcon = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
    <path
      d="M2 6.5l2.5 2.5L10 3.5"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export interface SelectProps extends VariantProps<typeof fieldVariants> {
  /** Controlled value. */
  value?: string;
  /** Uncontrolled initial value. */
  defaultValue?: string;
  /** Hidden native <select> name for form submission. */
  name?: string;
  /** Placeholder shown when nothing is selected. */
  placeholder?: string;
  /** Visible field label, associated with the trigger via for/id. */
  label?: string;
  /** Helper text shown below the trigger (hidden when an error shows). */
  hint?: string;
  /** Error message — sets aria-invalid + the error state when non-empty. */
  error?: string;
  required?: boolean;
  disabled?: boolean;
  /** Lays the select out flat/inline (no chip pill) — used by pagination. */
  flat?: boolean;
  className?: string;
  /** Fired on commit with the {value, label} detail (hbd:change). */
  onValueChange?: (value: string) => void;
  /** Lower-level change carrying the full detail (hbd:change). */
  onChange?: (detail: SelectChangeDetail) => void;
  /** Fired when the panel opens (hbd:open). */
  onOpen?: () => void;
  /** Fired when the panel closes (hbd:close). */
  onClose?: () => void;
  /** Select.Option / Select.Group children. */
  children?: React.ReactNode;
}

interface SelectComponent extends React.ForwardRefExoticComponent<
  SelectProps & React.RefAttributes<HTMLDivElement>
> {
  Option: typeof SelectOption;
  Group: typeof SelectGroup;
}

const SelectBase = React.forwardRef<HTMLDivElement, SelectProps>(
  (
    {
      className,
      size,
      value: valueProp,
      defaultValue,
      name,
      placeholder = "",
      label,
      hint,
      error,
      required = false,
      disabled = false,
      flat = false,
      onValueChange,
      onChange,
      onOpen,
      onClose,
      children,
    },
    ref,
  ) => {
    const uid = React.useMemo(() => `hbd-select-${++uidCounter}`, []);

    const [value, setValueState] = useControllableState<string>({
      value: valueProp,
      defaultValue: defaultValue ?? "",
      onChange: onValueChange,
    });

    const { groups, flat: options } = React.useMemo(() => readOptions(children), [children]);

    const [open, setOpen] = React.useState(false);
    const [focusedIndex, setFocusedIndex] = React.useState(-1);
    const [panelStyle, setPanelStyle] = React.useState<React.CSSProperties>({});

    const rootRef = React.useRef<HTMLDivElement>(null);
    const triggerRef = React.useRef<HTMLButtonElement>(null);
    const panelRef = React.useRef<HTMLUListElement>(null);
    const nativeRef = React.useRef<HTMLSelectElement>(null);
    const typeBufferRef = React.useRef("");
    const typeTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
    React.useImperativeHandle(ref, () => rootRef.current as HTMLDivElement);

    const hasError = error != null && error !== "";
    const hasHint = hint != null && hint !== "";

    const selected = React.useMemo(
      () => options.find((o) => o.value === value) ?? null,
      [options, value],
    );

    const describedBy =
      [hasHint ? `hint-${uid}` : "", hasError ? `error-${uid}` : ""].filter(Boolean).join(" ") ||
      undefined;

    // ── enabled-index helpers (mirror the WC) ───────────────────────────
    const firstEnabledIndex = React.useCallback(
      () => options.findIndex((o) => !o.disabled),
      [options],
    );
    const lastEnabledIndex = React.useCallback(() => {
      for (let i = options.length - 1; i >= 0; i--) {
        if (!options[i].disabled) return i;
      }
      return -1;
    }, [options]);
    const nextEnabled = React.useCallback(
      (from: number, dir: number) => {
        const n = options.length;
        if (n === 0) return -1;
        let i = from;
        for (let step = 0; step < n; step++) {
          i = (i + dir + n) % n;
          if (!options[i].disabled) return i;
        }
        return -1;
      },
      [options],
    );

    // ── Panel positioning (fixed coords from the trigger rect) ──────────
    // Documented overlay-positioning inline-style exception — the WC sets
    // these via getBoundingClientRect for the same reason (escape any
    // scrolling/transformed ancestor). Mirrors _positionPanel exactly.
    const positionPanel = React.useCallback(() => {
      const trigger = triggerRef.current;
      const panel = panelRef.current;
      if (!trigger || !panel) return;

      // Reset to a known origin so we can measure the containing-block offset.
      panel.style.left = "0px";
      panel.style.top = "0px";

      const triggerRect = trigger.getBoundingClientRect();
      const panelRect = panel.getBoundingClientRect();
      const cbX = panelRect.left;
      const cbY = panelRect.top;

      const gap = 4;
      const maxBelow = window.innerHeight - triggerRect.bottom - gap;
      const maxAbove = triggerRect.top - gap;
      const preferAbove = maxBelow < 200 && maxAbove > maxBelow;

      const panelTopViewport = preferAbove
        ? Math.max(gap, triggerRect.top - gap - Math.min(maxAbove, 280))
        : triggerRect.bottom + gap;

      const maxH = preferAbove ? maxAbove : maxBelow;

      setPanelStyle({
        left: `${triggerRect.left - cbX}px`,
        top: `${panelTopViewport - cbY}px`,
        width: `${triggerRect.width}px`,
        maxHeight: `${Math.max(120, Math.min(280, maxH))}px`,
      });
    }, []);

    // Focus an option element by index (mirrors _focusActiveOption /
    // _setFocusedIndex DOM moves; React state drives the classes/aria).
    const focusOptionEl = React.useCallback(
      (idx: number) => {
        const el = panelRef.current?.querySelector<HTMLLIElement>(`#option-${uid}-${idx}`);
        if (el) {
          el.focus({ preventScroll: false });
          el.scrollIntoView({ block: "nearest" });
        }
      },
      [uid],
    );

    // ── Open / close ────────────────────────────────────────────────────
    const openPanel = React.useCallback(() => {
      if (open || disabled) return;
      let idx = options.findIndex((o) => o.value === value && !o.disabled);
      if (idx < 0) idx = firstEnabledIndex();
      setFocusedIndex(idx);
      setOpen(true);
      onOpen?.();
    }, [open, disabled, options, value, firstEnabledIndex, onOpen]);

    const closePanel = React.useCallback(
      (returnFocus = true) => {
        setOpen((wasOpen) => {
          if (!wasOpen) return wasOpen;
          if (returnFocus) {
            requestAnimationFrame(() => triggerRef.current?.focus({ preventScroll: true }));
          }
          onClose?.();
          return false;
        });
      },
      [onClose],
    );

    // Position the panel + install reposition/outside-click listeners while
    // open (the WC installs scroll(capture)/resize + a capturing pointerdown).
    React.useLayoutEffect(() => {
      if (!open) return;
      positionPanel();
      // Move focus into the active option once the panel is laid out.
      const idx = focusedIndex >= 0 ? focusedIndex : firstEnabledIndex();
      if (idx >= 0) focusOptionEl(idx);
    }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

    React.useEffect(() => {
      if (!open) return;
      const onReposition = () => positionPanel();
      window.addEventListener("scroll", onReposition, true);
      window.addEventListener("resize", onReposition);
      const onDocPointer = (e: PointerEvent) => {
        if (!rootRef.current?.contains(e.target as Node)) closePanel(false);
      };
      document.addEventListener("pointerdown", onDocPointer, true);
      return () => {
        window.removeEventListener("scroll", onReposition, true);
        window.removeEventListener("resize", onReposition);
        document.removeEventListener("pointerdown", onDocPointer, true);
      };
    }, [open, positionPanel, closePanel]);

    React.useEffect(() => {
      return () => {
        if (typeTimerRef.current) clearTimeout(typeTimerRef.current);
      };
    }, []);

    // ── Selection ───────────────────────────────────────────────────────
    const commitValue = React.useCallback(
      (next: string, lbl: string | null) => {
        setValueState(next);
        if (nativeRef.current) nativeRef.current.value = next;
        onChange?.({ value: next, label: lbl });
      },
      [setValueState, onChange],
    );

    const clearSelection = React.useCallback(() => {
      if (disabled || value === "") return;
      const wasOpen = open;
      commitValue("", null);
      if (wasOpen) {
        setOpen(false);
        onClose?.();
      }
      requestAnimationFrame(() => triggerRef.current?.focus({ preventScroll: true }));
    }, [disabled, value, open, commitValue, onClose]);

    const selectByIndex = React.useCallback(
      (i: number) => {
        const o = options[i];
        if (!o || o.disabled) return;
        // Toggle-off: re-selecting the current value clears it (WC behaviour).
        if (o.value === value) {
          clearSelection();
          return;
        }
        commitValue(o.value, o.label);
        closePanel(true);
      },
      [options, value, clearSelection, commitValue, closePanel],
    );

    const moveFocusTo = React.useCallback(
      (i: number) => {
        if (i < 0) return;
        setFocusedIndex(i);
        focusOptionEl(i);
      },
      [focusOptionEl],
    );

    // ── Keyboard ────────────────────────────────────────────────────────
    const onTriggerKeydown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
      if (disabled) return;
      switch (e.key) {
        case "ArrowDown":
        case "Down":
        case "ArrowUp":
        case "Up":
        case "Enter":
        case " ":
        case "Spacebar":
          e.preventDefault();
          openPanel();
          break;
        default:
          break;
      }
    };

    const onPanelKeydown = (e: React.KeyboardEvent<HTMLUListElement>) => {
      const k = e.key;
      if (k === "Escape") {
        e.preventDefault();
        closePanel(true);
        return;
      }
      if (k === "Tab") {
        closePanel(false); // let Tab propagate
        return;
      }
      if (k === "Enter" || k === " " || k === "Spacebar") {
        e.preventDefault();
        if (focusedIndex >= 0) selectByIndex(focusedIndex);
        return;
      }
      if (k === "ArrowDown" || k === "Down") {
        e.preventDefault();
        moveFocusTo(nextEnabled(focusedIndex >= 0 ? focusedIndex : -1, 1));
        return;
      }
      if (k === "ArrowUp" || k === "Up") {
        e.preventDefault();
        moveFocusTo(nextEnabled(focusedIndex >= 0 ? focusedIndex : -1, -1));
        return;
      }
      if (k === "Home") {
        e.preventDefault();
        moveFocusTo(firstEnabledIndex());
        return;
      }
      if (k === "End") {
        e.preventDefault();
        moveFocusTo(lastEnabledIndex());
        return;
      }
      // Type-to-search: single printable character.
      if (k.length === 1 && /\S/.test(k)) {
        typeBufferRef.current += k.toLowerCase();
        if (typeTimerRef.current) clearTimeout(typeTimerRef.current);
        typeTimerRef.current = setTimeout(() => {
          typeBufferRef.current = "";
        }, 500);
        const start = (focusedIndex + 1) % options.length;
        for (let step = 0; step < options.length; step++) {
          const idx = (start + step) % options.length;
          const o = options[idx];
          if (!o.disabled && o.label.toLowerCase().startsWith(typeBufferRef.current)) {
            moveFocusTo(idx);
            return;
          }
        }
      }
    };

    const displayText = selected ? selected.label : placeholder || " ";
    const valueClass = selected
      ? "hbd-field__select-value hbd-field__select-value--chip"
      : "hbd-field__select-value hbd-field__select-value--placeholder";

    const renderOption = (o: FlatOption) => {
      const isSelected = o.value === value;
      const isFocused = o.index === focusedIndex;
      const isTabbable = isFocused || (focusedIndex === -1 && o.index === firstEnabledIndex());
      return (
        <li
          key={o.index}
          className={cn(
            "hbd-field__option",
            isSelected && "is-selected",
            o.disabled && "is-disabled",
            isFocused && "is-focused",
          )}
          role="option"
          id={`option-${uid}-${o.index}`}
          aria-selected={isSelected ? "true" : "false"}
          aria-disabled={o.disabled ? "true" : undefined}
          tabIndex={isTabbable ? 0 : -1}
          data-value={o.value}
          data-index={o.index}
          onClick={(e) => {
            if (o.disabled) return;
            e.stopPropagation();
            selectByIndex(o.index);
          }}
        >
          <span>{o.label}</span>
          <span className="hbd-field__option-check" aria-hidden="true">
            <CheckIcon />
          </span>
        </li>
      );
    };

    return (
      <div
        ref={rootRef}
        className={cn(
          "hbd-select",
          flat && "hbd-select--flat",
          fieldVariants({ size }),
          hasError && "hbd-field--error",
          disabled && "hbd-field--disabled",
          open && "hbd-field--open",
          className,
        )}
        role="combobox"
        aria-expanded={open ? "true" : "false"}
        aria-haspopup="listbox"
        aria-labelledby={`label-${uid}`}
      >
        {label ? (
          <label className="hbd-field__label" id={`label-${uid}`} htmlFor={`trigger-${uid}`}>
            {label}
            {required ? (
              <span className="hbd-field__label-required" aria-hidden="true">
                *
              </span>
            ) : null}
          </label>
        ) : null}

        <div className="hbd-field__input-wrapper">
          <button
            ref={triggerRef}
            className="hbd-field__select-trigger"
            id={`trigger-${uid}`}
            type="button"
            aria-controls={`panel-${uid}`}
            aria-haspopup="listbox"
            aria-expanded={open ? "true" : "false"}
            aria-required={required || undefined}
            aria-invalid={hasError || undefined}
            aria-describedby={describedBy}
            disabled={disabled}
            onClick={(e) => {
              e.stopPropagation();
              if (open) closePanel();
              else openPanel();
            }}
            onKeyDown={onTriggerKeydown}
          >
            <span className={valueClass}>
              {selected ? (
                <span className="hbd-field__select-chip-label">{displayText}</span>
              ) : (
                displayText
              )}
              {selected && !disabled ? (
                // role="button" span (not <button>): HTML disallows nesting a
                // <button> inside the trigger <button>, so this is a focusable
                // span with explicit keyboard handling.
                <span
                  role="button"
                  tabIndex={0}
                  className="hbd-field__select-chip-clear"
                  aria-label={`Clear selection, currently ${selected.label}`}
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    clearSelection();
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                  }}
                  onKeyDown={(e) => {
                    if (e.key !== "Enter" && e.key !== " " && e.key !== "Spacebar") return;
                    e.preventDefault();
                    e.stopPropagation();
                    clearSelection();
                  }}
                >
                  <ClearIcon />
                </span>
              ) : null}
            </span>
            <span className="hbd-field__select-chevron" aria-hidden="true">
              <ChevronIcon />
            </span>
          </button>

          <ul
            ref={panelRef}
            className="hbd-field__select-panel"
            id={`panel-${uid}`}
            role="listbox"
            aria-labelledby={`label-${uid}`}
            aria-multiselectable="false"
            style={panelStyle}
            onKeyDown={onPanelKeydown}
          >
            {groups.map((grp, gi) =>
              grp.label ? (
                <li key={`group-${gi}`} className="hbd-field__option-group" role="presentation">
                  <span className="hbd-field__option-group-label" id={`group-${uid}-${gi}`}>
                    {grp.label}
                  </span>
                  <ul role="group" aria-labelledby={`group-${uid}-${gi}`}>
                    {grp.options.map(renderOption)}
                  </ul>
                </li>
              ) : (
                grp.options.map(renderOption)
              ),
            )}
          </ul>
        </div>

        {/* Hidden native <select> — form-submission fallback only. */}
        <select
          ref={nativeRef}
          className="hbd-field__select-native hbd-sr-only"
          name={name}
          aria-hidden="true"
          tabIndex={-1}
          required={required}
          disabled={disabled}
          value={value}
          onChange={() => {}}
        >
          {placeholder && !selected ? (
            <option value="" disabled hidden>
              {placeholder}
            </option>
          ) : null}
          {groups.map((grp, gi) =>
            grp.label ? (
              <optgroup key={`ng-${gi}`} label={grp.label}>
                {grp.options.map((o) => (
                  <option key={o.index} value={o.value} disabled={o.disabled}>
                    {o.label}
                  </option>
                ))}
              </optgroup>
            ) : (
              grp.options.map((o) => (
                <option key={o.index} value={o.value} disabled={o.disabled}>
                  {o.label}
                </option>
              ))
            ),
          )}
        </select>

        {hasHint || hasError ? (
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
        ) : null}
      </div>
    );
  },
);
SelectBase.displayName = "Select";

const Select = SelectBase as SelectComponent;
Select.Option = SelectOption;
Select.Group = SelectGroup;

export { Select, SelectOption, SelectGroup, fieldVariants };
