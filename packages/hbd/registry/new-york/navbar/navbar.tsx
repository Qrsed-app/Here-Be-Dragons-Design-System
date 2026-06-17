"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/registry/new-york/button/button";

// Ported from ds/components/hbd-navbar.js + ds/styles/components/navbar.css.
//
// Primary top navigation bar. The legacy WC was a Light-DOM custom element
// that captured slot="logo"|"nav"|"actions" children once, then rebuilt the
// host into a canonical scaffold: a desktop inner row (logo / centred nav /
// actions + hamburger) PLUS a full-viewport off-canvas mobile menu that
// MIRRORS the logo, nav and actions. Below --hbd-navbar-mobile-breakpoint
// (768px) the desktop nav hides and the hamburger reveals; tapping it opens
// the mobile menu which behaves exactly like <hbd-drawer>: portal +
// scroll-lock (ref-counted) + focus-trap + return-focus + Escape-to-close,
// and auto-closes when a resize crosses back above the breakpoint.
//
// Hand-ported (no Radix) so the bespoke open/close lifecycle, the desktop
// <-> mobile mirroring, and the active-link detection reproduce 1:1. Every
// legacy .hbd-navbar* BEM class + the .is-open state class is emitted
// verbatim so the de-shadowed navbar.css renders the HBD look 1:1.
//
// Compound API (all from this file):
//   Navbar          -> the bar; owns variants + mobile-menu lifecycle
//   Navbar.Logo     -> the WC's slot="logo"   (rendered in both rows)
//   Navbar.Link     -> the WC's slot="nav"    (mirrored desktop + mobile)
//   Navbar.Actions  -> the WC's slot="actions"(mirrored desktop + mobile)
// Links auto-mark .is-active + aria-current="page" when their href's pathname
// matches the current location, exactly like _maybeMarkActive in the WC.

const DEFAULT_MOBILE_BREAKPOINT = 768;

// Focusable selector — mirrors FOCUSABLE_SELECTOR in hbd-navbar.js.
const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  'input:not([disabled]):not([type="hidden"])',
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

// ── Ref-counted scroll lock, shared across drawers + navbar menus (mirrors
//    the module-level activeMenuLockCount / savedBodyOverflow in the WC). ──
let activeMenuLockCount = 0;
let savedBodyOverflow = "";
function lockScroll() {
  if (activeMenuLockCount === 0) {
    savedBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
  }
  activeMenuLockCount += 1;
}
function releaseScrollLock() {
  if (activeMenuLockCount === 0) return;
  activeMenuLockCount -= 1;
  if (activeMenuLockCount === 0) {
    document.body.style.overflow = savedBodyOverflow;
    savedBodyOverflow = "";
  }
}

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

// ── Icons (carried verbatim from the WC's inline SVGs) ────────────────
const HamburgerIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path
      d="M2 4h12M2 8h12M2 12h12"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
    />
  </svg>
);
const CloseIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

// ── Active-link detection — mirrors _maybeMarkActive: compare the link's
//    href pathname against the current location pathname (exact match). ──
function useIsActive(href?: string, forced?: boolean): boolean {
  return React.useMemo(() => {
    if (forced) return true;
    if (!href || typeof window === "undefined") return false;
    try {
      const url = new URL(href, window.location.href);
      return url.pathname === window.location.pathname;
    } catch {
      return false;
    }
  }, [href, forced]);
}

// ── Sub-part: Logo ────────────────────────────────────────────────────
export interface NavbarLogoProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
}
const NavbarLogo: React.FC<NavbarLogoProps> & { __hbdNavbar?: string } = ({
  className,
  children,
  ...props
}) => (
  <div className={cn("hbd-navbar__logo", className)} {...props}>
    {children}
  </div>
);
NavbarLogo.__hbdNavbar = "logo";
NavbarLogo.displayName = "Navbar.Logo";

// ── Sub-part: Link ────────────────────────────────────────────────────
// Rendered as a desktop link (.hbd-navbar__link) AND mirrored into the mobile
// menu (.hbd-navbar__mobile-link) by the root. The `mobile` flag swaps the
// base class, mirroring _swapClass in the WC. Active detection adds .is-active
// + aria-current="page".
export interface NavbarLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  /** Force the active styling regardless of pathname match. */
  active?: boolean;
  children?: React.ReactNode;
}
const NavbarLink: React.FC<NavbarLinkProps & { mobile?: boolean }> & { __hbdNavbar?: string } = ({
  className,
  active,
  mobile = false,
  children,
  href,
  ...props
}) => {
  const isActive = useIsActive(href, active);
  return (
    <a
      href={href}
      className={cn(
        mobile ? "hbd-navbar__mobile-link" : "hbd-navbar__link",
        isActive && "is-active",
        className,
      )}
      aria-current={isActive ? "page" : undefined}
      {...props}
    >
      {children}
    </a>
  );
};
NavbarLink.__hbdNavbar = "nav";
NavbarLink.displayName = "Navbar.Link";

// ── Sub-part: Actions ─────────────────────────────────────────────────
// Wraps action content. The root mirrors the same children into the desktop
// .hbd-navbar__actions row and the mobile .hbd-navbar__mobile-actions column.
export interface NavbarActionsProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
}
const NavbarActions: React.FC<NavbarActionsProps> & { __hbdNavbar?: string } = ({ children }) => (
  <>{children}</>
);
NavbarActions.__hbdNavbar = "actions";
NavbarActions.displayName = "Navbar.Actions";

// ── Root props ────────────────────────────────────────────────────────
export interface NavbarProps extends Omit<React.HTMLAttributes<HTMLElement>, "onChange"> {
  /** Stick to the top of the viewport (position: sticky). */
  sticky?: boolean;
  /** Transparent background with no shadow. */
  transparent?: boolean;
  /** Bottom hairline border instead of a shadow. */
  bordered?: boolean;
  /** Controlled mobile-menu open state. */
  open?: boolean;
  /** Uncontrolled initial mobile-menu open state. */
  defaultOpen?: boolean;
  /** Fired when the mobile-menu open state changes (controlled-first). */
  onOpenChange?: (open: boolean) => void;
  /** Fired after the mobile menu opens — the WC's `hbd:open`. */
  onOpen?: () => void;
  /** Fired after the mobile menu closes — the WC's `hbd:close`. */
  onClose?: () => void;
  /** Navbar.Logo / Navbar.Link / Navbar.Actions children. */
  children?: React.ReactNode;
}

const NavbarRoot = React.forwardRef<HTMLElement, NavbarProps>(
  (
    {
      sticky = false,
      transparent = false,
      bordered = false,
      open: openProp,
      defaultOpen = false,
      onOpenChange,
      onOpen,
      onClose,
      className,
      children,
      ...props
    },
    ref,
  ) => {
    const uid = React.useMemo(() => `hbd-navbar-${++uidCounter}`, []);
    const menuId = `mobile-menu-${uid}`;

    const [open, setOpenState] = useControllableState<boolean>({
      value: openProp,
      defaultValue: defaultOpen,
      onChange: onOpenChange,
    });

    const [mounted, setMounted] = React.useState(false);
    React.useEffect(() => setMounted(true), []);

    // Track the live open state in a ref so the unmount-cleanup effect (which
    // runs with empty deps) can read the CURRENT value — mirrors the WC's
    // disconnectedCallback checking this._mobileMenuOpen, not a stale capture.
    const openRef = React.useRef(open);
    openRef.current = open;

    const hamburgerRef = React.useRef<HTMLButtonElement>(null);
    const closeBtnRef = React.useRef<HTMLButtonElement>(null);
    const menuRef = React.useRef<HTMLDivElement>(null);
    const previousFocus = React.useRef<HTMLElement | null>(null);
    const rootRef = React.useRef<HTMLElement | null>(null);

    // Merge the forwarded ref with our internal rootRef so we can read the
    // --hbd-navbar-mobile-breakpoint token off the host (mirrors the WC's
    // _mobileBreakpoint reading the custom property at runtime).
    const setRootRef = React.useCallback(
      (node: HTMLElement | null) => {
        rootRef.current = node;
        if (typeof ref === "function") ref(node);
        else if (ref) (ref as React.MutableRefObject<HTMLElement | null>).current = node;
      },
      [ref],
    );

    const mobileBreakpoint = React.useCallback((): number => {
      const node = rootRef.current;
      if (!node || typeof window === "undefined") return DEFAULT_MOBILE_BREAKPOINT;
      const v = getComputedStyle(node).getPropertyValue("--hbd-navbar-mobile-breakpoint").trim();
      const n = parseInt(v, 10);
      return Number.isFinite(n) && n > 0 ? n : DEFAULT_MOBILE_BREAKPOINT;
    }, []);

    // ── Collect children into logo / nav / actions buckets (mirrors the
    //    WC's slot capture into _sourceLogo / _sourceNav / _sourceActions). ──
    const { logo, navLinks, actions } = React.useMemo(() => {
      let logoNode: React.ReactNode = null;
      const navNodes: React.ReactElement<NavbarLinkProps>[] = [];
      let actionNodes: React.ReactNode = null;
      React.Children.forEach(children, (child) => {
        if (!React.isValidElement(child)) return;
        const tag = (child.type as { __hbdNavbar?: string })?.__hbdNavbar;
        if (tag === "logo") logoNode = child;
        else if (tag === "nav") navNodes.push(child as React.ReactElement<NavbarLinkProps>);
        else if (tag === "actions") actionNodes = (child.props as NavbarActionsProps).children;
      });
      return { logo: logoNode, navLinks: navNodes, actions: actionNodes };
    }, [children]);

    // ── Open / close (mirrors _openMobileMenu / _closeMobileMenu) ───────
    const captureActiveElement = React.useCallback((): HTMLElement | null => {
      let el = document.activeElement as HTMLElement | null;
      // Pierce open shadow roots (legacy hbd-button used Shadow DOM; the React
      // Button is Light-DOM, but keep the pierce for parity / safety).
      while (el && (el as Element).shadowRoot && (el as Element).shadowRoot!.activeElement) {
        el = (el as Element).shadowRoot!.activeElement as HTMLElement;
      }
      return el;
    }, []);

    const doOpen = React.useCallback(() => {
      if (open) return;
      previousFocus.current = captureActiveElement();
      lockScroll();
      setOpenState(true);
      onOpen?.();
    }, [open, captureActiveElement, setOpenState, onOpen]);

    const doClose = React.useCallback(() => {
      if (!open) return;
      releaseScrollLock();
      setOpenState(false);
      onClose?.();
      // Restore focus to the previously-focused element if still connected;
      // otherwise route back to the hamburger (mirrors the WC fallback).
      const prev = previousFocus.current;
      previousFocus.current = null;
      const target = prev && prev.isConnected ? prev : hamburgerRef.current;
      target?.focus?.({ preventScroll: true });
    }, [open, setOpenState, onClose]);

    const toggle = React.useCallback(() => {
      if (open) doClose();
      else doOpen();
    }, [open, doOpen, doClose]);

    // ── Focusable list inside the mobile menu (mirrors _getFocusable) ───
    const getFocusable = React.useCallback((): HTMLElement[] => {
      const menu = menuRef.current;
      if (!menu) return [];
      return Array.from(menu.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter((el) => {
        if (el.closest('[aria-hidden="true"]')) return false;
        if (el.offsetParent !== null) return true;
        const r = el.getBoundingClientRect();
        return r.width > 0 && r.height > 0;
      });
    }, []);

    // ── On open: defer focus to the close button (mirrors the rAF in the WC).
    React.useEffect(() => {
      if (!open) return;
      const raf = requestAnimationFrame(() => {
        closeBtnRef.current?.focus({ preventScroll: true });
      });
      return () => cancelAnimationFrame(raf);
    }, [open]);

    // ── Escape + focus-trap key listener (capture phase, mirrors _onKeydown).
    React.useEffect(() => {
      if (!open) return;
      const onKeydown = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          e.stopPropagation();
          e.preventDefault();
          doClose();
          return;
        }
        if (e.key !== "Tab") return;
        const focusable = getFocusable();
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        const active = captureActiveElement();
        if (e.shiftKey) {
          if (active === first || active == null) {
            e.preventDefault();
            last.focus({ preventScroll: false });
          }
        } else if (active === last) {
          e.preventDefault();
          first.focus({ preventScroll: false });
        }
      };
      document.addEventListener("keydown", onKeydown, true);
      return () => document.removeEventListener("keydown", onKeydown, true);
    }, [open, doClose, getFocusable, captureActiveElement]);

    // ── Resize: if the viewport crosses back above the breakpoint while the
    //    menu is open, close it (debounced 120ms, mirrors _onResize). ──
    React.useEffect(() => {
      if (!open) return;
      let timer: ReturnType<typeof setTimeout> | null = null;
      const onResize = () => {
        if (timer) clearTimeout(timer);
        timer = setTimeout(() => {
          timer = null;
          if (window.innerWidth >= mobileBreakpoint()) doClose();
        }, 120);
      };
      window.addEventListener("resize", onResize);
      return () => {
        if (timer) clearTimeout(timer);
        window.removeEventListener("resize", onResize);
      };
    }, [open, doClose, mobileBreakpoint]);

    // ── Safety: if the navbar unmounts while open, release the scroll lock.
    React.useEffect(() => {
      return () => {
        if (openRef.current) releaseScrollLock();
      };
    }, []);

    const rootClass = cn(
      "hbd-navbar",
      sticky && "hbd-navbar--sticky",
      transparent && "hbd-navbar--transparent",
      bordered && "hbd-navbar--bordered",
      open && "is-open",
      className,
    );

    // ── Mirror nav links into desktop + mobile rows (mirrors the activatedNav
    //    / activatedMobileNav arrays; the mobile copy swaps the base class). ──
    const desktopNav = navLinks.map((link, i) => React.cloneElement(link, { key: `nav-${i}` }));
    const mobileNav = navLinks.map((link, i) =>
      React.cloneElement(link as React.ReactElement<NavbarLinkProps & { mobile?: boolean }>, {
        key: `mnav-${i}`,
        mobile: true,
      }),
    );

    const mobileMenu = (
      <div
        ref={menuRef}
        className={cn("hbd-navbar__mobile-menu", open && "is-open")}
        id={menuId}
        role="dialog"
        aria-modal="true"
        aria-label="Mobile navigation"
        aria-hidden={open ? "false" : "true"}
      >
        <div className="hbd-navbar__mobile-header">
          <div className="hbd-navbar__logo">{logo}</div>
          <Button
            ref={closeBtnRef}
            variant="default"
            iconOnly
            className="hbd-navbar__mobile-close"
            aria-label="Close navigation menu"
            onClick={(e) => {
              e.stopPropagation();
              doClose();
            }}
          >
            <span className="hbd-button__icon" aria-hidden="true">
              <CloseIcon />
            </span>
          </Button>
        </div>

        <nav className="hbd-navbar__mobile-nav" aria-label="Mobile navigation">
          {mobileNav}
        </nav>

        <div className="hbd-navbar__mobile-actions">{actions}</div>
      </div>
    );

    return (
      <header ref={setRootRef} className={rootClass} role="banner" {...props}>
        <div className="hbd-navbar__inner">
          <div className="hbd-navbar__logo">{logo}</div>

          <nav className="hbd-navbar__nav" aria-label="Main navigation">
            {desktopNav}
          </nav>

          <div className="hbd-navbar__actions">
            {actions}
            <Button
              ref={hamburgerRef}
              variant="default"
              iconOnly
              className="hbd-navbar__hamburger"
              aria-label={open ? "Close navigation menu" : "Open navigation menu"}
              aria-expanded={open}
              aria-controls={menuId}
              onClick={(e) => {
                e.stopPropagation();
                toggle();
              }}
            >
              <span className="hbd-button__icon" aria-hidden="true">
                <HamburgerIcon />
              </span>
            </Button>
          </div>
        </div>

        {/* The mobile menu is position:fixed; inset:0 — portal it to the body
            so it escapes any transformed/overflow-clipping ancestor, matching
            the WC's full-viewport off-canvas panel. */}
        {mounted ? createPortal(mobileMenu, document.body) : null}
      </header>
    );
  },
);
NavbarRoot.displayName = "Navbar";

// ── Compound export ───────────────────────────────────────────────────
type NavbarComponent = typeof NavbarRoot & {
  Logo: typeof NavbarLogo;
  Link: typeof NavbarLink;
  Actions: typeof NavbarActions;
};

const Navbar = NavbarRoot as NavbarComponent;
Navbar.Logo = NavbarLogo;
Navbar.Link = NavbarLink;
Navbar.Actions = NavbarActions;

export { Navbar, NavbarLogo, NavbarLink, NavbarActions };
