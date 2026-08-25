import * as React from "react";
import { cn } from "@/lib/utils";

// Ported 1:1 from ds/components/hbd-divider.js + ds/styles/components/divider.css.
// Light-DOM web component, so the CSS already targets .hbd-divider* directly.
// Four variants:
//   horizontal | vertical -> structural <hr>/<div role="separator">, no children
//   with-label            -> flex rule with a centred label span (role="separator")
//   ornamental            -> purely decorative (aria-hidden) sigil between fade lines
// Variant -> legacy BEM class so the de-shadowed CSS reproduces the look 1:1.

const VARIANTS = ["horizontal", "vertical", "with-label", "ornamental"] as const;
const COLORS = ["default", "subtle", "strong", "gold"] as const;
const STYLE_TYPES = ["solid", "dashed", "double"] as const;

export interface DividerProps extends React.HTMLAttributes<HTMLDivElement> {
  /** horizontal (default) · vertical · with-label · ornamental */
  variant?: (typeof VARIANTS)[number];
  /** default · subtle · strong · gold */
  color?: (typeof COLORS)[number];
  /** solid (default) · dashed · double — maps the WC `style-type` attribute */
  styleType?: (typeof STYLE_TYPES)[number];
  /** Label text (with-label) or ornament glyph (ornamental). */
  children?: React.ReactNode;
}

function dividerClasses(
  variant: (typeof VARIANTS)[number],
  color: (typeof COLORS)[number],
  styleType: (typeof STYLE_TYPES)[number],
): string {
  return cn(
    "hbd-divider",
    variant === "vertical" && "hbd-divider--vertical",
    variant === "with-label" && "hbd-divider--with-label",
    variant === "ornamental" && "hbd-divider--ornamental",
    color !== "default" && `hbd-divider--${color}`,
    styleType === "dashed" && "hbd-divider--dashed",
    styleType === "double" && "hbd-divider--double",
  );
}

/** Plain-text accessible name extracted from label children (mirrors WC). */
function textContent(node: React.ReactNode): string {
  if (node === null || node === undefined || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(textContent).join("");
  if (React.isValidElement(node)) {
    return textContent((node.props as { children?: React.ReactNode }).children);
  }
  return "";
}

const Divider = React.forwardRef<HTMLDivElement, DividerProps>(
  (
    {
      variant = "horizontal",
      color = "default",
      styleType = "solid",
      className,
      children,
      ...props
    },
    ref,
  ) => {
    const classes = cn(dividerClasses(variant, color, styleType), className);

    if (variant === "with-label") {
      const label = textContent(children).trim();
      return (
        <div
          ref={ref}
          className={classes}
          role="separator"
          aria-orientation="horizontal"
          aria-label={label || undefined}
          {...props}
        >
          <span className="hbd-divider__label">{children}</span>
        </div>
      );
    }

    if (variant === "ornamental") {
      return (
        <div ref={ref} className={classes} aria-hidden="true" {...props}>
          <span className="hbd-divider__ornament">{children}</span>
        </div>
      );
    }

    // horizontal / vertical: structural separator, no children.
    return (
      <div
        ref={ref}
        className={classes}
        role="separator"
        aria-orientation={variant === "vertical" ? "vertical" : "horizontal"}
        {...props}
      />
    );
  },
);
Divider.displayName = "Divider";

export { Divider };
