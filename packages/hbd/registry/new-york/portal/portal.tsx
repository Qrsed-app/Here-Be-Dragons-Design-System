"use client";

import * as React from "react";
import ReactDOM from "react-dom";

// Ported 1:1 from ds/components/hbd-portal.js (light DOM — no Shadow DOM, no CSS).
// The WC moves its children to a target element elsewhere in the document and
// removes them when it disconnects. The React idiom is ReactDOM.createPortal:
// it renders `children` into the resolved target node instead of inline, and
// React tears the subtree down on unmount — same contract as the WC's
// disconnectedCallback ("when the portal disappears, its children disappear").
//
// Attributes -> props:
//   target  (string selector | Element)  default "body"
//   prepend (boolean)                     insert at the START of the target
//
// `prepend` is honoured by mounting into a managed wrapper node that is
// prepend()-ed (instead of append()-ed) into the resolved target. This mirrors
// the WC, where prepended portals appear first inside the target.

function resolveTarget(target?: string | Element | null): Element | null {
  if (typeof window === "undefined") return null;
  if (!target) return document.body;
  if (typeof target === "string") {
    return document.querySelector(target) ?? document.body;
  }
  return target;
}

export interface PortalProps {
  /** CSS selector for the destination, or an Element. Defaults to "body". */
  target?: string | Element | null;
  /** Insert at the start of the target instead of the end. Default false. */
  prepend?: boolean;
  /** Content to relocate into the target. */
  children?: React.ReactNode;
}

function Portal({ target = "body", prepend = false, children }: PortalProps) {
  // Resolve the destination on the client only (SSR-safe).
  const targetEl = React.useMemo(() => resolveTarget(target), [target]);

  // Managed wrapper so we control the insertion point (append vs prepend).
  const mountRef = React.useRef<HTMLDivElement | null>(null);
  if (mountRef.current === null && typeof document !== "undefined") {
    mountRef.current = document.createElement("div");
    mountRef.current.style.display = "contents";
  }

  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    const mount = mountRef.current;
    if (!targetEl || !mount) return;

    if (prepend) targetEl.prepend(mount);
    else targetEl.appendChild(mount);

    setMounted(true);

    return () => {
      if (mount.parentNode) mount.parentNode.removeChild(mount);
    };
  }, [targetEl, prepend]);

  if (!mounted || !mountRef.current) return null;
  return ReactDOM.createPortal(children, mountRef.current);
}
Portal.displayName = "Portal";

export { Portal };
