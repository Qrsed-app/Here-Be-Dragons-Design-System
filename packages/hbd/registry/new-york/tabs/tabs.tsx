"use client";

import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cn } from "@/lib/utils";

// Ported from ds/components/hbd-tabs.js + ds/styles/components/tabs.css.
// The legacy WC was a Light-DOM custom element that read <hbd-tab> /
// <hbd-tab-panel> data-carrier children and rendered a role="tablist" with
// roving tabindex, an active "ribbon" indicator (the .hbd-tabs__tab::before
// strip driven by --hbd-tabs-indicator-*), horizontal/vertical orientation,
// a lazy/eager panel mode, and an optional scrollable overflow with JS
// scroll buttons.
//
// Radix Tabs reproduces the exact selection + keyboard + ARIA model
// (role=tablist/tab/tabpanel, roving tabindex, arrows follow orientation,
// Home/End, aria-selected/controls/labelledby, lazy unmount of inactive
// content). We re-apply the legacy .hbd-tabs* BEM classes to Root / List /
// Trigger / Content (className + asChild) so the de-shadowed tabs.css renders
// the HBD look 1:1, and we hand-port ONLY the bits Radix doesn't cover:
//   - the .hbd-tabs__list-wrap positioning context,
//   - the scroll-prev / scroll-next buttons + their visibility + scroll-into-
//     view behaviour (the WC's scrollable variant),
//   - eager mode via Radix forceMount,
//   - bridging Radix data-state="active" onto the legacy .is-active class.
//
// Controlled-first: value + onValueChange (legacy `active` attr + hbd:change),
// with defaultValue uncontrolled fallback. onValueChange receives the legacy
// hbd:change detail shape — { value }.

// ── useControllableState ─────────────────────────────────────────────
function useControllableState<T>(
  controlled: T | undefined,
  defaultValue: T,
  onChange?: (value: T) => void,
): [T, (value: T) => void] {
  const isControlled = controlled !== undefined;
  const [uncontrolled, setUncontrolled] = React.useState<T>(defaultValue);
  const value = isControlled ? (controlled as T) : uncontrolled;

  const setValue = React.useCallback(
    (next: T) => {
      if (!isControlled) setUncontrolled(next);
      onChange?.(next);
    },
    [isControlled, onChange],
  );

  return [value, setValue];
}

type Orientation = "horizontal" | "vertical";

interface TabsContextValue {
  orientation: Orientation;
  scrollable: boolean;
  mode: "lazy" | "eager";
  label?: string;
  /** Currently-active tab value — drives scroll-into-view in the list. */
  activeValue: string;
  listRef: React.RefObject<HTMLDivElement | null>;
}
const TabsContext = React.createContext<TabsContextValue>({
  orientation: "horizontal",
  scrollable: false,
  mode: "lazy",
  activeValue: "",
  listRef: { current: null },
});

// ── hbd:change detail shape ──────────────────────────────────────────
export interface TabsChangeDetail {
  value: string;
}

// ── Tabs (Root) ──────────────────────────────────────────────────────
export interface TabsProps extends Omit<
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Root>,
  "value" | "defaultValue" | "onValueChange" | "orientation" | "dir"
> {
  /** Controlled active tab value (legacy `active` attribute). */
  value?: string;
  /** Uncontrolled initial active tab value. */
  defaultValue?: string;
  /** Fires with { value } when the active tab changes (legacy hbd:change). */
  onValueChange?: (detail: TabsChangeDetail) => void;
  /** Layout orientation. Vertical puts the tab column to the left of content. */
  orientation?: Orientation;
  /**
   * Horizontal/vertical tabs that overflow with JS scroll buttons. Accepts
   * the historical variant="scrollable" too (treated as horizontal + scrollable).
   */
  scrollable?: boolean;
  /**
   * lazy (default) keeps only the active panel mounted; eager mounts all
   * panels (Radix forceMount) and toggles visibility via CSS.
   */
  mode?: "lazy" | "eager";
  /** Accessible label for the tablist (sets aria-label on the list). */
  label?: string;
}

const Tabs = React.forwardRef<React.ElementRef<typeof TabsPrimitive.Root>, TabsProps>(
  (
    {
      className,
      value,
      defaultValue,
      onValueChange,
      orientation = "horizontal",
      scrollable = false,
      mode = "lazy",
      label,
      children,
      ...props
    },
    ref,
  ) => {
    const [active, setActive] = useControllableState<string>(value, defaultValue ?? "", (v) =>
      onValueChange?.({ value: v }),
    );

    const listRef = React.useRef<HTMLDivElement | null>(null);

    const ctx = React.useMemo<TabsContextValue>(
      () => ({ orientation, scrollable, mode, label, activeValue: active, listRef }),
      [orientation, scrollable, mode, label, active],
    );

    return (
      <TabsContext.Provider value={ctx}>
        <TabsPrimitive.Root
          ref={ref}
          // Empty string is not a valid Radix value; pass undefined so Radix
          // picks the first enabled tab (mirrors the WC's "first non-disabled"
          // default resolution).
          value={active === "" ? undefined : active}
          onValueChange={(next) => setActive(next)}
          orientation={orientation}
          className={cn(
            "hbd-tabs",
            orientation === "vertical" ? "hbd-tabs--vertical" : "hbd-tabs--horizontal",
            scrollable && "hbd-tabs--scrollable",
            className,
          )}
          {...props}
        >
          {children}
        </TabsPrimitive.Root>
      </TabsContext.Provider>
    );
  },
);
Tabs.displayName = "Tabs";

// ── TabsList ─────────────────────────────────────────────────────────
// Wraps Radix Tabs.List in the .hbd-tabs__list-wrap positioning context and
// renders the scroll-prev/next buttons + their visibility logic when the
// owning Tabs is scrollable. Radix List itself carries .hbd-tabs__list and
// role="tablist" + aria-orientation.
export interface TabsListProps extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.List> {
  /** Accessible label for the tablist (overrides the Tabs `label`). */
  label?: string;
}

const ScrollPrevIcon = ({ vertical }: { vertical: boolean }) => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
    {vertical ? (
      <path
        d="M3 9l4-4 4 4"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ) : (
      <path
        d="M9 3L5 7l4 4"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    )}
  </svg>
);

const ScrollNextIcon = ({ vertical }: { vertical: boolean }) => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
    {vertical ? (
      <path
        d="M3 5l4 4 4-4"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ) : (
      <path
        d="M5 3l4 4-4 4"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    )}
  </svg>
);

const TabsList = React.forwardRef<React.ElementRef<typeof TabsPrimitive.List>, TabsListProps>(
  ({ className, label, children, ...props }, ref) => {
    const {
      orientation,
      scrollable,
      listRef,
      label: ctxLabel,
      activeValue,
    } = React.useContext(TabsContext);
    const isVertical = orientation === "vertical";
    const resolvedLabel = label ?? ctxLabel;

    // Merge the forwarded ref with the context listRef (used by scroll logic).
    const setListRef = React.useCallback(
      (node: HTMLDivElement | null) => {
        (listRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
        if (typeof ref === "function") ref(node);
        else if (ref) (ref as React.MutableRefObject<typeof node>).current = node;
      },
      [ref, listRef],
    );

    const [prevVisible, setPrevVisible] = React.useState(false);
    const [nextVisible, setNextVisible] = React.useState(false);

    // Mirrors the WC's _updateScrollVisibility: show each arrow only when the
    // list actually overflows in that direction.
    const updateScrollVisibility = React.useCallback(() => {
      const list = listRef.current;
      if (!list) return;
      if (isVertical) {
        const max = list.scrollHeight - list.clientHeight;
        const y = list.scrollTop;
        setPrevVisible(y > 1);
        setNextVisible(y < max - 1);
      } else {
        const max = list.scrollWidth - list.clientWidth;
        const x = list.scrollLeft;
        setPrevVisible(x > 1);
        setNextVisible(x < max - 1);
      }
    }, [isVertical, listRef]);

    React.useEffect(() => {
      if (!scrollable) return;
      updateScrollVisibility();
      const onResize = () => updateScrollVisibility();
      window.addEventListener("resize", onResize);
      return () => window.removeEventListener("resize", onResize);
    }, [scrollable, updateScrollVisibility]);

    // Mirrors the WC's _scrollActiveIntoView: when the active tab changes, nudge
    // it into the visible band of the (overflowing) list. Radix moves DOM focus
    // to the active trigger so the browser may already scroll it; this smooth
    // pass matches the WC's behaviour 1:1 on both axes.
    React.useEffect(() => {
      if (!scrollable) return;
      const list = listRef.current;
      if (!list) return;
      const tab = list.querySelector<HTMLElement>(
        `.hbd-tabs__tab[data-value="${CSS.escape(activeValue)}"]`,
      );
      if (!tab) return;
      const tRect = tab.getBoundingClientRect();
      const lRect = list.getBoundingClientRect();
      if (isVertical) {
        if (tRect.top < lRect.top) {
          list.scrollBy({ top: tRect.top - lRect.top, behavior: "smooth" });
        } else if (tRect.bottom > lRect.bottom) {
          list.scrollBy({ top: tRect.bottom - lRect.bottom, behavior: "smooth" });
        }
      } else {
        if (tRect.left < lRect.left) {
          list.scrollBy({ left: tRect.left - lRect.left, behavior: "smooth" });
        } else if (tRect.right > lRect.right) {
          list.scrollBy({ left: tRect.right - lRect.right, behavior: "smooth" });
        }
      }
      // Keep the arrow visibility in sync after the programmatic scroll settles.
      updateScrollVisibility();
    }, [scrollable, activeValue, isVertical, listRef, updateScrollVisibility]);

    // Mirrors the WC's _scrollBy: step by one tab's main-axis size.
    const scrollBy = (dir: 1 | -1) => {
      const list = listRef.current;
      if (!list) return;
      const tabs = list.querySelectorAll<HTMLElement>(".hbd-tabs__tab");
      if (tabs.length === 0) return;
      const probe = tabs[Math.floor(tabs.length / 2)];
      if (isVertical) {
        const step = (probe.offsetHeight || 40) * dir;
        list.scrollBy({ top: step, behavior: "smooth" });
      } else {
        const step = (probe.offsetWidth || 120) * dir;
        list.scrollBy({ left: step, behavior: "smooth" });
      }
    };

    const listEl = (
      <TabsPrimitive.List
        ref={setListRef}
        aria-label={resolvedLabel || undefined}
        className={cn("hbd-tabs__list", className)}
        onScroll={scrollable ? updateScrollVisibility : undefined}
        {...props}
      >
        {children}
      </TabsPrimitive.List>
    );

    if (!scrollable) {
      // Still wrap so the structure (and any future scroll toggle) is stable.
      return <div className="hbd-tabs__list-wrap">{listEl}</div>;
    }

    const prevLabel = isVertical ? "Scroll tabs up" : "Scroll tabs left";
    const nextLabel = isVertical ? "Scroll tabs down" : "Scroll tabs right";

    return (
      <div className="hbd-tabs__list-wrap">
        <button
          type="button"
          className={cn("hbd-tabs__scroll-prev", prevVisible && "is-visible")}
          aria-label={prevLabel}
          tabIndex={-1}
          onClick={() => scrollBy(-1)}
        >
          <ScrollPrevIcon vertical={isVertical} />
        </button>
        {listEl}
        <button
          type="button"
          className={cn("hbd-tabs__scroll-next", nextVisible && "is-visible")}
          aria-label={nextLabel}
          tabIndex={-1}
          onClick={() => scrollBy(1)}
        >
          <ScrollNextIcon vertical={isVertical} />
        </button>
      </div>
    );
  },
);
TabsList.displayName = "TabsList";

// ── TabsTrigger (legacy <hbd-tab>) ───────────────────────────────────
// Radix Trigger carries role="tab", aria-selected, aria-controls, roving
// tabindex, and data-state="active"/"inactive". We re-apply .hbd-tabs__tab,
// bridge data-state -> .is-active, and render the optional count badge.
export interface TabsTriggerProps extends Omit<
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>,
  "value"
> {
  /** The value identifying this tab (matches a TabsContent value). */
  value: string;
  /** Optional count badge rendered after the label. */
  badge?: string | number;
}

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  TabsTriggerProps
>(({ className, value, badge, disabled, children, ...props }, ref) => {
  // Radix Trigger owns role="tab", aria-selected, aria-controls, roving
  // tabindex and data-state="active"/"inactive". We render it asChild so a
  // <TriggerButton> can read that injected data-state / data-disabled and map
  // it onto the legacy .is-active / .is-disabled classes the de-shadowed CSS
  // keys off — leaving the stylesheet untouched.
  return (
    <TabsPrimitive.Trigger ref={ref} value={value} disabled={disabled} asChild {...props}>
      <TriggerButton data-value={value} className={className} badge={badge}>
        {children}
      </TriggerButton>
    </TabsPrimitive.Trigger>
  );
});
TabsTrigger.displayName = "TabsTrigger";

interface TriggerButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  "data-state"?: "active" | "inactive";
  "data-disabled"?: string;
  badge?: string | number;
}
const TriggerButton = React.forwardRef<HTMLButtonElement, TriggerButtonProps>(
  (
    {
      className,
      badge,
      children,
      "data-state": dataState,
      "data-disabled": dataDisabled,
      disabled,
      ...props
    },
    ref,
  ) => {
    const isActive = dataState === "active";
    const isDisabled = dataDisabled !== undefined || disabled === true;
    return (
      <button
        ref={ref}
        type="button"
        data-state={dataState}
        data-disabled={dataDisabled}
        disabled={disabled}
        className={cn(
          "hbd-tabs__tab",
          isActive && "is-active",
          isDisabled && "is-disabled",
          className,
        )}
        {...props}
      >
        {children}
        {badge != null && badge !== "" ? (
          <span className="hbd-tabs__tab-badge" aria-label={`${badge} items`}>
            {badge}
          </span>
        ) : null}
      </button>
    );
  },
);
TriggerButton.displayName = "TriggerButton";

// ── TabsContent (legacy <hbd-tab-panel>) ─────────────────────────────
// Radix Content carries role="tabpanel", aria-labelledby, tabindex=0, and
// unmounts when inactive (lazy). forceMount keeps it mounted (eager) while
// Radix sets hidden + we toggle .is-active for the CSS display swap.
export interface TabsContentProps extends React.ComponentPropsWithoutRef<
  typeof TabsPrimitive.Content
> {
  value: string;
}

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  TabsContentProps
>(({ className, value, children, ...props }, ref) => {
  const { mode } = React.useContext(TabsContext);
  return (
    <TabsContentInner
      ref={ref}
      value={value}
      forceMount={mode === "eager" ? true : undefined}
      className={className}
      {...props}
    >
      {children}
    </TabsContentInner>
  );
});
TabsContent.displayName = "TabsContent";

// Inner wrapper that reads Radix's injected data-state to add .is-active so
// the de-shadowed CSS's `.hbd-tabs__panel.is-active { display:block }` works
// in eager mode (forceMount, where the inactive panel stays mounted) — and
// harmlessly in lazy mode too. Rendered asChild so the <PanelDiv> sees
// data-state / hidden and maps them onto the legacy class.
const TabsContentInner = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, children, ...props }, ref) => {
  return (
    <TabsPrimitive.Content ref={ref} asChild {...props}>
      <PanelDiv className={className}>{children}</PanelDiv>
    </TabsPrimitive.Content>
  );
});
TabsContentInner.displayName = "TabsContentInner";

interface PanelDivProps extends React.HTMLAttributes<HTMLDivElement> {
  "data-state"?: "active" | "inactive";
}
const PanelDiv = React.forwardRef<HTMLDivElement, PanelDivProps>(
  ({ className, children, "data-state": dataState, ...props }, ref) => (
    <div
      ref={ref}
      data-state={dataState}
      className={cn("hbd-tabs__panel", dataState === "active" && "is-active", className)}
      {...props}
    >
      {children}
    </div>
  ),
);
PanelDiv.displayName = "PanelDiv";

// ── Panels wrapper (optional convenience) ────────────────────────────
// Mirrors the legacy .hbd-tabs__panels flex container. Optional — content can
// also be placed directly under <Tabs>.
const TabsPanels = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => (
    <div ref={ref} className={cn("hbd-tabs__panels", className)} {...props}>
      {children}
    </div>
  ),
);
TabsPanels.displayName = "TabsPanels";

export { Tabs, TabsList, TabsTrigger, TabsContent, TabsPanels };
