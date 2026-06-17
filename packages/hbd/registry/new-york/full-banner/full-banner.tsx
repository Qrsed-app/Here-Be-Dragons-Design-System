import * as React from "react";
import { cn } from "@/lib/utils";

// Ported 1:1 from ds/components/hbd-full-banner.js + ds/styles/components/full-page-banner.css
// (light DOM — no Shadow DOM). Full-page takeover that fills the viewport with a
// single dominant message. Four authoring templates plus error/success states
// communicate the most common takeover screens; see TEMPLATES below.
//
// The React markup emits the legacy BEM classes verbatim so the de-shadowed
// full-banner.css reproduces the exact HBD look 1:1. Tailwind utilities are not
// used for the visual design here — the token-backed component CSS is.
//
// Slots:
//   children     → the actions row (typically <Button> CTAs)
//   meta (prop)  → the meta line below the actions (timestamp / version / link)
//
// Page-context expectations (author responsibility, mirroring the WC):
//   - SC 1.3.1: wrap the banner in <main> so the page has a main landmark.
//   - SC 2.4.2: when used as a true full-page replacement, set document.title to
//     reflect the banner state. The component does NOT mutate document.title.

type TemplateDef = {
  eyebrow: string;
  heading: string;
  description: string;
  icon: React.ReactNode;
};

// Shared SVG attributes for every illustration (decorative — aria-hidden +
// focusable="false" for older AT; the heading carries the accessible name).
const svgProps = {
  viewBox: "0 0 96 96",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true as const,
  focusable: "false" as const,
};

const TEMPLATES: Record<string, TemplateDef> = {
  maintenance: {
    eyebrow: "Scheduled Maintenance",
    heading: "We’ll be back shortly",
    description:
      "The arcane servers are undergoing maintenance. We expect to be back online within 2 hours.",
    // Cog with magical sparkle accents.
    icon: (
      <svg {...svgProps}>
        <circle cx="48" cy="48" r="14" />
        <circle cx="48" cy="48" r="6" />
        <path d="M48 22 L48 30" />
        <path d="M48 66 L48 74" />
        <path d="M22 48 L30 48" />
        <path d="M66 48 L74 48" />
        <path d="M30 30 L36 36" />
        <path d="M60 60 L66 66" />
        <path d="M66 30 L60 36" />
        <path d="M30 66 L36 60" />
        <path d="M14 18 L18 22 M14 22 L18 18" />
        <path d="M78 78 L82 82 M78 82 L82 78" />
      </svg>
    ),
  },
  launch: {
    eyebrow: "New Feature",
    heading: "Something magical is here",
    description: "We’ve added new spells to the compendium. Explore what’s new in your spellbook.",
    // Four-pointed star burst with surrounding sparkles.
    icon: (
      <svg {...svgProps}>
        <path d="M48 14 L54 40 L80 48 L54 56 L48 82 L42 56 L16 48 L42 40 Z" />
        <path d="M20 22 L24 26 M20 26 L24 22" />
        <path d="M72 18 L76 22 M72 22 L76 18" />
        <path d="M76 70 L80 74 M76 74 L80 70" />
      </svg>
    ),
  },
  restricted: {
    eyebrow: "Access Restricted",
    heading: "You don’t have permission",
    description:
      "You don’t have the required permissions to view this page. Contact your dungeon master.",
    // Locked tome — book with a padlock overlay.
    icon: (
      <svg {...svgProps}>
        <path d="M22 18h44a6 6 0 0 1 6 6v48a6 6 0 0 1-6 6H22" />
        <path d="M22 18a6 6 0 0 0-6 6v48a6 6 0 0 0 6 6 6 6 0 0 0 6-6V24a6 6 0 0 0-6-6z" />
        <rect x="38" y="48" width="20" height="16" rx="2" />
        <path d="M42 48 V42 a6 6 0 0 1 12 0 V48" />
        <line x1="48" y1="54" x2="48" y2="58" />
      </svg>
    ),
  },
  offline: {
    eyebrow: "No Connection",
    heading: "You’re offline",
    description: "Check your arcane connection and try again.",
    // Crystal orb on a stand with a diagonal "disconnected" slash.
    icon: (
      <svg {...svgProps}>
        <circle cx="48" cy="42" r="22" />
        <path d="M32 70h32" />
        <path d="M28 76h40" />
        <circle cx="40" cy="34" r="4" strokeOpacity="0.5" />
        <line x1="20" y1="20" x2="76" y2="76" />
      </svg>
    ),
  },

  // ── Full-page error templates ──────────────────────────────────────
  "error-404": {
    eyebrow: "404 — Not Found",
    heading: "You’ve wandered off the map",
    description:
      "The page you seek does not exist in this realm. Perhaps it was moved, renamed, or never existed.",
    // Torn map — rectangle with a jagged tear and a compass rose.
    icon: (
      <svg {...svgProps}>
        <path d="M12 18 H44 L40 32 L46 44 L40 56 L46 72 L42 84 H12 Z" />
        <path d="M50 16 H84 V84 H50 L54 72 L48 56 L54 44 L48 32 Z" />
        <circle cx="68" cy="48" r="8" />
        <path d="M68 40 L68 56" />
        <path d="M60 48 L76 48" />
      </svg>
    ),
  },
  "error-500": {
    eyebrow: "500 — Server Error",
    heading: "The arcane servers have faltered",
    description:
      "Something broke on our end. Our engineers have been alerted. Please try again in a few moments.",
    // Broken crystal ball — orb fractured into two halves.
    icon: (
      <svg {...svgProps}>
        <path d="M30 50 a18 18 0 0 1 36 0" />
        <path d="M30 52 a18 18 0 0 0 36 0" />
        <path d="M50 32 L42 50 L52 50 L46 68" />
        <path d="M34 74 h28" />
        <path d="M30 80 h36" />
      </svg>
    ),
  },
  "error-403": {
    eyebrow: "403 — Forbidden",
    heading: "You shall not pass",
    description: "You lack the required permissions to enter this area of the realm.",
    // Iron gate with vertical bars and a central lock.
    icon: (
      <svg {...svgProps}>
        <path d="M16 20 H80 V80 H16 Z" />
        <path d="M16 28 H80" />
        <path d="M28 28 V80" />
        <path d="M40 28 V80" />
        <path d="M56 28 V80" />
        <path d="M68 28 V80" />
        <rect x="42" y="46" width="12" height="14" rx="1.5" />
        <path d="M44 46 V42 a4 4 0 0 1 8 0 V46" />
      </svg>
    ),
  },

  // ── Full-page success templates ────────────────────────────────────
  "success-submitted": {
    eyebrow: "Success",
    heading: "Your quest has been accepted",
    description: "We’ve received your submission and will be in touch shortly.",
    // Wax seal with an embossed checkmark.
    icon: (
      <svg {...svgProps}>
        <path d="M48 8 L56 18 L70 14 L70 28 L82 34 L74 46 L82 58 L70 64 L70 78 L56 74 L48 84 L40 74 L26 78 L26 64 L14 58 L22 46 L14 34 L26 28 L26 14 L40 18 Z" />
        <circle cx="48" cy="46" r="14" />
        <polyline points="38,46 45,53 58,40" />
      </svg>
    ),
  },
  "success-completed": {
    eyebrow: "Complete",
    heading: "Journey complete",
    description: "You’ve reached the end of this path. Well done, adventurer.",
    // Trophy with laurel branches.
    icon: (
      <svg {...svgProps}>
        <path d="M32 22 h32 v18 a16 16 0 0 1 -32 0 z" />
        <path d="M64 26 a6 6 0 0 1 0 14" />
        <path d="M32 26 a6 6 0 0 0 0 14" />
        <path d="M48 60 v12" />
        <path d="M36 80 h24" />
        <path d="M40 72 h16" />
        <path d="M22 30 q -6 8 0 18" />
        <path d="M26 32 l -4 -2" />
        <path d="M26 40 l -4 -2" />
        <path d="M26 48 l -4 -2" />
        <path d="M74 30 q 6 8 0 18" />
        <path d="M70 32 l 4 -2" />
        <path d="M70 40 l 4 -2" />
        <path d="M70 48 l 4 -2" />
      </svg>
    ),
  },
  "success-welcome": {
    eyebrow: "Welcome",
    heading: "Your adventure begins",
    description: "Your account is ready. The realm awaits.",
    // Open book with a starburst above.
    icon: (
      <svg {...svgProps}>
        <path d="M48 36 V80" />
        <path d="M48 36 C 36 32, 24 32, 14 36 V76 C 24 72, 36 72, 48 76" />
        <path d="M48 36 C 60 32, 72 32, 82 36 V76 C 72 72, 60 72, 48 76" />
        <path d="M22 46 h18" />
        <path d="M22 54 h18" />
        <path d="M56 46 h18" />
        <path d="M56 54 h18" />
        <path d="M48 8 V18" />
        <path d="M40 12 L44 18" />
        <path d="M56 12 L52 18" />
      </svg>
    ),
  },
};

export type FullPageBannerTemplate = keyof typeof TEMPLATES;

const HEADING_TAGS = { "1": "h1", "2": "h2", "3": "h3" } as const;

export interface FullPageBannerProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  /** "maintenance" (default) | "launch" | "restricted" | "offline" | error-* | success-* */
  template?: FullPageBannerTemplate;
  /** Overrides the template's default heading. */
  heading?: React.ReactNode;
  /** Overrides the template's default description. */
  description?: React.ReactNode;
  /** Overrides the template's default eyebrow label. */
  eyebrow?: React.ReactNode;
  /** Flips to the inverted ink-900 colour scheme. */
  dark?: boolean;
  /** Semantic heading tag: "1" (default) | "2" | "3". */
  headingLevel?: "1" | "2" | "3";
  /** Meta line below the actions (timestamp / version / link). */
  meta?: React.ReactNode;
  /** Action-row content (typically Button CTAs). */
  children?: React.ReactNode;
}

const FullPageBanner = React.forwardRef<HTMLDivElement, FullPageBannerProps>(
  (
    {
      template = "maintenance",
      heading,
      description,
      eyebrow,
      dark = false,
      headingLevel = "1",
      meta,
      children,
      className,
      ...props
    },
    ref,
  ) => {
    const templateKey = TEMPLATES[template] ? template : "maintenance";
    const t = TEMPLATES[templateKey];

    const eyebrowText = eyebrow ?? t.eyebrow;
    const headingText = heading ?? t.heading;
    const descriptionText = description ?? t.description;

    const validLevel = HEADING_TAGS[headingLevel] ? headingLevel : "1";
    const HeadingTag = HEADING_TAGS[validLevel];

    // Mirror the WC host-class logic: error-*/success-* templates pick up a
    // semantic modifier so the eyebrow + illustration tint to the status hue.
    const isError = templateKey.startsWith("error-");
    const isSuccess = templateKey.startsWith("success-");

    const actionsEmpty = React.Children.count(children) === 0;
    const metaEmpty = meta == null || meta === false;

    return (
      <div
        ref={ref}
        data-template={templateKey}
        className={cn(
          "hbd-full-banner",
          `hbd-full-banner--${templateKey}`,
          isError && "hbd-full-banner--error",
          isSuccess && "hbd-full-banner--success",
          dark && "hbd-full-banner--dark",
          className,
        )}
        {...props}
      >
        <div className="hbd-full-banner__inner">
          <span className="hbd-full-banner__illustration" aria-hidden="true">
            {t.icon}
          </span>
          <p className="hbd-full-banner__eyebrow">{eyebrowText}</p>
          <HeadingTag className="hbd-full-banner__heading">{headingText}</HeadingTag>
          <p className="hbd-full-banner__description">{descriptionText}</p>
          <div className="hbd-full-banner__actions" data-empty={actionsEmpty ? "true" : undefined}>
            {children}
          </div>
          <div className="hbd-full-banner__meta" data-empty={metaEmpty ? "true" : undefined}>
            {metaEmpty ? null : meta}
          </div>
        </div>
      </div>
    );
  },
);
FullPageBanner.displayName = "FullPageBanner";

export { FullPageBanner, TEMPLATES };
