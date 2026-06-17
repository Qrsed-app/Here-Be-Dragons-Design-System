"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

// Ported from ds/components/hbd-dropdown.js + ds/utils/menu-controller.js +
// ds/styles/components/menu.css.
//
// This component OWNS the shared menu primitives. Dropdown ships menu.css and
// exports the shared menu sub-components (Dropdown.Item / Dropdown.Separator /
// Dropdown.Group) that context-menu and split-button reuse. The menu uses ARIA
// `menu` / `menuitem` semantics — DISTINCT from select's listbox/option: items
// execute actions, they don't represent a value.
//
// Hand-ported (no Radix) so the bespoke MenuController behaviour — roving
// tabindex, Arrow/Home/End + first-character typeahead, Enter/Space activation,
// Escape, Tab dismissal, outside-click, placement flip — reproduces 1:1. The
// .hbd-menu / .hbd-menu__* BEM classes + .is-focused state class are emitted
// verbatim so the de-shadowed menu.css renders the exact HBD look.

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

let uidCounter = 0;

// ── Detail payload carried by the legacy hbd:select event ────────────
export interface DropdownSelectDetail {
  value: string;
  label: string;
}

export type DropdownPlacement =
  | "bottom-start"
  | "bottom-end"
  | "bottom-center"
  | "top-start"
  | "top-end"
  | "top-center";

// ── Internal node model ──────────────────────────────────────────────
// Children authored via <Dropdown.Item|Separator|Group> are collected into a
// flat, render-order list so the MenuController logic (roving index across all
// enabled items, regardless of grouping) matches the WC exactly.
type ItemNode = {
  kind: "item";
  value: string;
  label: string;
  icon?: React.ReactNode;
  shortcut?: React.ReactNode;
  disabled: boolean;
  destructive: boolean;
  onSelect?: () => void;
};
type SeparatorNode = { kind: "separator" };
type GroupNode = { kind: "group"; label: string; children: (ItemNode | SeparatorNode)[] };
type MenuNode = ItemNode | SeparatorNode | GroupNode;

// ── Positioning ──────────────────────────────────────────────────────
// Mirrors hbd-dropdown.js#_positionMenu: anchors the menu to the
// position:relative .hbd-dropdown wrapper via top/bottom/left/right, flipping
// vertically/horizontally against viewport bounds. The coords flow through the
// style prop — the documented dynamic exception for overlay positioning.
interface MenuPosStyle {
  top?: string;
  bottom?: string;
  left?: string;
  right?: string;
}

function computePosition(
  trigger: HTMLElement,
  panel: HTMLElement,
  placement: DropdownPlacement,
  offset: number,
): MenuPosStyle {
  const trigRect = trigger.getBoundingClientRect();
  const menuRect = panel.getBoundingClientRect();
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  let vert = placement.startsWith("top") ? "top" : "bottom";
  let horiz = placement.endsWith("-end")
    ? "end"
    : placement.endsWith("-start")
      ? "start"
      : "center";

  const spaceBelow = vh - trigRect.bottom;
  const spaceAbove = trigRect.top;
  if (vert === "bottom" && spaceBelow < menuRect.height + offset && spaceAbove > spaceBelow) {
    vert = "top";
  }
  if (vert === "top" && spaceAbove < menuRect.height + offset && spaceBelow > spaceAbove) {
    vert = "bottom";
  }

  if (
    horiz === "start" &&
    trigRect.left + menuRect.width > vw &&
    trigRect.right - menuRect.width >= 0
  ) {
    horiz = "end";
  } else if (
    horiz === "end" &&
    trigRect.right - menuRect.width < 0 &&
    trigRect.left + menuRect.width <= vw
  ) {
    horiz = "start";
  }

  const style: MenuPosStyle = {};
  if (vert === "bottom") style.top = `calc(100% + ${offset}px)`;
  else style.bottom = `calc(100% + ${offset}px)`;
  if (horiz === "start") style.left = "0";
  else if (horiz === "end") style.right = "0";
  else style.left = "50%";
  return style;
}

// ── Props ────────────────────────────────────────────────────────────
export interface DropdownProps {
  /** The trigger element (e.g. an <hbd> Button). Cloned to receive the
   *  aria-haspopup/expanded/controls wiring + open toggle handlers. */
  trigger: React.ReactElement<any>;
  /** Dropdown.Item / Dropdown.Separator / Dropdown.Group children. */
  children?: React.ReactNode;
  /** Controlled open state. */
  open?: boolean;
  /** Uncontrolled initial open state. */
  defaultOpen?: boolean;
  /** Fired when the open state changes (controlled-first overlay pattern). */
  onOpenChange?: (open: boolean) => void;
  /** Anchor placement; flips against the viewport like the WC. */
  placement?: DropdownPlacement;
  /** Gap (px) between the trigger and the menu. */
  offset?: number;
  /** Fired when an item is activated, with the {value, label} detail (hbd:select). */
  onSelect?: (detail: DropdownSelectDetail) => void;
  /** Extra class on the .hbd-dropdown wrapper. */
  className?: string;
}

const DropdownRoot = React.forwardRef<HTMLDivElement, DropdownProps>(
  (
    {
      trigger,
      children,
      open: openProp,
      defaultOpen = false,
      onOpenChange,
      placement = "bottom-start",
      offset = 4,
      onSelect,
      className,
    },
    ref,
  ) => {
    const uid = React.useMemo(() => `hbd-dropdown-${++uidCounter}`, []);
    const menuId = `menu-${uid}`;
    const triggerId = trigger.props.id || `trigger-${uid}`;

    const [open, setOpen] = useControllableState<boolean>({
      value: openProp,
      defaultValue: defaultOpen,
      onChange: onOpenChange,
    });

    const wrapperRef = React.useRef<HTMLDivElement>(null);
    React.useImperativeHandle(ref, () => wrapperRef.current as HTMLDivElement);
    const triggerRef = React.useRef<HTMLElement>(null);
    const panelRef = React.useRef<HTMLDivElement>(null);

    const [focusedIndex, setFocusedIndex] = React.useState(-1);
    const [posStyle, setPosStyle] = React.useState<MenuPosStyle>({});

    // typeahead buffer (mirrors the controller's 500ms reset).
    const typeBuffer = React.useRef("");
    const typeTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

    // ── Collect children into the flat node model ───────────────────
    const { nodes, flatItems } = React.useMemo(() => {
      const flat: ItemNode[] = [];
      const collect = (kids: React.ReactNode): MenuNode[] => {
        const result: MenuNode[] = [];
        React.Children.forEach(kids, (child) => {
          if (!React.isValidElement(child)) return;
          const type = child.type as { __hbdMenu?: string };
          const tag = type?.__hbdMenu;
          if (tag === "separator") {
            result.push({ kind: "separator" });
            return;
          }
          if (tag === "group") {
            const gp = child.props as DropdownGroupProps;
            const inner = collect(gp.children) as (ItemNode | SeparatorNode)[];
            result.push({ kind: "group", label: gp.label ?? "", children: inner });
            return;
          }
          if (tag === "item") {
            const ip = child.props as DropdownItemProps;
            const label =
              ip.label ??
              (typeof ip.children === "string" ? ip.children : String(ip.children ?? ""));
            const node: ItemNode = {
              kind: "item",
              value: ip.value ?? "",
              label,
              icon: ip.icon,
              shortcut: ip.shortcut,
              disabled: !!ip.disabled,
              destructive: !!ip.destructive,
              onSelect: ip.onSelect,
            };
            flat.push(node);
            result.push(node);
            return;
          }
        });
        return result;
      };
      const tree = collect(children);
      return { nodes: tree, flatItems: flat };
    }, [children]);

    const itemRefs = React.useRef<(HTMLButtonElement | null)[]>([]);
    itemRefs.current = [];

    // ── Index helpers (roving over enabled items) ───────────────────
    const firstEnabled = React.useCallback(
      () => flatItems.findIndex((b) => !b.disabled),
      [flatItems],
    );
    const lastEnabled = React.useCallback(() => {
      for (let i = flatItems.length - 1; i >= 0; i--) {
        if (!flatItems[i].disabled) return i;
      }
      return -1;
    }, [flatItems]);
    const nextEnabled = React.useCallback(
      (from: number, dir: number) => {
        const n = flatItems.length;
        if (n === 0) return -1;
        let i = from;
        for (let s = 0; s < n; s++) {
          i = (i + dir + n) % n;
          if (!flatItems[i].disabled) return i;
        }
        return -1;
      },
      [flatItems],
    );

    const focusItemAt = React.useCallback((i: number) => {
      setFocusedIndex(i);
      const el = itemRefs.current[i];
      if (el) {
        el.focus({ preventScroll: false });
        el.scrollIntoView({ block: "nearest" });
      }
    }, []);

    // ── Open / close ────────────────────────────────────────────────
    const positionMenu = React.useCallback(() => {
      const trig = triggerRef.current;
      const panel = panelRef.current;
      if (!trig || !panel) return;
      setPosStyle(computePosition(trig, panel, placement, offset));
    }, [placement, offset]);

    const doOpen = React.useCallback(() => {
      if (open) return;
      setOpen(true);
    }, [open, setOpen]);

    const doClose = React.useCallback(
      (returnFocus = true) => {
        if (!open) return;
        setOpen(false);
        setFocusedIndex(-1);
        if (returnFocus) {
          const t = triggerRef.current;
          const inner =
            (t?.shadowRoot && t.shadowRoot.querySelector("button")) ||
            (t?.querySelector?.("button") as HTMLElement | null) ||
            t;
          (inner as HTMLElement | null)?.focus?.({ preventScroll: true });
        }
      },
      [open, setOpen],
    );

    const activateItem = React.useCallback(
      (idx: number) => {
        const node = flatItems[idx];
        if (!node || node.disabled) return;
        node.onSelect?.();
        onSelect?.({ value: node.value, label: node.label });
        doClose();
      },
      [flatItems, onSelect, doClose],
    );

    // After open: position + focus first enabled item.
    React.useLayoutEffect(() => {
      if (!open) return;
      positionMenu();
      const idx = firstEnabled();
      if (idx >= 0) {
        // wait a frame so refs are populated and the panel is measurable.
        requestAnimationFrame(() => focusItemAt(idx));
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    // Reposition on window resize while open.
    React.useEffect(() => {
      if (!open) return;
      const onResize = () => positionMenu();
      window.addEventListener("resize", onResize);
      return () => window.removeEventListener("resize", onResize);
    }, [open, positionMenu]);

    // Outside-click dismissal (pointerdown, capture — matches the WC).
    React.useEffect(() => {
      if (!open) return;
      const onDocPointer = (e: PointerEvent) => {
        const path = e.composedPath();
        if (wrapperRef.current && path.includes(wrapperRef.current)) return;
        doClose(false);
      };
      document.addEventListener("pointerdown", onDocPointer, true);
      return () => document.removeEventListener("pointerdown", onDocPointer, true);
    }, [open, doClose]);

    // ── Trigger handlers (wired onto the cloned trigger) ────────────
    const onTriggerClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      trigger.props.onClick?.(e);
      if (open) doClose();
      else doOpen();
    };
    const onTriggerKeyDown = (e: React.KeyboardEvent) => {
      trigger.props.onKeyDown?.(e);
      if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " " || e.key === "Spacebar") {
        e.preventDefault();
        doOpen();
      }
    };

    // ── Panel keyboard nav (MenuController#_onPanelKeydown) ─────────
    const onPanelKeyDown = (e: React.KeyboardEvent) => {
      const k = e.key;
      if (k === "Escape") {
        e.preventDefault();
        doClose();
        return;
      }
      if (k === "Tab") {
        doClose(false);
        return;
      }
      if (k === "Enter" || k === " " || k === "Spacebar") {
        e.preventDefault();
        if (focusedIndex >= 0) activateItem(focusedIndex);
        return;
      }
      if (k === "ArrowDown") {
        e.preventDefault();
        const next = nextEnabled(focusedIndex >= 0 ? focusedIndex : -1, 1);
        if (next >= 0) focusItemAt(next);
        return;
      }
      if (k === "ArrowUp") {
        e.preventDefault();
        const prev = nextEnabled(focusedIndex >= 0 ? focusedIndex : flatItems.length, -1);
        if (prev >= 0) focusItemAt(prev);
        return;
      }
      if (k === "Home") {
        e.preventDefault();
        const f = firstEnabled();
        if (f >= 0) focusItemAt(f);
        return;
      }
      if (k === "End") {
        e.preventDefault();
        const l = lastEnabled();
        if (l >= 0) focusItemAt(l);
        return;
      }
      // First-character typeahead (case-insensitive, wrapping, 500ms reset).
      if (k.length === 1 && /\S/.test(k)) {
        typeBuffer.current += k.toLowerCase();
        if (typeTimer.current) clearTimeout(typeTimer.current);
        typeTimer.current = setTimeout(() => {
          typeBuffer.current = "";
        }, 500);

        const start = (focusedIndex + 1) % Math.max(1, flatItems.length);
        for (let step = 0; step < flatItems.length; step++) {
          const i = (start + step) % flatItems.length;
          const node = flatItems[i];
          if (node.disabled) continue;
          if (node.label.toLowerCase().startsWith(typeBuffer.current)) {
            focusItemAt(i);
            return;
          }
        }
      }
    };

    // ── Render the cloned trigger with the popup wiring ─────────────
    const clonedTrigger = React.cloneElement(trigger, {
      ref: triggerRef,
      id: triggerId,
      "aria-haspopup": "menu",
      "aria-expanded": open,
      "aria-controls": menuId,
      onClick: onTriggerClick,
      onKeyDown: onTriggerKeyDown,
    } as React.HTMLAttributes<HTMLElement> & { ref: React.Ref<HTMLElement> });

    // ── Render a flat item button ───────────────────────────────────
    const renderItem = (node: ItemNode, flatIndex: number) => {
      const isFocused = flatIndex === focusedIndex;
      return (
        <button
          key={`item-${flatIndex}`}
          type="button"
          ref={(el) => {
            itemRefs.current[flatIndex] = el;
          }}
          className={cn(
            "hbd-menu__item",
            node.destructive && "hbd-menu__item--destructive",
            node.disabled && "hbd-menu__item--disabled",
            isFocused && "is-focused",
          )}
          role="menuitem"
          tabIndex={isFocused ? 0 : -1}
          aria-disabled={node.disabled || undefined}
          disabled={node.disabled}
          data-value={node.value}
          data-label={node.label}
          title={node.label}
          onClick={(e) => {
            if (node.disabled) return;
            e.stopPropagation();
            activateItem(flatIndex);
          }}
        >
          {node.icon != null ? (
            <span className="hbd-menu__item-icon" aria-hidden="true">
              {node.icon}
            </span>
          ) : null}
          <span className="hbd-menu__item-label">{node.label}</span>
          {node.shortcut != null ? (
            <span className="hbd-menu__item-shortcut" aria-hidden="true">
              {node.shortcut}
            </span>
          ) : null}
        </button>
      );
    };

    // Walk the node tree, assigning flat indices in render order.
    let cursor = 0;
    const nextFlatIndex = () => cursor++;

    const renderNodes = (list: MenuNode[], keyPrefix: string): React.ReactNode =>
      list.map((node, i) => {
        if (node.kind === "separator") {
          return (
            <hr
              key={`${keyPrefix}-sep-${i}`}
              className="hbd-menu__separator"
              role="separator"
              aria-orientation="horizontal"
            />
          );
        }
        if (node.kind === "group") {
          const groupId = `group-label-${uid}-${keyPrefix}-${i}`;
          return (
            <div
              key={`${keyPrefix}-group-${i}`}
              className="hbd-menu__group"
              role="group"
              aria-labelledby={groupId}
            >
              <span className="hbd-menu__group-label" id={groupId}>
                {node.label}
              </span>
              {renderNodes(node.children, `${keyPrefix}-${i}`)}
            </div>
          );
        }
        return renderItem(node, nextFlatIndex());
      });

    return (
      <div ref={wrapperRef} className={cn("hbd-dropdown", className)}>
        {clonedTrigger}
        <div
          ref={panelRef}
          className={cn("hbd-menu", open && "hbd-menu--open")}
          id={menuId}
          role="menu"
          tabIndex={-1}
          aria-labelledby={triggerId}
          style={posStyle as React.CSSProperties}
          onKeyDown={onPanelKeyDown}
        >
          {renderNodes(nodes, "n")}
        </div>
      </div>
    );
  },
);
DropdownRoot.displayName = "Dropdown";

// ── Compound members — data carriers (not rendered directly) ─────────
// These are read declaratively by the root via the __hbdMenu tag; their own
// render output is unused (the root rebuilds the flat button list), mirroring
// the WC's Light-DOM <hbd-menu-item>/<hbd-menu-separator>/<hbd-menu-group>
// data carriers consumed by the MenuController.
export interface DropdownItemProps {
  /** The value carried in the hbd:select detail. */
  value?: string;
  /** Explicit label; falls back to string children. */
  label?: string;
  /** Leading icon node. */
  icon?: React.ReactNode;
  /** Trailing keyboard-shortcut hint. */
  shortcut?: React.ReactNode;
  /** Disables the item (skipped by keyboard nav, blocks activation). */
  disabled?: boolean;
  /** Renders the item in the destructive (blood) colour. */
  destructive?: boolean;
  /** Per-item activation callback (fires alongside the root onSelect). */
  onSelect?: () => void;
  children?: React.ReactNode;
}
const DropdownItem: React.FC<DropdownItemProps> & { __hbdMenu?: string } = () => null;
DropdownItem.__hbdMenu = "item";
DropdownItem.displayName = "Dropdown.Item";

export type DropdownSeparatorProps = Record<string, never>;
const DropdownSeparator: React.FC<DropdownSeparatorProps> & { __hbdMenu?: string } = () => null;
DropdownSeparator.__hbdMenu = "separator";
DropdownSeparator.displayName = "Dropdown.Separator";

export interface DropdownGroupProps {
  /** Uppercased group heading. */
  label?: string;
  children?: React.ReactNode;
}
const DropdownGroup: React.FC<DropdownGroupProps> & { __hbdMenu?: string } = () => null;
DropdownGroup.__hbdMenu = "group";
DropdownGroup.displayName = "Dropdown.Group";

// ── Compound export ──────────────────────────────────────────────────
type DropdownComponent = typeof DropdownRoot & {
  Item: typeof DropdownItem;
  Separator: typeof DropdownSeparator;
  Group: typeof DropdownGroup;
};

const Dropdown = DropdownRoot as DropdownComponent;
Dropdown.Item = DropdownItem;
Dropdown.Separator = DropdownSeparator;
Dropdown.Group = DropdownGroup;

export { Dropdown, DropdownItem, DropdownSeparator, DropdownGroup };
