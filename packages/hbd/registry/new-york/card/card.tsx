"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

// Ported from ds/components/hbd-card.js + ds/styles/components/card.css.
// The legacy WC was Light DOM and mutated its authored markup in place; here
// the card is a compound component. Variants map to the legacy
// .hbd-card--{variant}/--{size} + surface modifier classes so the de-shadowed
// card.css reproduces the exact HBD look 1:1. Tailwind utilities are NOT used
// for the visual design — the token-backed component CSS is.
//
// Footer is purely slotted children (the WC never instantiates a button of its
// own), so this file does NOT import @/registry/new-york/button — footer
// content is whatever the consumer renders into <Card.Footer> / the footer prop.

// ── Variants ─────────────────────────────────────────────────────────
type CardVariant = "basic" | "interactive" | "media" | "horizontal";
type CardSize = "sm" | "md" | "lg" | "flush";
type HeadingLevel = 2 | 3 | 4;

const cardVariants = cva("hbd-card", {
  variants: {
    // media + horizontal contribute their own layout class; basic +
    // interactive add no variant class on their own (interactivity is a
    // separate modifier, mirroring the WC which only stacks --media /
    // --horizontal here).
    variant: {
      basic: "",
      interactive: "",
      media: "hbd-card--media",
      horizontal: "hbd-card--horizontal",
    },
    size: {
      sm: "hbd-card--sm",
      // md is the default and adds no class (matches the WC: size !== 'md').
      md: "",
      lg: "hbd-card--lg",
      flush: "hbd-card--flush",
    },
  },
  defaultVariants: { variant: "basic", size: "md" },
});

// ── hbd:click detail ─────────────────────────────────────────────────
export interface CardClickDetail {
  href: string | null;
}

// ── Compound sub-components ──────────────────────────────────────────
export interface CardMediaProps extends Omit<
  React.ImgHTMLAttributes<HTMLImageElement>,
  "src" | "alt"
> {
  /** Image URL. */
  imgSrc: string;
  /** Alt text — pass "" for decorative images. */
  imgAlt: string;
  /** Wrapper (.hbd-card__media) className. */
  className?: string;
}

/** Media block (.hbd-card__media) with a lazy <img> + onError placeholder. */
const CardMedia = React.forwardRef<HTMLDivElement, CardMediaProps>(
  ({ imgSrc, imgAlt, className, ...props }, ref) => {
    const [failed, setFailed] = React.useState(false);

    React.useEffect(() => {
      if (imgSrc && imgAlt == null) {
        console.warn(
          '[Card] imgSrc is set but imgAlt is missing. Provide imgAlt="" ' +
            "for decorative images, or a meaningful description.",
        );
      }
    }, [imgSrc, imgAlt]);

    return (
      <div ref={ref} className={cn("hbd-card__media", className)}>
        {failed ? (
          <div
            className="hbd-card__media-placeholder"
            role="img"
            aria-label={imgAlt || "Image unavailable"}
          >
            Image unavailable
          </div>
        ) : (
          <img
            className="hbd-card__img"
            src={imgSrc}
            alt={imgAlt ?? ""}
            loading="lazy"
            onError={() => setFailed(true)}
            {...props}
          />
        )}
      </div>
    );
  },
);
CardMedia.displayName = "Card.Media";

export interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  /** Rendered heading element (h2/h3/h4). Mirrors the WC heading-level. */
  headingLevel?: HeadingLevel;
}

/** Card title (.hbd-card__title) rendered as h2/h3/h4. */
const CardTitle = React.forwardRef<HTMLHeadingElement, CardTitleProps>(
  ({ headingLevel = 3, className, children, ...props }, ref) => {
    const Tag = `h${headingLevel}` as "h2" | "h3" | "h4";
    return (
      <Tag ref={ref} className={cn("hbd-card__title", className)} {...props}>
        {children}
      </Tag>
    );
  },
);
CardTitle.displayName = "Card.Title";

export interface CardHeaderProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  /** Convenience title text — rendered as a Card.Title when provided. */
  title?: React.ReactNode;
  /** Convenience subtitle text — rendered as .hbd-card__subtitle. */
  subtitle?: React.ReactNode;
  /** Heading element level for the convenience title. */
  headingLevel?: HeadingLevel;
}

/** Header (.hbd-card__header) — title + subtitle, or arbitrary children. */
const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ title, subtitle, headingLevel = 3, className, children, ...props }, ref) => (
    <div ref={ref} className={cn("hbd-card__header", className)} {...props}>
      {title != null && title !== "" ? (
        <CardTitle headingLevel={headingLevel}>{title}</CardTitle>
      ) : null}
      {subtitle != null && subtitle !== "" ? (
        <p className="hbd-card__subtitle">{subtitle}</p>
      ) : null}
      {children}
    </div>
  ),
);
CardHeader.displayName = "Card.Header";

/** Body (.hbd-card__body) — main content. */
const CardBody = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => (
    <div ref={ref} className={cn("hbd-card__body", className)} {...props}>
      {children}
    </div>
  ),
);
CardBody.displayName = "Card.Body";

/** Footer (.hbd-card__footer) — actions row. Children are slotted verbatim. */
const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => (
    <div ref={ref} className={cn("hbd-card__footer", className)} {...props}>
      {children}
    </div>
  ),
);
CardFooter.displayName = "Card.Footer";

/** Badge overlay (.hbd-card__badge) — absolutely positioned top-right. */
const CardBadge = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => (
    <div ref={ref} className={cn("hbd-card__badge", className)} {...props}>
      {children}
    </div>
  ),
);
CardBadge.displayName = "Card.Badge";

// ── Card (root) ──────────────────────────────────────────────────────
type CardOwnProps = {
  variant?: CardVariant;
  size?: CardSize;
  /** Heavier shadow. */
  elevated?: boolean;
  /** Border instead of shadow. */
  bordered?: boolean;
  /** Interactive link target — renders the card as an <a>. */
  href?: string;
  /**
   * Fired on click OR keyboard (Enter/Space) activation of an interactive
   * card. Mirrors the WC's hbd:click event. detail = { href }.
   * Not fired when the click originated inside a footer-actionable child.
   */
  onCardClick?: (detail: CardClickDetail) => void;
  className?: string;
  children?: React.ReactNode;
};

export interface CardProps
  extends
    Omit<React.HTMLAttributes<HTMLDivElement>, "title" | "onClick" | keyof CardOwnProps>,
    CardOwnProps,
    Pick<VariantProps<typeof cardVariants>, never> {
  // Convenience attribute-style props (mirror the WC attributes). When any of
  // these are set the card renders the matching structural sub-parts itself;
  // otherwise pass compound children.
  /** Convenience title text -> Card.Title in the header. */
  title?: React.ReactNode;
  /** Convenience subtitle text -> .hbd-card__subtitle in the header. */
  subtitle?: React.ReactNode;
  /** Heading element level for the convenience title (2/3/4, default 3). */
  headingLevel?: HeadingLevel;
  /** Convenience image URL for media/horizontal variants. */
  imgSrc?: string;
  /** Alt text for the convenience image (required when imgSrc is set). */
  imgAlt?: string;
  /** Convenience footer content -> Card.Footer. */
  footer?: React.ReactNode;
  /** Convenience badge overlay content -> Card.Badge. */
  badge?: React.ReactNode;
}

// Footer-actionable selectors: clicks originating inside these are ignored by
// the card's activation (they have their own actions). Mirrors the WC.
const FOOTER_ACTIONABLE =
  ".hbd-card__footer button, .hbd-card__footer a, " +
  ".hbd-card__footer input, .hbd-card__footer hbd-button";

const Card = React.forwardRef<HTMLElement, CardProps>(
  (
    {
      variant = "basic",
      size = "md",
      elevated = false,
      bordered = false,
      href,
      onCardClick,
      title,
      subtitle,
      headingLevel = 3,
      imgSrc,
      imgAlt,
      footer,
      badge,
      className,
      children,
      ...props
    },
    ref,
  ) => {
    const isInteractive = variant === "interactive" || href != null;
    const isHorizontal = variant === "horizontal";
    const showMedia = (variant === "media" || variant === "horizontal") && imgSrc != null;
    const hasHeader = (title != null && title !== "") || (subtitle != null && subtitle !== "");

    const classes = cn(
      cardVariants({ variant, size }),
      isInteractive && "hbd-card--interactive",
      bordered && "hbd-card--bordered",
      elevated && "hbd-card--elevated",
      className,
    );

    const fireClick = (detail: CardClickDetail) => {
      onCardClick?.(detail);
    };

    const handleClick = (e: React.MouseEvent) => {
      if (!isInteractive) return;
      // Ignore clicks that originated inside a footer-actionable child.
      const target = e.target as Element | null;
      if (target && target.closest && target.closest(FOOTER_ACTIONABLE)) return;
      // For href cards the native <a> handles navigation; we still fire so
      // consumers can react (analytics) without preventing default.
      fireClick({ href: href ?? null });
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      // Keyboard activation only matters for div-based interactive cards.
      // Anchor-wrapped cards activate via the <a>'s native handling.
      if (!isInteractive || href != null) return;
      if (e.key === "Enter" || e.key === " " || e.key === "Spacebar") {
        e.preventDefault();
        fireClick({ href: null });
      }
    };

    // Compose the inner structure. Convenience props render their structural
    // parts; explicit compound children are appended (and fall into the body
    // wrapper visually only if the consumer wraps them).
    const header = hasHeader ? (
      <CardHeader title={title} subtitle={subtitle} headingLevel={headingLevel} />
    ) : null;

    const media = showMedia ? <CardMedia imgSrc={imgSrc as string} imgAlt={imgAlt ?? ""} /> : null;

    const badgeEl = badge != null ? <CardBadge>{badge}</CardBadge> : null;
    const footerEl = footer != null ? <CardFooter>{footer}</CardFooter> : null;

    // Inner content order matches the WC: badge, media, then header/body/footer.
    // Horizontal wraps header/body/footer in a .hbd-card__content column.
    const stack = (
      <>
        {header}
        {children}
        {footerEl}
      </>
    );

    const inner = isHorizontal ? (
      <>
        {badgeEl}
        {media}
        <div className="hbd-card__content">{stack}</div>
      </>
    ) : (
      <>
        {badgeEl}
        {media}
        {stack}
      </>
    );

    // href -> wrap inner in a real <a> for native navigation; the card div is
    // the surface that paints the focus ring outside the clip via :has().
    const content =
      isInteractive && href != null ? (
        <a className="hbd-card__link" href={href}>
          {inner}
        </a>
      ) : (
        inner
      );

    // The card surface is always a div. Interactivity without href makes it a
    // role="button", tabindex=0 div (matching the WC). With href, the inner
    // <a> is the focusable element and the div carries no role/tabindex.
    const interactiveDivProps =
      isInteractive && href == null ? { role: "button" as const, tabIndex: 0 } : {};

    return (
      <div
        ref={ref as React.Ref<HTMLDivElement>}
        className={classes}
        onClick={isInteractive ? handleClick : undefined}
        onKeyDown={isInteractive && href == null ? handleKeyDown : undefined}
        {...interactiveDivProps}
        {...props}
      >
        {content}
      </div>
    );
  },
);
Card.displayName = "Card";

// Attach compound members.
type CardComponent = typeof Card & {
  Media: typeof CardMedia;
  Header: typeof CardHeader;
  Title: typeof CardTitle;
  Body: typeof CardBody;
  Footer: typeof CardFooter;
  Badge: typeof CardBadge;
};

const CardWithMembers = Card as CardComponent;
CardWithMembers.Media = CardMedia;
CardWithMembers.Header = CardHeader;
CardWithMembers.Title = CardTitle;
CardWithMembers.Body = CardBody;
CardWithMembers.Footer = CardFooter;
CardWithMembers.Badge = CardBadge;

export {
  CardWithMembers as Card,
  CardMedia,
  CardHeader,
  CardTitle,
  CardBody,
  CardFooter,
  CardBadge,
  cardVariants,
};
