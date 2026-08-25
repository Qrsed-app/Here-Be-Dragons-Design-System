"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

// Ported from ds/components/hbd-breadcrumbs.js + ds/styles/components/breadcrumbs.css.
// Light-DOM WAI-ARIA 1.2 breadcrumb trail: <nav> > <ol> > <li>, with a decorative
// "›" separator span (aria-hidden) before every item except the first, and the
// final crumb rendered as a non-link <span aria-current="page">. The legacy
// `truncate` attribute collapses the middle crumbs behind an ellipsis button that
// expands the full path on click (firing hbd:expand). Variants map to the legacy
// .hbd-breadcrumbs* / .is-* classes so the de-shadowed breadcrumbs.css reproduces
// the exact HBD look 1:1. Tailwind utilities are additive only — the token-backed
// component CSS is the styling.

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

// ── Shared item shape (items[] prop API) ──────────────────────────────────
export interface BreadcrumbItem {
  /** Visible crumb label. */
  label: React.ReactNode;
  /** href for the crumb link; omit (or on the final crumb) to render plain text. */
  href?: string;
  /** Force the "current page" (non-link, aria-current=page) rendering. */
  current?: boolean;
}

// ── Context: separator placement + ellipsis collapse bookkeeping ───────────
interface BreadcrumbsContextValue {
  expanded: boolean;
}
const BreadcrumbsContext = React.createContext<BreadcrumbsContextValue>({
  expanded: false,
});

export interface BreadcrumbsProps extends Omit<React.HTMLAttributes<HTMLElement>, "onChange"> {
  /** Accessible label for the surrounding <nav> (defaults to "Breadcrumb"). */
  label?: string;
  /** Associate the <nav> with a visible heading instead of an aria-label. */
  labelledBy?: string;
  /**
   * Collapse the middle crumbs behind an ellipsis once the count exceeds this
   * threshold (keeping the first and last visible). 0/undefined = no collapse.
   * Mirrors the legacy `truncate` attribute.
   */
  truncate?: number;
  /** Controlled expanded state of a truncated trail. */
  expanded?: boolean;
  /** Uncontrolled initial expanded state. */
  defaultExpanded?: boolean;
  /** Fired when the ellipsis is clicked and the full path expands (hbd:expand). */
  onExpand?: () => void;
  /** Controlled expanded-state callback. */
  onExpandedChange?: (expanded: boolean) => void;
  /** Data-driven crumbs; alternative to passing <Breadcrumbs.Item> children. */
  items?: BreadcrumbItem[];
}

const Breadcrumbs = React.forwardRef<HTMLElement, BreadcrumbsProps>(
  (
    {
      className,
      label,
      labelledBy,
      truncate = 0,
      expanded: expandedProp,
      defaultExpanded = false,
      onExpand,
      onExpandedChange,
      items,
      children,
      ...props
    },
    ref,
  ) => {
    const [expanded, setExpanded] = useControllableState<boolean>({
      value: expandedProp,
      defaultValue: defaultExpanded,
      onChange: onExpandedChange,
    });

    const handleExpand = React.useCallback(() => {
      setExpanded(true);
      onExpand?.();
    }, [setExpanded, onExpand]);

    // Resolve the crumb nodes: either from items[] or from compound children.
    const crumbs: React.ReactElement[] = React.useMemo(() => {
      if (items && items.length > 0) {
        return items.map((item, i) => (
          <BreadcrumbsItem
            key={i}
            href={item.href}
            current={item.current ?? i === items.length - 1}
          >
            {item.label}
          </BreadcrumbsItem>
        ));
      }
      return React.Children.toArray(children).filter(React.isValidElement) as React.ReactElement[];
    }, [items, children]);

    const total = crumbs.length;
    const shouldTruncate = truncate > 0 && total > truncate && !expanded;

    // Hidden middle range (everything except first + last) when truncating.
    const hiddenStart = 1;
    const hiddenEnd = total - 1;

    const rendered: React.ReactNode[] = [];
    crumbs.forEach((crumb, i) => {
      const isFirst = i === 0;
      const isLast = i === total - 1;
      const hidden = shouldTruncate && i >= hiddenStart && i < hiddenEnd;

      rendered.push(
        React.cloneElement(crumb, {
          key: `crumb-${i}`,
          // Separator precedes every crumb except the first.

          ["data-first" as any]: isFirst || undefined,
          showSeparator: !isFirst,
          hidden,
          // Default the final crumb to current unless explicitly overridden.
          current: (crumb.props as BreadcrumbsItemProps).current ?? isLast,
        } as Partial<BreadcrumbsItemProps>),
      );

      // Inject the ellipsis button right after the first item.
      if (shouldTruncate && isFirst) {
        rendered.push(
          <li key="ellipsis" className="hbd-breadcrumbs__item hbd-breadcrumbs__item--ellipsis">
            <span className="hbd-breadcrumbs__separator" aria-hidden="true">
              ›
            </span>
            <button
              type="button"
              className="hbd-breadcrumbs__ellipsis"
              aria-label="Show full path"
              onClick={handleExpand}
            >
              …
            </button>
          </li>,
        );
      }
    });

    return (
      <BreadcrumbsContext.Provider value={{ expanded }}>
        <nav
          ref={ref}
          className={cn("hbd-breadcrumbs", expanded && "hbd-breadcrumbs--expanded", className)}
          aria-label={labelledBy ? undefined : (label ?? "Breadcrumb")}
          aria-labelledby={labelledBy}
          {...props}
        >
          <ol className="hbd-breadcrumbs__list">{rendered}</ol>
        </nav>
      </BreadcrumbsContext.Provider>
    );
  },
);
Breadcrumbs.displayName = "Breadcrumbs";

// ── Breadcrumbs.Item ───────────────────────────────────────────────────────
export interface BreadcrumbsItemProps extends Omit<
  React.LiHTMLAttributes<HTMLLIElement>,
  "onChange"
> {
  /** Link target; when omitted the crumb renders as plain text. */
  href?: string;
  /** Render as the current page (non-link <span aria-current="page">). */
  current?: boolean;
  /** Render the leading "›" separator (set automatically by Breadcrumbs). */
  showSeparator?: boolean;
  /** Hide this crumb (collapsed by truncation). */
  hidden?: boolean;
  /** Extra props forwarded to the inner <a> when a link is rendered. */
  linkProps?: React.AnchorHTMLAttributes<HTMLAnchorElement>;
}

const BreadcrumbsItem = React.forwardRef<HTMLLIElement, BreadcrumbsItemProps>(
  (
    {
      className,
      href,
      current = false,
      showSeparator = false,
      hidden = false,
      linkProps,
      children,
      ...props
    },
    ref,
  ) => {
    return (
      <li
        ref={ref}
        className={cn(
          "hbd-breadcrumbs__item",
          hidden && "hbd-breadcrumbs__item--hidden",
          className,
        )}
        {...props}
      >
        {showSeparator ? (
          <span className="hbd-breadcrumbs__separator" aria-hidden="true">
            ›
          </span>
        ) : null}
        {current || !href ? (
          <span className="hbd-breadcrumbs__current" aria-current="page">
            {children}
          </span>
        ) : (
          <a className="hbd-breadcrumbs__link" href={href} {...linkProps}>
            {children}
          </a>
        )}
      </li>
    );
  },
);
BreadcrumbsItem.displayName = "Breadcrumbs.Item";

type BreadcrumbsComponent = typeof Breadcrumbs & {
  Item: typeof BreadcrumbsItem;
};
const BreadcrumbsRoot = Breadcrumbs as BreadcrumbsComponent;
BreadcrumbsRoot.Item = BreadcrumbsItem;

export { BreadcrumbsRoot as Breadcrumbs, BreadcrumbsItem };
export default BreadcrumbsRoot;
