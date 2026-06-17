"use client";

import * as React from "react";
import { useFloating, autoUpdate, flip, size as floatingSize, offset } from "@floating-ui/react";
import { cn } from "@/lib/utils";
import { Select, SelectOption, SelectGroup } from "@/registry/new-york/select/select";

// Ported from ds/components/hbd-combobox.js + the combobox section of
// ds/styles/components/input.css (now shipped as combobox.css).
//
// Combobox / autocomplete: a text input + filterable listbox suggestion panel
// following the APG aria-activedescendant pattern — DOM focus STAYS on the
// text input and the "active" option is identified by id on the input's
// aria-activedescendant. Three modes:
//   autocomplete — suggestions filter as user types, free text allowed
//   strict       — only listed values are valid; non-match reverts on blur
//   multi        — multiple selections rendered as chips inside the input
//
// REUSES @hbd/input's shared .hbd-field chrome (label/hint/error/footer) and
// @hbd/select's dropdown panel + option styles (.hbd-field__select-panel /
// .hbd-field__option*). The option/group data model is authored declaratively
// with Combobox.Option / Combobox.Group, which are re-exports of @hbd/select's
// Select.Option / Select.Group (same data carriers the WC reads from children).
//
// @floating-ui/react anchors the fixed-position panel to the field wrapper,
// matching the WC's adopted select-panel rules (position: fixed) without the
// bespoke getBoundingClientRect math.

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

export type ComboboxMode = "autocomplete" | "strict" | "multi";
export type ComboboxSize = "sm" | "md" | "lg";

// Compound data-carrier members re-exported from @hbd/select. They mirror the
// WC's <hbd-option> / <hbd-option-group> children and are never rendered
// directly — readOptions() flattens them.
export const ComboboxOption = SelectOption;
export const ComboboxGroup = SelectGroup;

// ── Option model (parallels the WC's _readOptions / setOptions entries) ────
export interface ComboboxItem {
  value: string;
  label: string;
  disabled?: boolean;
}
interface FlatOption {
  value: string;
  label: string;
  disabled: boolean;
  index: number;
}
export interface SelectedItem {
  value: string;
  label: string;
}

// detail payloads carried by the legacy hbd:change / hbd:search events.
export interface ComboboxChangeDetail {
  value: string;
  label: string | null;
}
export interface ComboboxMultiChangeDetail {
  values: SelectedItem[];
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

// Flatten Combobox.Option / Combobox.Group children into a uniform list.
// Matches the WC's _readOptions (group structure is irrelevant to the combobox
// panel, which renders a flat filtered list, so only the flat array is kept).
function readOptions(children: React.ReactNode): FlatOption[] {
  const flat: FlatOption[] = [];

  const makeEntry = (
    el: React.ReactElement<{
      value?: string;
      disabled?: boolean;
      children?: React.ReactNode;
    }>,
  ): FlatOption => {
    const label = textContent(el.props.children).trim();
    const value = el.props.value != null ? el.props.value : label;
    return { value, label, disabled: !!el.props.disabled, index: flat.length };
  };

  React.Children.forEach(children, (child) => {
    if (!React.isValidElement(child)) return;
    const type = child.type as React.FC;
    if (type === SelectGroup) {
      const groupEl = child as React.ReactElement<{ children?: React.ReactNode }>;
      React.Children.forEach(groupEl.props.children, (opt) => {
        if (React.isValidElement(opt) && (opt.type as React.FC) === SelectOption) {
          flat.push(
            makeEntry(
              opt as React.ReactElement<{
                value?: string;
                disabled?: boolean;
                children?: React.ReactNode;
              }>,
            ),
          );
        }
      });
    } else if (type === SelectOption) {
      flat.push(
        makeEntry(
          child as React.ReactElement<{
            value?: string;
            disabled?: boolean;
            children?: React.ReactNode;
          }>,
        ),
      );
    }
  });

  return flat;
}

let uidCounter = 0;

const ClearIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
    <path
      d="M3.5 3.5l7 7M10.5 3.5l-7 7"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
    />
  </svg>
);

const ChipRemoveIcon = () => (
  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
    <path
      d="M2.5 2.5l5 5M7.5 2.5l-5 5"
      stroke="currentColor"
      strokeWidth="1.6"
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

export interface ComboboxProps {
  /** Mode: autocomplete (free text) | strict (must match) | multi (chips). */
  mode?: ComboboxMode;
  size?: ComboboxSize;
  /** Controlled value (single/autocomplete/strict). */
  value?: string;
  /** Uncontrolled initial value (single/autocomplete/strict). */
  defaultValue?: string;
  /** Controlled selection list (multi). */
  values?: SelectedItem[];
  /** Uncontrolled initial selection list (multi). */
  defaultValues?: SelectedItem[];
  name?: string;
  placeholder?: string;
  label?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  /** Minimum query length before filtering kicks in (default 1). */
  minChars?: number;
  /** Debounce (ms) before filtering / firing onSearch (default 200). */
  debounce?: number;
  /** Server-side search mode: skip local filtering, fire onSearch instead. */
  noFilter?: boolean;
  className?: string;
  /** Fired on commit with {value,label} (single) or {values} (multi) — hbd:change. */
  onChange?: (detail: ComboboxChangeDetail | ComboboxMultiChangeDetail) => void;
  /** Convenience: the committed value string (single/autocomplete/strict). */
  onValueChange?: (value: string) => void;
  /** Convenience: the committed selection list (multi). */
  onValuesChange?: (values: SelectedItem[]) => void;
  /** no-filter mode: debounced query for server-side search — hbd:search. */
  onSearch?: (detail: { query: string }) => void;
  /** Strict mode: a typed value that matched no option — hbd:invalid-input. */
  onInvalidInput?: (detail: { input: string }) => void;
  /** Panel opened — hbd:open. */
  onOpen?: () => void;
  /** Panel closed — hbd:close. */
  onClose?: () => void;
  /** Combobox.Option / Combobox.Group children (static option set). */
  children?: React.ReactNode;
}

export interface ComboboxHandle {
  /** Replace the option set (dynamic / async — parallels the WC setOptions). */
  setOptions: (options: ComboboxItem[]) => void;
  /** Current single value. */
  readonly value: string;
  /** Current multi selection. */
  readonly values: SelectedItem[];
}

interface ComboboxComponent extends React.ForwardRefExoticComponent<
  ComboboxProps & React.RefAttributes<ComboboxHandle>
> {
  Option: typeof SelectOption;
  Group: typeof SelectGroup;
}

const ComboboxBase = React.forwardRef<ComboboxHandle, ComboboxProps>(
  (
    {
      mode = "autocomplete",
      size,
      value: valueProp,
      defaultValue,
      values: valuesProp,
      defaultValues,
      name,
      placeholder = "",
      label,
      hint,
      error,
      required = false,
      disabled = false,
      minChars: minCharsProp,
      debounce: debounceProp,
      noFilter = false,
      className,
      onChange,
      onValueChange,
      onValuesChange,
      onSearch,
      onInvalidInput,
      onOpen,
      onClose,
      children,
    },
    ref,
  ) => {
    const uid = React.useMemo(() => `hbd-combobox-${++uidCounter}`, []);

    const isMulti = mode === "multi";
    const isStrict = mode === "strict";
    const minChars =
      minCharsProp != null && Number.isFinite(minCharsProp) && minCharsProp >= 0 ? minCharsProp : 1;
    const debounceMs =
      debounceProp != null && Number.isFinite(debounceProp) && debounceProp >= 0
        ? debounceProp
        : 200;

    // Single value (autocomplete/strict) — controlled-first.
    const [value, setValueState] = useControllableState<string>({
      value: valueProp,
      defaultValue: defaultValue ?? "",
      onChange: onValueChange,
    });

    // Multi selection — controlled-first.
    const [selectedItems, setSelectedItems] = useControllableState<SelectedItem[]>({
      value: valuesProp,
      defaultValue: defaultValues ?? [],
      onChange: onValuesChange,
    });

    // Options from children, unless overridden via the imperative setOptions().
    const childOptions = React.useMemo(() => readOptions(children), [children]);
    const [dynamicOptions, setDynamicOptions] = React.useState<FlatOption[] | null>(null);
    const allOptions = dynamicOptions ?? childOptions;

    // ── Component state (mirrors the WC instance fields) ─────────────────
    const [open, setOpen] = React.useState(false);
    const [loading, setLoading] = React.useState(false);
    const [inputValue, setInputValue] = React.useState("");
    const [activeIndex, setActiveIndex] = React.useState(-1);
    // The current filtered subset of allOptions.
    const [filtered, setFiltered] = React.useState<FlatOption[]>(allOptions);

    const inputRef = React.useRef<HTMLInputElement>(null);
    const panelRef = React.useRef<HTMLUListElement | null>(null);
    const debounceTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
    // input text to revert to on Escape (the WC's _lastConfirmed).
    const lastConfirmed = React.useRef("");
    // Suppress the blur-revert immediately after picking an option by mouse.
    const ignoreBlur = React.useRef(false);

    const hasError = error != null && error !== "";
    const hasHint = hint != null && hint !== "";

    // ── @floating-ui anchor (fixed-position panel like the WC) ───────────
    const { refs, floatingStyles } = useFloating({
      open,
      strategy: "fixed",
      placement: "bottom-start",
      whileElementsMounted: autoUpdate,
      middleware: [
        offset(4),
        flip({ padding: 8 }),
        floatingSize({
          apply({ rects, elements }) {
            Object.assign(elements.floating.style, {
              width: `${rects.reference.width}px`,
            });
          },
        }),
      ],
    });

    // ── Helpers (mirror the WC) ──────────────────────────────────────────
    const labelForValue = React.useCallback(
      (v: string): string => {
        if (!v) return "";
        const hit = allOptions.find((o) => o.value === v);
        return hit ? hit.label : v;
      },
      [allOptions],
    );

    const firstEnabledFilteredIndex = React.useCallback(
      (list: FlatOption[]) => list.findIndex((o) => !o.disabled),
      [],
    );
    const lastEnabledFilteredIndex = (list: FlatOption[]) => {
      for (let i = list.length - 1; i >= 0; i--) if (!list[i].disabled) return i;
      return -1;
    };
    const nextEnabledFiltered = (list: FlatOption[], from: number, dir: number) => {
      const n = list.length;
      if (n === 0) return -1;
      let i = from;
      for (let s = 0; s < n; s++) {
        i = (i + dir + n) % n;
        if (!list[i].disabled) return i;
      }
      return -1;
    };

    const hasAnyValue = isMulti ? selectedItems.length > 0 : !!value || !!inputValue;

    // The input's display value: multi always empty (chips carry it).
    const displayValue = isMulti ? inputValue : inputValue;

    // ── Open / close ─────────────────────────────────────────────────────
    const openPanel = React.useCallback(
      (nextFiltered?: FlatOption[]) => {
        if (disabled) return;
        setOpen((wasOpen) => {
          if (wasOpen) return wasOpen;
          onOpen?.();
          return true;
        });
        setActiveIndex((prev) => {
          if (prev >= 0) return prev;
          return firstEnabledFilteredIndex(nextFiltered ?? filtered);
        });
      },
      [disabled, filtered, firstEnabledFilteredIndex, onOpen],
    );

    const closePanel = React.useCallback(
      ({ revert = false }: { revert?: boolean } = {}) => {
        setOpen((wasOpen) => {
          if (!wasOpen) return wasOpen;
          onClose?.();
          return false;
        });
        setActiveIndex(-1);
        if (revert) setInputValue(lastConfirmed.current || "");
      },
      [onClose],
    );

    // ── Filtering (mirrors _filterAndOpen) ───────────────────────────────
    const filterAndOpen = React.useCallback(
      (query: string) => {
        const q = (query || "").toLowerCase();
        const selectedLabel = value ? (labelForValue(value) || "").toLowerCase() : "";
        const isJustSelectedLabel = !!selectedLabel && selectedLabel === q;

        let nextFiltered: FlatOption[];
        if (q.length < minChars || isJustSelectedLabel) {
          nextFiltered = allOptions.slice();
        } else {
          nextFiltered = allOptions.filter((o) => o.label.toLowerCase().includes(q));
        }
        setFiltered(nextFiltered);
        setActiveIndex(firstEnabledFilteredIndex(nextFiltered));
        openPanel(nextFiltered);
      },
      [value, labelForValue, minChars, allOptions, firstEnabledFilteredIndex, openPanel],
    );

    // Keep filtered list in sync when the static option set changes while
    // the panel is closed (mirrors the WC MutationObserver reset).
    React.useEffect(() => {
      if (!open) setFiltered(allOptions);
    }, [allOptions, open]);

    // ── Selection (mirrors _selectFilteredIndex) ─────────────────────────
    const selectFilteredIndex = React.useCallback(
      (i: number) => {
        const opt = filtered[i];
        if (!opt || opt.disabled) return;

        if (isMulti) {
          const existing = selectedItems.findIndex((s) => s.value === opt.value);
          let next: SelectedItem[];
          if (existing >= 0) {
            next = selectedItems.filter((_, idx) => idx !== existing);
          } else {
            next = [...selectedItems, { value: opt.value, label: opt.label }];
          }
          setSelectedItems(next);
          setInputValue("");
          lastConfirmed.current = "";
          // Keep the panel open after a multi pick; refocus the input.
          openPanel();
          onChange?.({ values: next.slice() });
          requestAnimationFrame(() => inputRef.current?.focus());
          return;
        }

        // single / autocomplete / strict — toggle-off when re-selecting.
        if (value === opt.value) {
          setValueState("");
          setInputValue("");
          lastConfirmed.current = "";
          closePanel();
          onChange?.({ value: "", label: null });
          return;
        }

        setValueState(opt.value);
        setInputValue(opt.label);
        lastConfirmed.current = opt.label;
        closePanel();
        onChange?.({ value: opt.value, label: opt.label });
      },
      [
        filtered,
        isMulti,
        selectedItems,
        value,
        setSelectedItems,
        setValueState,
        openPanel,
        closePanel,
        onChange,
      ],
    );

    // ── Chip removal (mirrors _removeChipAt) ─────────────────────────────
    const removeChipAt = React.useCallback(
      (idx: number) => {
        if (idx < 0 || idx >= selectedItems.length) return;
        const next = selectedItems.filter((_, i) => i !== idx);
        setSelectedItems(next);
        requestAnimationFrame(() => inputRef.current?.focus());
        onChange?.({ values: next.slice() });
      },
      [selectedItems, setSelectedItems, onChange],
    );

    // ── Clear (mirrors _onClearClick) ────────────────────────────────────
    const onClear = React.useCallback(
      (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (disabled) return;
        if (isMulti) {
          setSelectedItems([]);
        } else {
          setValueState("");
        }
        setInputValue("");
        lastConfirmed.current = "";
        requestAnimationFrame(() => inputRef.current?.focus());
        onChange?.(isMulti ? { values: [] } : { value: "", label: null });
      },
      [disabled, isMulti, setSelectedItems, setValueState, onChange],
    );

    // ── Input handlers (mirror _onInputInput / focus / click / blur) ─────
    const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      let q = e.target.value;

      // Single-select: editing away from the selected label clears both the
      // selection and the residual text so the full option list shows.
      if (!isMulti && value) {
        const selectedLabel = labelForValue(value) || "";
        if (q !== selectedLabel) {
          setValueState("");
          q = "";
          lastConfirmed.current = "";
          setInputValue("");
          onChange?.({ value: "", label: null });
        } else {
          setInputValue(q);
        }
      } else {
        setInputValue(q);
      }

      if (noFilter) {
        setLoading(true);
        openPanel();
        if (debounceTimer.current) clearTimeout(debounceTimer.current);
        debounceTimer.current = setTimeout(() => {
          onSearch?.({ query: q });
        }, debounceMs);
        return;
      }

      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      debounceTimer.current = setTimeout(() => {
        filterAndOpen(q);
      }, debounceMs);
    };

    const onInputFocus = () => {
      if (disabled) return;
      filterAndOpen(inputRef.current?.value ?? "");
    };

    const onInputClick = () => {
      if (disabled || open) return;
      filterAndOpen(inputRef.current?.value ?? "");
    };

    const onInputBlur = () => {
      if (ignoreBlur.current) {
        ignoreBlur.current = false;
        return;
      }
      // Strict mode: revert to the last valid label if the input no longer
      // matches a listed option.
      if (isStrict) {
        const raw = (inputRef.current?.value ?? "").trim();
        const match = allOptions.find((o) => o.label.toLowerCase() === raw.toLowerCase());
        if (raw && !match) {
          onInvalidInput?.({ input: raw });
          setInputValue(labelForValue(value) || "");
        }
      }
      // Close on blur (the document-pointer equivalent in React).
      closePanel();
    };

    const onInputKeydown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (disabled) return;
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          if (!open) filterAndOpen(inputValue);
          else setActiveIndex((cur) => nextEnabledFiltered(filtered, cur, 1));
          return;
        case "ArrowUp":
          e.preventDefault();
          if (!open) filterAndOpen(inputValue);
          else setActiveIndex((cur) => nextEnabledFiltered(filtered, cur, -1));
          return;
        case "Home":
          if (open) {
            e.preventDefault();
            setActiveIndex(firstEnabledFilteredIndex(filtered));
          }
          return;
        case "End":
          if (open) {
            e.preventDefault();
            setActiveIndex(lastEnabledFilteredIndex(filtered));
          }
          return;
        case "Enter":
          if (open && activeIndex >= 0) {
            e.preventDefault();
            selectFilteredIndex(activeIndex);
          }
          return;
        case "Escape":
          if (open) {
            e.preventDefault();
            closePanel({ revert: true });
          }
          return;
        case "Tab":
          if (open) closePanel();
          return;
        case "Backspace":
          if (isMulti && inputValue === "" && selectedItems.length > 0) {
            e.preventDefault();
            removeChipAt(selectedItems.length - 1);
          }
          return;
        default:
          return;
      }
    };

    // Wrapper mousedown — click in blank area focuses the input.
    const onWrapperMouseDown = (e: React.MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest(".hbd-combobox__chip-remove")) return;
      if (target.closest(".hbd-combobox__clear")) return;
      if (target.closest(".hbd-combobox__input")) return;
      if (!disabled) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };

    // ── Active-descendant scroll-into-view (mirrors _syncActiveOptionVisuals)
    React.useEffect(() => {
      if (!open || activeIndex < 0) return;
      const el = panelRef.current?.querySelector<HTMLLIElement>(`#option-${uid}-${activeIndex}`);
      el?.scrollIntoView({ block: "nearest" });
    }, [open, activeIndex, uid]);

    // ── Cleanup ──────────────────────────────────────────────────────────
    React.useEffect(() => {
      return () => {
        if (debounceTimer.current) clearTimeout(debounceTimer.current);
      };
    }, []);

    // ── Imperative handle (setOptions for async, value/values getters) ───
    React.useImperativeHandle(
      ref,
      () => ({
        setOptions(options: ComboboxItem[]) {
          if (!Array.isArray(options)) return;
          const mapped: FlatOption[] = options.map((o, i) => ({
            value: String(o.value ?? o.label ?? ""),
            label: String(o.label ?? o.value ?? ""),
            disabled: !!o.disabled,
            index: i,
          }));
          setDynamicOptions(mapped);
          setFiltered(mapped);
          setLoading(false);
          setActiveIndex(firstEnabledFilteredIndex(mapped));
        },
        get value() {
          return value;
        },
        get values() {
          return selectedItems.slice();
        },
      }),
      [value, selectedItems, firstEnabledFilteredIndex],
    );

    const describedBy =
      [hasHint ? `hint-${uid}` : "", hasError ? `error-${uid}` : ""].filter(Boolean).join(" ") ||
      undefined;

    const activeDescendant = open && activeIndex >= 0 ? `option-${uid}-${activeIndex}` : undefined;

    const showInputPlaceholder = isMulti
      ? selectedItems.length === 0
        ? placeholder
        : undefined
      : placeholder || undefined;

    return (
      <div
        className={cn(
          "hbd-field",
          size === "sm" && "hbd-field--sm",
          size === "lg" && "hbd-field--lg",
          hasError && "hbd-field--error",
          disabled && "hbd-field--disabled",
          open && "hbd-field--open",
          className,
        )}
      >
        {label ? (
          <label className="hbd-field__label" id={`label-${uid}`} htmlFor={`input-${uid}`}>
            {label}
            {required ? (
              <span className="hbd-field__label-required" aria-hidden="true">
                *
              </span>
            ) : null}
          </label>
        ) : null}

        <div className="hbd-combobox__shell" ref={refs.setReference}>
          <div
            className={cn(
              "hbd-combobox",
              isMulti && "hbd-combobox--multi",
              hasAnyValue && "hbd-combobox--has-value",
            )}
            role="combobox"
            aria-expanded={open ? "true" : "false"}
            aria-haspopup="listbox"
            aria-labelledby={label ? `label-${uid}` : undefined}
            aria-owns={`panel-${uid}`}
            onMouseDown={onWrapperMouseDown}
          >
            {isMulti
              ? selectedItems.map((item, i) => (
                  <span
                    key={`${item.value}-${i}`}
                    className="hbd-combobox__chip"
                    data-chip-index={i}
                  >
                    <span className="hbd-combobox__chip-label">{item.label}</span>
                    <button
                      type="button"
                      className="hbd-combobox__chip-remove"
                      data-chip-index={i}
                      aria-label={`Remove ${item.label}`}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        removeChipAt(i);
                      }}
                    >
                      <ChipRemoveIcon />
                    </button>
                  </span>
                ))
              : null}

            <input
              ref={inputRef}
              className="hbd-combobox__input"
              id={`input-${uid}`}
              type="text"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              role="combobox"
              aria-autocomplete="list"
              aria-controls={`panel-${uid}`}
              aria-expanded={open ? "true" : "false"}
              aria-describedby={describedBy}
              aria-required={required || undefined}
              aria-invalid={hasError || undefined}
              aria-activedescendant={activeDescendant}
              placeholder={showInputPlaceholder}
              value={displayValue}
              disabled={disabled}
              onChange={onInputChange}
              onFocus={onInputFocus}
              onClick={onInputClick}
              onBlur={onInputBlur}
              onKeyDown={onInputKeydown}
            />

            <button
              type="button"
              className="hbd-combobox__clear"
              aria-label="Clear selection"
              tabIndex={-1}
              onMouseDown={(e) => {
                // prevent input blur stealing the click
                e.preventDefault();
              }}
              onClick={onClear}
            >
              <ClearIcon />
            </button>
          </div>

          <ul
            ref={(node) => {
              panelRef.current = node;
              refs.setFloating(node);
            }}
            className="hbd-field__select-panel hbd-combobox__panel"
            id={`panel-${uid}`}
            role="listbox"
            aria-labelledby={label ? `label-${uid}` : undefined}
            aria-multiselectable={isMulti ? "true" : "false"}
            style={floatingStyles}
          >
            {loading ? (
              <li className="hbd-combobox__loading-row" role="status" aria-live="polite">
                <span className="hbd-combobox__spinner" aria-hidden="true" />
                <span>Searching…</span>
              </li>
            ) : filtered.length === 0 ? (
              <li className="hbd-combobox__no-results" role="status" aria-live="polite">
                No results
              </li>
            ) : (
              filtered.map((o, i) => {
                const isSelected = isMulti
                  ? selectedItems.some((s) => s.value === o.value)
                  : o.value === value;
                const isActive = i === activeIndex;
                return (
                  <li
                    key={`${o.value}-${i}`}
                    className={cn(
                      "hbd-field__option",
                      isSelected && "is-selected",
                      o.disabled && "is-disabled",
                      isActive && "is-focused",
                    )}
                    role="option"
                    id={`option-${uid}-${i}`}
                    aria-selected={isSelected ? "true" : "false"}
                    aria-disabled={o.disabled ? "true" : undefined}
                    data-value={o.value}
                    data-filtered-index={i}
                    onMouseDown={(e) => {
                      // prevent input blur on mousedown (the WC's preventDefault)
                      if (o.disabled) return;
                      e.preventDefault();
                      e.stopPropagation();
                      ignoreBlur.current = true;
                      selectFilteredIndex(i);
                    }}
                  >
                    <span>{o.label}</span>
                    <span className="hbd-field__option-check" aria-hidden="true">
                      <CheckIcon />
                    </span>
                  </li>
                );
              })
            )}
          </ul>
        </div>

        {/* Hidden native field — form-submission fallback (parallels the WC's
            ElementInternals.setFormValue). */}
        {name ? (
          <input
            type="hidden"
            name={name}
            value={isMulti ? JSON.stringify(selectedItems) : value}
          />
        ) : null}

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
ComboboxBase.displayName = "Combobox";

const Combobox = ComboboxBase as ComboboxComponent;
Combobox.Option = SelectOption;
Combobox.Group = SelectGroup;

export { Combobox, Select };
