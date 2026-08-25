"use client";

// Breadcrumbs uses useState/useCallback/createContext internally without a
// 'use client' directive of its own, so it cannot render inside server MDX.
// These thin client wrappers host the examples so the hooks run on the client.

import { Breadcrumbs } from "@/registry/new-york/breadcrumbs/breadcrumbs";

/** Basic data-driven trail via the items[] prop — the last crumb is current. */
export function BreadcrumbsBasicDemo() {
  return (
    <Breadcrumbs
      items={[
        { label: "Atlas", href: "#" },
        { label: "Northern Seas", href: "#" },
        { label: "Kraken Trench" },
      ]}
    />
  );
}

/** The same trail built from compound <Breadcrumbs.Item> children. */
export function BreadcrumbsCompoundDemo() {
  return (
    <Breadcrumbs>
      <Breadcrumbs.Item href="#">Atlas</Breadcrumbs.Item>
      <Breadcrumbs.Item href="#">Northern Seas</Breadcrumbs.Item>
      <Breadcrumbs.Item>Kraken Trench</Breadcrumbs.Item>
    </Breadcrumbs>
  );
}

/**
 * truncate collapses the middle crumbs behind an ellipsis once the count
 * exceeds the threshold; clicking "…" expands the full path (fires hbd:expand).
 */
export function BreadcrumbsTruncateDemo() {
  return (
    <Breadcrumbs
      truncate={3}
      items={[
        { label: "Atlas", href: "#" },
        { label: "Northern Seas", href: "#" },
        { label: "Frostbite Strait", href: "#" },
        { label: "Glacier Bay", href: "#" },
        { label: "Kraken Trench" },
      ]}
    />
  );
}

/** A custom accessible label is forwarded to the surrounding <nav>. */
export function BreadcrumbsLabelDemo() {
  return (
    <Breadcrumbs
      label="Voyage trail"
      items={[
        { label: "Home Port", href: "#" },
        { label: "Open Water", href: "#" },
        { label: "Edge of the Map" },
      ]}
    />
  );
}
