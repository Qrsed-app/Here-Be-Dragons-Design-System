import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

// Ported 1:1 from ds/components/hbd-chip.js + the chip section of
// ds/styles/components/badge.css (light DOM — no Shadow DOM).
//
// A chip is a labelled pill with optional leading icon, optional remove
// (✕) button, and optional selectable/toggle behaviour.
//
//   • Static chip      → <span class="hbd-chip">…</span>
//   • Removable chip   → <span class="hbd-chip"> + inner ✕ <button>
//   • Selectable chip  → <button class="hbd-chip hbd-chip--selectable"
//                                aria-pressed="…">
//
// Variants map to the legacy .hbd-chip--{variant}/--{size}/--outline and
// .is-selected classes so the de-shadowed CSS reproduces the HBD look 1:1.
//
// Events (cancelable — return false to veto, mirroring the WC's
// CustomEvent preventDefault contract):
//   onToggle({ selected, label }) → false rolls the toggle back.
//   onRemove({ label })           → false prevents removal.

const chipVariants = cva("hbd-chip", {
  variants: {
    variant: {
      primary: "hbd-chip--primary",
      success: "hbd-chip--success",
      warning: "hbd-chip--warning",
      error: "hbd-chip--error",
      neutral: "hbd-chip--neutral",
    },
    size: {
      sm: "hbd-chip--sm",
      md: "",
      lg: "hbd-chip--lg",
    },
    outline: { true: "hbd-chip--outline", false: "" },
    selectable: { true: "hbd-chip--selectable", false: "" },
  },
  defaultVariants: {
    variant: "neutral",
    size: "md",
    outline: false,
    selectable: false,
  },
});

export interface ChipToggleDetail {
  selected: boolean;
  label: string;
}

export interface ChipRemoveDetail {
  label: string;
}

export interface ChipProps
  extends Omit<React.HTMLAttributes<HTMLElement>, "onToggle">, VariantProps<typeof chipVariants> {
  /** Chip text. Falls back to `children` when omitted. */
  label?: string;
  /** Renders the remove (✕) button. */
  removable?: boolean;
  /** Renders the chip as a toggle <button> with aria-pressed. */
  selectable?: boolean;
  /** Selected state on selectable chips (controlled). */
  selected?: boolean;
  /** Leading icon node (rendered inside .hbd-chip__icon, aria-hidden). */
  icon?: React.ReactNode;
  /**
   * Fires before a selectable chip toggles. Receives the next detail
   * { selected, label }. Return false to veto (rolls back).
   */
  onToggle?: (detail: ChipToggleDetail) => boolean | void;
  /**
   * Fires when the remove button is activated. Receives { label }.
   * Return false to prevent removal.
   */
  onRemove?: (detail: ChipRemoveDetail) => boolean | void;
}

const RemoveIcon = () => (
  <svg
    viewBox="0 0 16 16"
    width="16"
    height="16"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    aria-hidden="true"
  >
    <line x1="4" y1="4" x2="12" y2="12" />
    <line x1="12" y1="4" x2="4" y2="12" />
  </svg>
);

const Chip = React.forwardRef<HTMLElement, ChipProps>(
  (
    {
      className,
      variant = "neutral",
      size = "md",
      outline = false,
      selectable = false,
      selected = false,
      removable = false,
      label,
      icon,
      children,
      onToggle,
      onRemove,
      onClick,
      onKeyDown,
      ...props
    },
    ref,
  ) => {
    // Accessible label: explicit `label`, else the text children.
    const labelText = label ?? (typeof children === "string" ? children : "");

    const classes = cn(
      chipVariants({ variant, size, outline, selectable }),
      selectable && selected && "is-selected",
      className,
    );

    const iconNode = icon ? (
      <span className="hbd-chip__icon" aria-hidden="true">
        {icon}
      </span>
    ) : null;

    const labelNode = <span className="hbd-chip__label">{label ?? children}</span>;

    const handleRemove = (e: React.MouseEvent<HTMLButtonElement>) => {
      // Match the WC: the remove click never bubbles into a chip toggle.
      e.preventDefault();
      e.stopPropagation();
      onRemove?.({ label: labelText });
    };

    const removeNode = removable ? (
      <button
        className="hbd-chip__remove"
        type="button"
        aria-label={`Remove ${labelText}`}
        onClick={handleRemove}
      >
        <RemoveIcon />
      </button>
    ) : null;

    const inner = (
      <>
        {iconNode}
        {labelNode}
        {removeNode}
      </>
    );

    if (selectable) {
      const toggle = () => {
        const next = !selected;
        // Cancelable contract: this chip is controlled, so the parent
        // owns `selected`. onToggle is the signal to flip it; the parent
        // vetoes simply by not updating `selected` (mirrors the WC's
        // preventDefault rolling state back). The remove (✕) button stops
        // propagation, so its click never reaches this toggle.
        onToggle?.({ selected: next, label: labelText });
      };

      const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        onClick?.(e as unknown as React.MouseEvent<HTMLElement>);
        if (e.defaultPrevented) return;
        toggle();
      };

      // The host is a real <button>, so Enter/Space already synthesise a
      // click → handleClick → toggle. We must NOT toggle again here or the
      // chip flips twice per keypress. Just forward the keydown.
      const handleKeyDown = onKeyDown
        ? (e: React.KeyboardEvent<HTMLButtonElement>) =>
            onKeyDown(e as unknown as React.KeyboardEvent<HTMLElement>)
        : undefined;

      return (
        <button
          ref={ref as React.Ref<HTMLButtonElement>}
          type="button"
          className={classes}
          aria-pressed={selected}
          onClick={handleClick}
          onKeyDown={handleKeyDown}
          {...(props as React.ButtonHTMLAttributes<HTMLButtonElement>)}
        >
          {inner}
        </button>
      );
    }

    return (
      <span
        ref={ref as React.Ref<HTMLSpanElement>}
        className={classes}
        onClick={onClick as React.MouseEventHandler<HTMLSpanElement>}
        onKeyDown={onKeyDown as React.KeyboardEventHandler<HTMLSpanElement>}
        {...(props as React.HTMLAttributes<HTMLSpanElement>)}
      >
        {inner}
      </span>
    );
  },
);
Chip.displayName = "Chip";

export { Chip, chipVariants };
