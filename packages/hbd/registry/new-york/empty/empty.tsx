import * as React from "react";
import { cn } from "@/lib/utils";

// Ported 1:1 from ds/components/hbd-empty.js + ds/styles/components/empty-state.css.
// Light DOM. Emits the legacy BEM markup (.hbd-empty / __illustration /
// __content / __heading / __description / __actions) so the de-shadowed
// empty-state.css reproduces the HBD look exactly. Author-supplied actions
// map to `children` (rendered into .hbd-empty__actions). The TEMPLATES SVG
// illustration map is carried verbatim from the WC.

const VALID_SIZES = ["sm", "md", "lg"] as const;
const VALID_LEVELS = ["2", "3", "4"] as const;

export type EmptyTemplate =
  | "no-data"
  | "no-results"
  | "error"
  | "offline"
  | "error-404"
  | "error-500"
  | "error-403"
  | "error-network"
  | "error-form"
  | "success-submitted"
  | "success-saved"
  | "success-completed"
  | "success-welcome";

type TemplateDef = {
  heading: string;
  description: string;
  icon: React.ReactNode;
};

// Each illustration is decorative; aria-hidden + focusable="false" repeated
// on the inline SVG (the wrapper also carries aria-hidden) — matches the WC.
const svgProps = {
  viewBox: "0 0 64 64",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
  focusable: "false" as const,
};

const TEMPLATES: Record<EmptyTemplate, TemplateDef> = {
  "no-data": {
    heading: "Nothing here yet",
    description: "Add your first item to get started.",
    // Open scroll — ribbons on the sides, two ruled lines.
    icon: (
      <svg {...svgProps}>
        <path d="M16 14h32a6 6 0 0 1 6 6v24a6 6 0 0 1-6 6H16" />
        <path d="M16 14a6 6 0 0 0-6 6v24a6 6 0 0 0 6 6 6 6 0 0 0 6-6V20a6 6 0 0 0-6-6z" />
        <path d="M48 14a6 6 0 0 1 6 6v0a6 6 0 0 1-6 6" />
        <line x1="26" y1="24" x2="46" y2="24" />
        <line x1="26" y1="32" x2="46" y2="32" />
        <line x1="26" y1="40" x2="40" y2="40" />
      </svg>
    ),
  },
  "no-results": {
    heading: "No results found",
    description: "Try adjusting your search or filters.",
    // Magnifying glass with a small × inside.
    icon: (
      <svg {...svgProps}>
        <circle cx="28" cy="28" r="16" />
        <line x1="40" y1="40" x2="54" y2="54" />
        <line x1="22" y1="22" x2="34" y2="34" />
        <line x1="34" y1="22" x2="22" y2="34" />
      </svg>
    ),
  },
  error: {
    heading: "Something went wrong",
    description: "An error occurred while loading this content. Please try again.",
    // Warning rune — triangle with exclamation.
    icon: (
      <svg {...svgProps}>
        <path d="M32 10 L56 52 H8 Z" />
        <line x1="32" y1="26" x2="32" y2="38" />
        <circle cx="32" cy="44" r="1.5" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  offline: {
    heading: "You appear to be offline",
    description: "Check your connection and try again.",
    // Disconnected crystal ball — orb with a diagonal slash.
    icon: (
      <svg {...svgProps}>
        <circle cx="32" cy="30" r="16" />
        <path d="M22 50h20" />
        <path d="M20 54h24" />
        <line x1="14" y1="14" x2="50" y2="50" />
      </svg>
    ),
  },
  "error-404": {
    heading: "Page not found",
    description: "The page you're looking for doesn't exist or has been moved.",
    // Compass with a broken needle.
    icon: (
      <svg {...svgProps}>
        <circle cx="32" cy="32" r="20" />
        <circle cx="32" cy="32" r="2.5" fill="currentColor" stroke="none" />
        <path d="M32 32 L26 18" />
        <path d="M38 46 L42 50" />
        <path d="M32 32 L36 42" />
        <line x1="32" y1="10" x2="32" y2="14" />
        <line x1="32" y1="50" x2="32" y2="54" />
        <line x1="10" y1="32" x2="14" y2="32" />
        <line x1="50" y1="32" x2="54" y2="32" />
      </svg>
    ),
  },
  "error-500": {
    heading: "Server error",
    description: "Something went wrong on our end. We've been notified and are working on a fix.",
    // Broken gear — cog with one missing tooth and a crack.
    icon: (
      <svg {...svgProps}>
        <circle cx="32" cy="32" r="10" />
        <circle cx="32" cy="32" r="4" />
        <path d="M32 14 L32 22" />
        <path d="M32 42 L32 50" />
        <path d="M14 32 L22 32" />
        <path d="M42 32 L50 32" />
        <path d="M19 19 L25 25" />
        <path d="M39 39 L45 45" />
        <path d="M19 45 L25 39" />
        <path d="M22 24 L30 32 L26 36 L34 44" />
      </svg>
    ),
  },
  "error-403": {
    heading: "Access forbidden",
    description: "You don't have permission to view this content.",
    // Locked shield.
    icon: (
      <svg {...svgProps}>
        <path d="M32 10 L52 18 V34 C52 44 42 52 32 56 C22 52 12 44 12 34 V18 Z" />
        <rect x="24" y="30" width="16" height="14" rx="1.5" />
        <path d="M27 30 V25 a5 5 0 0 1 10 0 V30" />
        <line x1="32" y1="35" x2="32" y2="40" />
      </svg>
    ),
  },
  "error-network": {
    heading: "Connection failed",
    description: "Check your network connection and try again.",
    // Severed arcane link — two ring-and-chain halves with a break.
    icon: (
      <svg {...svgProps}>
        <rect x="10" y="24" width="18" height="16" rx="8" />
        <rect x="36" y="24" width="18" height="16" rx="8" />
        <line x1="28" y1="20" x2="36" y2="44" />
        <line x1="36" y1="20" x2="28" y2="44" />
      </svg>
    ),
  },
  "error-form": {
    heading: "Submission failed",
    description: "Please check the form for errors and try again.",
    // Scroll with an × overlay.
    icon: (
      <svg {...svgProps}>
        <path d="M16 14h32a6 6 0 0 1 6 6v24a6 6 0 0 1-6 6H16" />
        <path d="M16 14a6 6 0 0 0-6 6v24a6 6 0 0 0 6 6 6 6 0 0 0 6-6V20a6 6 0 0 0-6-6z" />
        <line x1="26" y1="24" x2="46" y2="24" />
        <line x1="26" y1="32" x2="46" y2="32" />
        <line x1="27" y1="38" x2="43" y2="48" />
        <line x1="43" y1="38" x2="27" y2="48" />
      </svg>
    ),
  },
  "success-submitted": {
    heading: "Submitted successfully",
    description: "Your request has been received and is being processed.",
    // Circle checkmark.
    icon: (
      <svg {...svgProps}>
        <circle cx="32" cy="32" r="22" />
        <polyline points="20,32 28,40 44,24" />
      </svg>
    ),
  },
  "success-saved": {
    heading: "Changes saved",
    description: "Your changes have been saved successfully.",
    // Smaller checkmark inside a circle.
    icon: (
      <svg {...svgProps}>
        <circle cx="32" cy="32" r="20" strokeOpacity="0.7" />
        <polyline points="22,32 30,39 42,26" />
      </svg>
    ),
  },
  "success-completed": {
    heading: "All done!",
    description: "You've completed all the required steps.",
    // Trophy with a star above.
    icon: (
      <svg {...svgProps}>
        <path d="M22 18h20v10 a10 10 0 0 1 -20 0z" />
        <path d="M42 22 a4 4 0 0 1 0 8" />
        <path d="M22 22 a4 4 0 0 0 0 8" />
        <path d="M32 40 V46" />
        <path d="M24 50h16" />
        <path d="M32 6 L34 10 L38 10.5 L35 13 L36 17 L32 15 L28 17 L29 13 L26 10.5 L30 10 Z" />
      </svg>
    ),
  },
  "success-welcome": {
    heading: "Welcome, adventurer",
    description: "Your account is ready. Begin your journey.",
    // Glowing open doorway.
    icon: (
      <svg {...svgProps}>
        <path d="M16 54 V24 a16 16 0 0 1 32 0 V54" />
        <path d="M22 54 V26 a10 10 0 0 1 20 0 V54" />
        <path d="M32 4 V10" />
        <path d="M20 8 L23 13" />
        <path d="M44 8 L41 13" />
      </svg>
    ),
  },
};

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Which canonical template to render. Defaults to "no-data". */
  template?: EmptyTemplate;
  /** Overrides the template's default heading. */
  heading?: string;
  /** Overrides the template's default description. */
  description?: string;
  /** Semantic heading tag level: "2" (default) | "3" | "4". */
  headingLevel?: (typeof VALID_LEVELS)[number];
  /** sm · md (default) · lg. */
  size?: (typeof VALID_SIZES)[number];
  /** Horizontal layout — icon left of text. */
  inline?: boolean;
  /** Action elements (e.g. <Button>) rendered into the actions row. */
  children?: React.ReactNode;
}

const EmptyState = React.forwardRef<HTMLDivElement, EmptyStateProps>(
  (
    {
      template = "no-data",
      heading,
      description,
      headingLevel = "2",
      size = "md",
      inline = false,
      className,
      children,
      ...props
    },
    ref,
  ) => {
    const tmplKey: EmptyTemplate = TEMPLATES[template] ? template : "no-data";
    const t = TEMPLATES[tmplKey];
    const sz = (VALID_SIZES as readonly string[]).includes(size) ? size : "md";
    const hLevel = (VALID_LEVELS as readonly string[]).includes(headingLevel) ? headingLevel : "2";

    const headingText = heading ?? t.heading;
    const descriptionText = description ?? t.description;
    const HeadingTag = `h${hLevel}` as "h2" | "h3" | "h4";

    // Semantic tint: "error" + "error-*" -> --error; "success-*" -> --success.
    const isError = tmplKey === "error" || tmplKey.startsWith("error-");
    const isSuccess = tmplKey.startsWith("success-");

    const hasActions = React.Children.count(children) > 0;

    return (
      <div
        ref={ref}
        data-template={tmplKey}
        className={cn(
          "hbd-empty",
          sz === "sm" && "hbd-empty--sm",
          sz === "lg" && "hbd-empty--lg",
          inline && "hbd-empty--inline",
          isError && "hbd-empty--error",
          isSuccess && "hbd-empty--success",
          className,
        )}
        {...props}
      >
        <div className="hbd-empty__illustration" aria-hidden="true">
          {t.icon}
        </div>
        <div className="hbd-empty__content">
          <HeadingTag className="hbd-empty__heading">{headingText}</HeadingTag>
          <p className="hbd-empty__description">{descriptionText}</p>
          <div className="hbd-empty__actions" {...(hasActions ? {} : { "data-empty": "" })}>
            {children}
          </div>
        </div>
      </div>
    );
  },
);
EmptyState.displayName = "EmptyState";

export { EmptyState, TEMPLATES };
