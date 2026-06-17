"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/registry/new-york/button/button";

// Ported from ds/components/hbd-split-button.js + the .hbd-split-button* rules
// extracted out of the legacy ds/styles/components/button.css into
// styles/components/split-button.css.
//
// Two HBD buttons joined visually: a wide PRIMARY ACTION on the left and a
// narrow CHEVRON TRIGGER on the right. Clicking the action fires onAction;
// clicking the chevron opens a dropdown menu of alternative actions
// (SplitButton.Item children or an `items` prop). Selecting a menu item fires
// onSelect and closes the panel.
//
// The legacy CSS couples the panel as an absolutely-positioned descendant of
// the wrapper (so `.hbd-split-button--open .hbd-split-button__panel` drives the
// opacity/transform transition AND the chevron rotation). To reproduce that
// look + motion 1:1 we hand-port the overlay (controlled open + roving keyboard
// nav + outside-click) instead of portalling the menu out. Items keep the
// legacy .hbd-field__option chrome (from input.css via the button/dropdown
// deps). Tailwind utilities are additive only — split-button.css is the styling.

// ── useControllableState (inline, controlled-first w/ uncontrolled fallback)
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

export type SplitButtonVariant = "default" | "primary" | "gold";
export type SplitButtonSize = "sm" | "md" | "lg";

// detail payload carried by the legacy hbd:select event.
export interface SplitButtonSelectDetail {
  value: string;
  label: string;
}

// detail payload carried by the legacy hbd:action event.
export interface SplitButtonActionDetail {
  label: string;
}

// Data shape for the `items` prop (alternative to SplitButton.Item children).
export interface SplitButtonItemData {
  value: string;
  label: string;
  disabled?: boolean;
}

interface NormalizedItem {
  value: string;
  label: string;
  disabled: boolean;
}

let uidCounter = 0;

const ChevronIcon = () => (
  <span className="hbd-split-button__chevron" aria-hidden="true">
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <path
        d="M3 4.5l3 3 3-3"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  </span>
);

export interface SplitButtonProps {
  /** Visible label on the wide primary action half. */
  label?: string;
  /** Visual variant — shared by both halves (mirrors the WC `variant` attr). */
  variant?: SplitButtonVariant;
  /** Size — shared by both halves (mirrors the WC `size` attr). */
  size?: SplitButtonSize;
  /** Disables both halves. */
  disabled?: boolean;
  /** Controlled open state of the dropdown panel. */
  open?: boolean;
  /** Uncontrolled initial open state. */
  defaultOpen?: boolean;
  /** Fired when the panel opens/closes (maps hbd:open / hbd:close). */
  onOpenChange?: (open: boolean) => void;
  /** Fired when the primary action half is clicked (maps hbd:action). */
  onAction?: (detail: SplitButtonActionDetail) => void;
  /** Fired when a menu item is chosen (maps hbd:select). */
  onSelect?: (detail: SplitButtonSelectDetail) => void;
  /** Menu items as data (alternative to SplitButton.Item children). */
  items?: SplitButtonItemData[];
  /** Menu items as <SplitButton.Item> children. */
  children?: React.ReactNode;
  className?: string;
  /** Extra props forwarded to the wrapper div. */
  id?: string;
}

// ── SplitButton.Item — data-carrier sub-component (renders nothing itself).
export interface SplitButtonItemProps {
  value: string;
  /** Display label; falls back to children text. */
  label?: string;
  disabled?: boolean;
  children?: React.ReactNode;
}
function SplitButtonItem(_props: SplitButtonItemProps): React.ReactElement | null {
  return null;
}
SplitButtonItem.displayName = "SplitButton.Item";

function normalizeChildren(children: React.ReactNode): NormalizedItem[] {
  const out: NormalizedItem[] = [];
  React.Children.forEach(children, (child) => {
    if (!React.isValidElement(child)) return;
    const t = child.type as { displayName?: string };
    if (t?.displayName !== "SplitButton.Item") return;
    const p = child.props as SplitButtonItemProps;
    const text =
      p.label != null && p.label !== ""
        ? p.label
        : typeof p.children === "string"
          ? p.children
          : String(p.value);
    out.push({
      value: p.value,
      label: text,
      disabled: Boolean(p.disabled),
    });
  });
  return out;
}

const SplitButtonRoot = React.forwardRef<HTMLDivElement, SplitButtonProps>(
  (
    {
      label = "",
      variant = "primary",
      size = "md",
      disabled = false,
      open: openProp,
      defaultOpen = false,
      onOpenChange,
      onAction,
      onSelect,
      items,
      children,
      className,
      id,
    },
    forwardedRef,
  ) => {
    const reactId = React.useId();
    const uid = React.useMemo(() => `hbd-split-button-${++uidCounter}`, []);

    const options: NormalizedItem[] = React.useMemo(() => {
      if (items && items.length > 0) {
        return items.map((o) => ({
          value: o.value,
          label: o.label,
          disabled: Boolean(o.disabled),
        }));
      }
      return normalizeChildren(children);
    }, [items, children]);

    const [isOpen, setIsOpen] = useControllableState<boolean>({
      value: openProp,
      defaultValue: defaultOpen,
      onChange: onOpenChange,
    });

    const [focusedIndex, setFocusedIndex] = React.useState(-1);

    const wrapperRef = React.useRef<HTMLDivElement>(null);
    React.useImperativeHandle(forwardedRef, () => wrapperRef.current as HTMLDivElement);
    const triggerRef = React.useRef<HTMLButtonElement>(null);
    const panelRef = React.useRef<HTMLUListElement>(null);
    const itemRefs = React.useRef<Array<HTMLLIElement | null>>([]);

    // ── Enabled-index helpers (mirror the WC).
    const firstEnabled = React.useCallback(() => options.findIndex((o) => !o.disabled), [options]);
    const lastEnabled = React.useCallback(() => {
      for (let i = options.length - 1; i >= 0; i--) {
        if (!options[i].disabled) return i;
      }
      return -1;
    }, [options]);
    const nextEnabled = React.useCallback(
      (from: number, dir: 1 | -1) => {
        const n = options.length;
        if (n === 0) return -1;
        let i = from;
        for (let s = 0; s < n; s++) {
          i = (i + dir + n) % n;
          if (!options[i].disabled) return i;
        }
        return -1;
      },
      [options],
    );

    const openPanel = React.useCallback(() => {
      if (isOpen || disabled) return;
      setFocusedIndex(firstEnabled());
      setIsOpen(true);
    }, [isOpen, disabled, firstEnabled, setIsOpen]);

    const closePanel = React.useCallback(
      (returnFocus = true) => {
        if (!isOpen) return;
        setFocusedIndex(-1);
        setIsOpen(false);
        if (returnFocus) {
          requestAnimationFrame(() => triggerRef.current?.focus({ preventScroll: true }));
        }
      },
      [isOpen, setIsOpen],
    );

    // Move roving focus to the focused item whenever it (or open) changes.
    React.useEffect(() => {
      if (!isOpen || focusedIndex < 0) return;
      const el = itemRefs.current[focusedIndex];
      if (el) {
        el.focus({ preventScroll: false });
        el.scrollIntoView({ block: "nearest" });
      }
    }, [isOpen, focusedIndex]);

    // Outside-pointer closes the panel (mirrors the WC's capture-phase
    // document pointerdown listener that checks composedPath includes host).
    React.useEffect(() => {
      if (!isOpen) return;
      const onDocPointer = (e: PointerEvent) => {
        const wrap = wrapperRef.current;
        if (wrap && !wrap.contains(e.target as Node)) closePanel(false);
      };
      document.addEventListener("pointerdown", onDocPointer, true);
      return () => document.removeEventListener("pointerdown", onDocPointer, true);
    }, [isOpen, closePanel]);

    const selectByIndex = (i: number) => {
      const o = options[i];
      if (!o || o.disabled) return;
      onSelect?.({ value: o.value, label: o.label });
      closePanel(true);
    };

    const handleActionClick = () => {
      if (disabled) return;
      onAction?.({ label });
    };

    const handleTriggerClick = () => {
      if (disabled) return;
      if (isOpen) closePanel(true);
      else openPanel();
    };

    const moveFocus = (dir: 1 | -1) => {
      const from = focusedIndex >= 0 ? focusedIndex : -1;
      const next = nextEnabled(from, dir);
      if (next < 0) return;
      setFocusedIndex(next);
    };

    const handlePanelKeyDown = (e: React.KeyboardEvent<HTMLUListElement>) => {
      switch (e.key) {
        case "Escape":
          e.preventDefault();
          closePanel(true);
          return;
        case "Tab":
          // Let Tab move focus naturally; just close the panel.
          closePanel(false);
          return;
        case "Enter":
        case " ":
        case "Spacebar":
          e.preventDefault();
          if (focusedIndex >= 0) selectByIndex(focusedIndex);
          return;
        case "ArrowDown":
          e.preventDefault();
          moveFocus(1);
          return;
        case "ArrowUp":
          e.preventDefault();
          moveFocus(-1);
          return;
        case "Home":
          e.preventDefault();
          setFocusedIndex(firstEnabled());
          return;
        case "End":
          e.preventDefault();
          setFocusedIndex(lastEnabled());
          return;
        default:
          return;
      }
    };

    const panelId = `panel-${uid}-${reactId}`;

    return (
      <div
        ref={wrapperRef}
        id={id}
        className={cn(
          "hbd-split-button",
          `hbd-split-button--variant-${variant}`,
          isOpen && "hbd-split-button--open",
          disabled && "hbd-split-button--disabled",
          className,
        )}
      >
        <Button
          className="hbd-split-button__action"
          variant={variant}
          size={size}
          disabled={disabled}
          onClick={handleActionClick}
        >
          {label}
        </Button>

        <Button
          ref={triggerRef}
          className="hbd-split-button__trigger"
          variant={variant}
          size={size}
          disabled={disabled}
          aria-haspopup="menu"
          aria-expanded={isOpen}
          aria-label={`More ${label || "options"} options`}
          aria-controls={panelId}
          onClick={handleTriggerClick}
        >
          <ChevronIcon />
        </Button>

        <ul
          ref={panelRef}
          className="hbd-split-button__panel"
          id={panelId}
          role="menu"
          aria-label={`${label || "Options"} options`}
          tabIndex={-1}
          onKeyDown={handlePanelKeyDown}
        >
          {options.map((o, i) => {
            const isFocused = i === focusedIndex;
            return (
              <li
                key={`${o.value}-${i}`}
                ref={(el) => {
                  itemRefs.current[i] = el;
                }}
                className={cn(
                  "hbd-field__option",
                  o.disabled && "is-disabled",
                  isFocused && "is-focused",
                )}
                role="menuitem"
                id={`item-${uid}-${i}`}
                tabIndex={isFocused ? 0 : -1}
                data-index={i}
                data-value={o.value}
                aria-disabled={o.disabled || undefined}
                onClick={(e) => {
                  if (o.disabled) return;
                  e.stopPropagation();
                  selectByIndex(i);
                }}
              >
                <span>{o.label}</span>
              </li>
            );
          })}
        </ul>
      </div>
    );
  },
);
SplitButtonRoot.displayName = "SplitButton";

type SplitButtonComponent = typeof SplitButtonRoot & {
  Item: typeof SplitButtonItem;
};

const SplitButton = SplitButtonRoot as SplitButtonComponent;
SplitButton.Item = SplitButtonItem;

export { SplitButton, SplitButtonItem };
