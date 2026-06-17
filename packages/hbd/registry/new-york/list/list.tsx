"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

// Ported from ds/components/hbd-list.js + ds/styles/components/list.css.
// The legacy WC was Light-DOM and did heavy DOM-shuffling to move slotted
// children into a generated <ul>; in React we express the same final markup
// declaratively via a <List> + <List.Item> compound API, so the de-shadowed
// list.css reproduces the exact HBD look 1:1. Tailwind utilities are additive
// only — the token-backed component CSS is the styling.
//
// Behaviour preserved from the WC:
//   • <List> renders <ul class="hbd-list …">; each item is an <li> wrapper.
//   • href item  → <a class="hbd-list__item hbd-list__item--interactive"> in <li>.
//   • selectable item (no href) → <button …--interactive> in <li>.
//   • static item → plain <li class="hbd-list__item">.
//   • hbd:select — fired on click / Enter / Space activation of an interactive
//     item. detail = { index, value, item }. Cancelable → onSelect may return
//     false to veto (calls preventDefault on the originating event).
//   • Clicks inside the trailing/action region do NOT fire select.
//   • Disabled items never fire select; get aria-disabled + tabindex=-1.
//   • Selected interactive items add is-selected + aria-current="page".

const listVariants = cva("hbd-list", {
  variants: {
    size: {
      sm: "hbd-list--sm",
      md: "",
      lg: "hbd-list--lg",
    },
    divided: { true: "hbd-list--divided", false: "" },
    bordered: { true: "hbd-list--bordered", false: "" },
    flush: { true: "hbd-list--flush", false: "" },
  },
  defaultVariants: { size: "md", divided: false, bordered: false, flush: false },
});

// detail payload carried by the legacy hbd:select CustomEvent.
export interface ListSelectDetail {
  index: number;
  value: string;
  item: ListItemProps;
}

interface ListContextValue {
  onItemSelect: (index: number, item: ListItemProps, originalEvent: React.SyntheticEvent) => void;
}

const ListContext = React.createContext<ListContextValue | null>(null);

export interface ListProps
  extends
    Omit<React.HTMLAttributes<HTMLUListElement>, "onSelect">,
    VariantProps<typeof listVariants> {
  /**
   * Fired on click / Enter / Space activation of an interactive item.
   * Cancelable — return `false` to veto the activation (mirrors the WC's
   * cancelable `hbd:select` CustomEvent).
   */
  onSelect?: (detail: ListSelectDetail) => void | boolean;
}

const ListRoot = React.forwardRef<HTMLUListElement, ListProps>(
  ({ className, size, divided, bordered, flush, onSelect, children, ...props }, ref) => {
    const onItemSelect = React.useCallback<ListContextValue["onItemSelect"]>(
      (index, item, originalEvent) => {
        if (item.disabled) return;
        // Mirror the WC's `||` fallback: an absent OR empty `value` falls
        // through to the trimmed primary text, then to "".
        const value =
          item.value || (typeof item.primary === "string" ? item.primary.trim() : "") || "";
        const result = onSelect?.({ index, value, item });
        // Cancelable: a `false` return vetoes the activation.
        if (result === false) originalEvent.preventDefault();
      },
      [onSelect],
    );

    // Stamp a sequential index onto each <List.Item> child, mirroring the
    // WC's `data-list-item-index` ordering used by the select detail.
    let itemIndex = -1;
    const stampedChildren = React.Children.map(children, (child) => {
      if (!React.isValidElement(child) || child.type !== ListItem) return child;
      itemIndex += 1;
      return React.cloneElement(child as React.ReactElement<ListItemProps>, {
        index: itemIndex,
      });
    });

    return (
      <ListContext.Provider value={{ onItemSelect }}>
        <ul
          ref={ref}
          className={cn(listVariants({ size, divided, bordered, flush }), className)}
          {...props}
        >
          {stampedChildren}
        </ul>
      </ListContext.Provider>
    );
  },
);
ListRoot.displayName = "List";

export interface ListItemProps {
  /** Renders the item as an <a>; sets aria-current=page when selected. */
  href?: string;
  /** Renders the item as an activatable <button> when there is no href. */
  selectable?: boolean;
  /** Selected state — adds is-selected + the left action-bar indicator. */
  selected?: boolean;
  /** Disabled — non-interactive, dimmed, removed from the Tab order. */
  disabled?: boolean;
  /** Value carried in the hbd:select detail (falls back to primary text). */
  value?: string;
  /** Leading slot — avatar / icon / thumbnail. */
  leading?: React.ReactNode;
  /** Primary line of content. */
  primary?: React.ReactNode;
  /** Secondary (muted) line of content. */
  secondary?: React.ReactNode;
  /** Trailing slot — badges, timestamps. */
  trailing?: React.ReactNode;
  /** Action slot — hover/focus-revealed controls (e.g. an icon button). */
  action?: React.ReactNode;
  /** Extra class names merged onto the item element. */
  className?: string;
  /** Internal — injected by <List> to mirror the WC's item index. */
  index?: number;
}

const ListItem = React.forwardRef<HTMLElement, ListItemProps>((props, ref) => {
  const {
    href,
    selectable = false,
    selected = false,
    disabled = false,
    leading,
    primary,
    secondary,
    trailing,
    action,
    className,
    index = 0,
  } = props;

  const ctx = React.useContext(ListContext);
  const isInteractive = href != null || selectable;

  const itemClasses = cn(
    "hbd-list__item",
    isInteractive && "hbd-list__item--interactive",
    selected && "hbd-list__item--selected",
    selected && "is-selected",
    disabled && "hbd-list__item--disabled",
    className,
  );

  const hasLeading = leading != null;
  const hasPrimary = primary != null;
  const hasSecondary = secondary != null;
  const hasTrailing = trailing != null;
  const hasAction = action != null;

  const inner = (
    <>
      {hasLeading ? <span className="hbd-list__item-leading">{leading}</span> : null}
      {hasPrimary || hasSecondary ? (
        <span className="hbd-list__item-content">
          {hasPrimary ? <span className="hbd-list__item-primary">{primary}</span> : null}
          {hasSecondary ? <span className="hbd-list__item-secondary">{secondary}</span> : null}
        </span>
      ) : null}
      {hasTrailing || hasAction ? (
        <span className="hbd-list__item-trailing">
          {hasTrailing ? <span>{trailing}</span> : null}
          {hasAction ? <span className="hbd-list__item-action">{action}</span> : null}
        </span>
      ) : null}
    </>
  );

  // Trailing/action clicks must NOT fire the list-level select — they have
  // their own actions (WC: bail when the click path hits .item-trailing).
  const isTrailingTarget = (target: EventTarget | null) =>
    target instanceof Element && target.closest(".hbd-list__item-trailing") != null;

  const handleClick = (e: React.MouseEvent) => {
    if (disabled || isTrailingTarget(e.target)) return;
    ctx?.onItemSelect(index, props, e);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Anchors activate on Enter natively; buttons need Enter + Space.
    if (
      (e.key === "Enter" || e.key === " " || e.key === "Spacebar") &&
      e.currentTarget instanceof HTMLButtonElement
    ) {
      e.preventDefault();
      if (!disabled) ctx?.onItemSelect(index, props, e);
    }
  };

  // href item → <a> inside <li> (keeps outer list semantics correct).
  if (href != null) {
    return (
      <li data-list-item-index={index}>
        <a
          ref={ref as React.Ref<HTMLAnchorElement>}
          className={itemClasses}
          href={href}
          aria-current={selected ? "page" : undefined}
          aria-disabled={disabled || undefined}
          tabIndex={disabled ? -1 : undefined}
          onClick={handleClick}
          onKeyDown={handleKeyDown}
        >
          {inner}
        </a>
      </li>
    );
  }

  // selectable (no href) → <button> inside <li>.
  if (selectable) {
    return (
      <li data-list-item-index={index}>
        <button
          ref={ref as React.Ref<HTMLButtonElement>}
          type="button"
          className={itemClasses}
          aria-disabled={disabled || undefined}
          tabIndex={disabled ? -1 : undefined}
          onClick={handleClick}
          onKeyDown={handleKeyDown}
        >
          {inner}
        </button>
      </li>
    );
  }

  // static item → plain <li>.
  return (
    <li ref={ref as React.Ref<HTMLLIElement>} className={itemClasses} data-list-item-index={index}>
      {inner}
    </li>
  );
});
ListItem.displayName = "List.Item";

type ListComponent = typeof ListRoot & { Item: typeof ListItem };
const List = ListRoot as ListComponent;
List.Item = ListItem;

export { List, ListItem, listVariants };
