"use client";

import * as React from "react";
import * as ReactDOM from "react-dom";
import { cn } from "@/lib/utils";
import {
  Dropdown,
  type DropdownSelectDetail,
  type DropdownItemProps,
  type DropdownGroupProps,
} from "@/registry/new-york/dropdown/dropdown";

// Ported from ds/components/hbd-context-menu.js (+ ds/utils/menu-controller.js).
// hbd-context-menu reuses the SAME menu panel/items + menu.css that hbd-dropdown
// owns, so this component owns NO CSS file — it imports the menu primitives from
// @hbd/dropdown and re-exports them as compound members. The only legacy rule
// unique to the shell (`.hbd-context-menu { display: contents }`) lives in the
// dropdown-owned menu.css, so nothing is written here.
//
// What this component owns (1:1 with the WC):
//   • onContextMenu (right-click) trigger + touch long-press (500ms hold,
//     8px move tolerance) — mouse/pen get the native contextmenu path.
//   • position: fixed at the cursor with viewport-edge flipping (pre-measure,
//     clamp x/y so the panel stays on-screen).
//   • Escape / click-outside / window-resize close.
//   • role="menu" panel, role="menuitem" rows, roving tabindex, arrow / Home /
//     End / first-character navigation, Enter / Space activation (the reused
//     MenuController logic, reproduced inline against the same .hbd-menu__*
//     markup the shared menu.css targets).
//   • hbd:select -> onSelect({ value, label }).
//
// The Dropdown.Item / Dropdown.Separator / Dropdown.Group authored by the
// consumer are the EXACT data carriers the dropdown uses (they render null and
// are tagged with __hbdMenu); this component walks them into the same flat node
// model and rebuilds the real .hbd-menu__* buttons — exactly as the WC's
// MenuController.render() reads the Light-DOM carriers and rebuilds the panel.

const LONG_PRESS_MS = 500;
const LONG_PRESS_MOVE_TOLERANCE = 8; // px the finger may drift

let uidCounter = 0;

// ── Re-exported menu primitives (owned by @hbd/dropdown) ──────────────
// These are the EXACT same Item / Separator / Group used by the dropdown,
// emitting the legacy .hbd-menu__* classes the shared menu.css targets.
const ContextMenuItem = Dropdown.Item;
const ContextMenuSeparator = Dropdown.Separator;
const ContextMenuGroup = Dropdown.Group;

export type ContextMenuSelectDetail = DropdownSelectDetail;

export interface ContextMenuProps {
  /** Children rendered into the right-clickable area, followed by the menu items. */
  children?: React.ReactNode;
  /** Disable the trigger entirely (no right-click / long-press opens the menu). */
  disabled?: boolean;
  /** Fired when an item is activated, with the legacy { value, label } detail. */
  onSelect?: (detail: ContextMenuSelectDetail) => void;
  /** Notified whenever the menu opens (true) or closes (false). */
  onOpenChange?: (open: boolean) => void;
  /** Extra class on the wrapping shell element. */
  className?: string;
}

interface Coords {
  x: number;
  y: number;
}

// ── Internal node model (mirrors the dropdown's flat node model) ──────
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
type GroupNode = {
  kind: "group";
  label: string;
  children: (ItemNode | SeparatorNode)[];
};
type MenuNode = ItemNode | SeparatorNode | GroupNode;

// Walk Dropdown.Item / Separator / Group children into the flat node model
// (everything else is the right-clickable host content). Mirrors the WC reading
// <hbd-menu-item>/<hbd-menu-separator>/<hbd-menu-group> from its Light DOM while
// the rest of the slot stays the host content.
function partitionChildren(children: React.ReactNode): {
  content: React.ReactNode[];
  nodes: MenuNode[];
  flatItems: ItemNode[];
} {
  const content: React.ReactNode[] = [];
  const flat: ItemNode[] = [];

  const collect = (kids: React.ReactNode): MenuNode[] => {
    const result: MenuNode[] = [];
    React.Children.forEach(kids, (child) => {
      if (!React.isValidElement(child)) {
        if (child != null && child !== false) content.push(child);
        return;
      }
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
          ip.label ?? (typeof ip.children === "string" ? ip.children : String(ip.children ?? ""));
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
      // Non-menu element -> host content.
      content.push(child);
    });
    return result;
  };

  const nodes = collect(children);
  return { content, nodes, flatItems: flat };
}

const ContextMenu = React.forwardRef<HTMLDivElement, ContextMenuProps>(
  ({ children, disabled = false, onSelect, onOpenChange, className }, ref) => {
    const hostRef = React.useRef<HTMLDivElement>(null);
    React.useImperativeHandle(ref, () => hostRef.current as HTMLDivElement);

    const panelRef = React.useRef<HTMLDivElement>(null);
    const [open, setOpen] = React.useState(false);
    const [coords, setCoords] = React.useState<Coords>({ x: 0, y: 0 });

    const uid = React.useMemo(() => `hbd-context-menu-${++uidCounter}`, []);

    const { content, nodes, flatItems } = React.useMemo(
      () => partitionChildren(children),
      [children],
    );

    // Roving-focus state across the rendered menuitems (matches the controller).
    const itemRefs = React.useRef<(HTMLButtonElement | null)[]>([]);
    itemRefs.current = [];
    const [focusedIndex, setFocusedIndex] = React.useState(-1);
    const typeBuffer = React.useRef("");
    const typeTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

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

    const close = React.useCallback(
      (returnFocus = true) => {
        setOpen((wasOpen) => {
          if (!wasOpen) return wasOpen;
          setFocusedIndex(-1);
          onOpenChange?.(false);
          // Mirror _afterClose: if focus is inside the menu, push it back to
          // the host (the right-clicked area) so focus context isn't lost.
          if (returnFocus) {
            const host = hostRef.current;
            const active = document.activeElement;
            if (host && active && panelRef.current && panelRef.current.contains(active)) {
              if (host.getAttribute("tabindex") == null) {
                host.setAttribute("tabindex", "-1");
              }
              host.focus({ preventScroll: true });
            }
          }
          return false;
        });
      },
      [onOpenChange],
    );

    const activateItem = React.useCallback(
      (idx: number) => {
        const node = flatItems[idx];
        if (!node || node.disabled) return;
        node.onSelect?.();
        onSelect?.({ value: node.value, label: node.label });
        close();
      },
      [flatItems, onSelect, close],
    );

    // Open at a viewport point; clamping happens in the layout effect once the
    // panel is measurable (mirrors _openAt's pre-measure + clamp).
    const openAt = React.useCallback(
      (clientX: number, clientY: number) => {
        setCoords({ x: clientX, y: clientY });
        setOpen(true);
        onOpenChange?.(true);
      },
      [onOpenChange],
    );

    // After the panel mounts/opens: measure, clamp to viewport, focus first item.
    React.useLayoutEffect(() => {
      if (!open) return;
      const panel = panelRef.current;
      if (!panel) return;

      const rect = panel.getBoundingClientRect();
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      let x = coords.x;
      let y = coords.y;
      if (x + rect.width > vw) x = Math.max(0, vw - rect.width - 4);
      if (y + rect.height > vh) y = Math.max(0, vh - rect.height - 4);
      panel.style.left = `${x}px`;
      panel.style.top = `${y}px`;

      const idx = firstEnabled();
      if (idx >= 0) focusItemAt(idx);
      else setFocusedIndex(-1);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, coords.x, coords.y]);

    // ── Outside-click + resize close (document-level, capture phase) ────
    React.useEffect(() => {
      if (!open) return;
      const onDocPointer = (e: PointerEvent) => {
        const path = e.composedPath();
        if (hostRef.current && path.includes(hostRef.current)) return;
        if (panelRef.current && path.includes(panelRef.current)) return;
        close(false);
      };
      const onResize = () => close(false);
      document.addEventListener("pointerdown", onDocPointer, true);
      window.addEventListener("resize", onResize);
      return () => {
        document.removeEventListener("pointerdown", onDocPointer, true);
        window.removeEventListener("resize", onResize);
      };
    }, [open, close]);

    // ── Trigger: right-click (mouse/pen) + touch long-press ─────────────
    const lpTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
    const lpStart = React.useRef<Coords>({ x: 0, y: 0 });

    const clearLongPress = React.useCallback(() => {
      if (lpTimer.current != null) {
        clearTimeout(lpTimer.current);
        lpTimer.current = null;
      }
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const onPointerMove = React.useCallback((e: PointerEvent) => {
      if (lpTimer.current == null) return;
      const dx = e.clientX - lpStart.current.x;
      const dy = e.clientY - lpStart.current.y;
      if (Math.hypot(dx, dy) > LONG_PRESS_MOVE_TOLERANCE) clearLongPress();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const onPointerUp = React.useCallback(() => {
      clearLongPress();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const onContextMenu = (e: React.MouseEvent) => {
      if (disabled) return;
      e.preventDefault();
      clearLongPress();
      openAt(e.clientX, e.clientY);
    };

    const onPointerDown = (e: React.PointerEvent) => {
      if (disabled) return;
      if (e.pointerType !== "touch") return;
      lpStart.current = { x: e.clientX, y: e.clientY };
      window.addEventListener("pointermove", onPointerMove);
      window.addEventListener("pointerup", onPointerUp);
      lpTimer.current = setTimeout(() => {
        lpTimer.current = null;
        openAt(lpStart.current.x, lpStart.current.y);
      }, LONG_PRESS_MS);
    };

    React.useEffect(() => () => clearLongPress(), [clearLongPress]);

    // ── Panel keyboard navigation (mirrors menu-controller._onPanelKeydown) ─
    const onPanelKeyDown = (e: React.KeyboardEvent) => {
      const k = e.key;
      if (k === "Escape") {
        e.preventDefault();
        close();
        return;
      }
      if (k === "Tab") {
        close(false);
        return;
      }
      if (k === "Enter" || k === " " || k === "Spacebar") {
        e.preventDefault();
        if (focusedIndex >= 0) activateItem(focusedIndex);
        return;
      }
      if (k === "ArrowDown") {
        e.preventDefault();
        const n = nextEnabled(focusedIndex >= 0 ? focusedIndex : -1, 1);
        if (n >= 0) focusItemAt(n);
        return;
      }
      if (k === "ArrowUp") {
        e.preventDefault();
        const p = nextEnabled(focusedIndex >= 0 ? focusedIndex : flatItems.length, -1);
        if (p >= 0) focusItemAt(p);
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

    // ── Render a flat item button (1:1 with menu-controller._itemHtml) ──
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

    const panel = open ? (
      <div
        ref={panelRef}
        className={cn("hbd-menu", "hbd-menu--open")}
        id={`ctx-menu-${uid}`}
        role="menu"
        aria-label="Context menu"
        tabIndex={-1}
        style={{ position: "fixed", top: coords.y, left: coords.x }}
        onKeyDown={onPanelKeyDown}
      >
        {renderNodes(nodes, "n")}
      </div>
    ) : null;

    return (
      <div
        ref={hostRef}
        className={cn("hbd-context-menu", className)}
        onContextMenu={onContextMenu}
        onPointerDown={onPointerDown}
      >
        {content}
        {typeof document !== "undefined" && panel
          ? ReactDOM.createPortal(panel, document.body)
          : null}
      </div>
    );
  },
);
ContextMenu.displayName = "ContextMenu";

// Compound members reuse the dropdown-owned menu primitives verbatim.
const ContextMenuRoot = Object.assign(ContextMenu, {
  Item: ContextMenuItem,
  Separator: ContextMenuSeparator,
  Group: ContextMenuGroup,
});

export { ContextMenuRoot as ContextMenu, ContextMenuItem, ContextMenuSeparator, ContextMenuGroup };
