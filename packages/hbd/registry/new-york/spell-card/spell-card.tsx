import * as React from "react";
import { cn } from "@/lib/utils";

// Ported 1:1 from ds/components/hbd-spell-card.js + ds/styles/components/spell-card.css.
// The legacy <hbd-spell-card> was Light DOM and purely presentational/static (no JS
// behaviour), so this is a thin presentational React port: same DOM, same legacy BEM
// classes, same computed level/school text, same conditional zones. The token-backed
// spell-card.css reproduces the exact HBD look — Tailwind utilities are NOT used here.
//
// Slots -> props: default slot (description) -> `children`; named slots
// higher-levels -> `higherLevels`; footer -> `footer`. Meta fields are plain props.

const SCHOOLS = [
  "abjuration",
  "conjuration",
  "divination",
  "enchantment",
  "evocation",
  "illusion",
  "necromancy",
  "transmutation",
] as const;

type School = (typeof SCHOOLS)[number];

const META_FIELDS = [
  { key: "castingTime", label: "Casting Time" },
  { key: "range", label: "Range" },
  { key: "components", label: "Components" },
  { key: "duration", label: "Duration" },
] as const;

export interface SpellCardProps extends Omit<React.HTMLAttributes<HTMLElement>, "children"> {
  /** Spell name — rendered as the card heading and woven into the aria-label. */
  name?: string;
  /** Spell level. "cantrip" or "0" render the "Cantrip" badge; anything else -> "Lvl {level}". */
  level?: string | number;
  /** School of magic — sets the colour band + eyebrow. Unknown values are ignored. */
  school?: School | string;
  /** Casting Time meta field. */
  castingTime?: string;
  /** Range meta field. */
  range?: string;
  /** Components meta field. */
  components?: string;
  /** Duration meta field. */
  duration?: string;
  /** Renders the "Ritual" tag + --ritual modifier. */
  ritual?: boolean;
  /** Renders the "Concentration" tag + --concentration modifier. */
  concentration?: boolean;
  /** Selected state (gold border + offset shadow). Adds --selected and .is-selected. */
  selected?: boolean;
  /** Description / flavour text (default slot). */
  children?: React.ReactNode;
  /** "At Higher Levels" content (named slot: higher-levels). */
  higherLevels?: React.ReactNode;
  /** Footer content — source / tags (named slot: footer). */
  footer?: React.ReactNode;
}

function levelText(level: string | number | undefined): string {
  if (level === undefined || level === null || level === "") return "";
  const v = String(level).toLowerCase();
  if (v === "cantrip" || v === "0") return "Cantrip";
  return `Lvl ${level}`;
}

const SpellCard = React.forwardRef<HTMLElement, SpellCardProps>(
  (
    {
      name = "",
      level,
      school,
      castingTime,
      range,
      components,
      duration,
      ritual = false,
      concentration = false,
      selected = false,
      className,
      children,
      higherLevels,
      footer,
      ...props
    },
    ref,
  ) => {
    const schoolRaw = (school || "").toString().toLowerCase();
    const validSchool = (SCHOOLS as readonly string[]).includes(schoolRaw)
      ? (schoolRaw as School)
      : "";
    const isCantrip =
      String(level ?? "").toLowerCase() === "cantrip" || String(level ?? "") === "0";

    const schoolLabel = validSchool
      ? validSchool.charAt(0).toUpperCase() + validSchool.slice(1)
      : "";
    const lvlText = levelText(level);
    const ariaLabel = `${name}${name ? " " : ""}spell card`;

    const metaValues: Record<string, string | undefined> = {
      castingTime,
      range,
      components,
      duration,
    };
    const metaItems = META_FIELDS.filter((f) => metaValues[f.key]);

    const tags: string[] = [];
    if (ritual) tags.push("Ritual");
    if (concentration) tags.push("Concentration");

    return (
      <article
        ref={ref}
        role="article"
        aria-label={ariaLabel}
        tabIndex={0}
        className={cn(
          "hbd-spell-card",
          validSchool && `hbd-spell-card--${validSchool}`,
          isCantrip && "hbd-spell-card--cantrip",
          ritual && "hbd-spell-card--ritual",
          concentration && "hbd-spell-card--concentration",
          selected && "hbd-spell-card--selected",
          selected && "is-selected",
          className,
        )}
        {...props}
      >
        <span className="hbd-spell-card__corner hbd-spell-card__corner--tl" aria-hidden="true" />
        <span className="hbd-spell-card__corner hbd-spell-card__corner--tr" aria-hidden="true" />
        <span className="hbd-spell-card__corner hbd-spell-card__corner--bl" aria-hidden="true" />
        <span className="hbd-spell-card__corner hbd-spell-card__corner--br" aria-hidden="true" />
        <div className="hbd-spell-card__bar" aria-hidden="true" />
        <div className="hbd-spell-card__body">
          {lvlText ? <span className="hbd-spell-card__level">{lvlText}</span> : null}
          {schoolLabel ? <span className="hbd-spell-card__school">{schoolLabel}</span> : null}
          {name ? <h3 className="hbd-spell-card__name">{name}</h3> : null}
          {tags.length ? (
            <div className="hbd-spell-card__tags">
              {tags.map((t) => (
                <span key={t} className="hbd-spell-card__tag">
                  {t}
                </span>
              ))}
            </div>
          ) : null}
          {metaItems.length ? <hr className="hbd-spell-card__rule" /> : null}
          {metaItems.length ? (
            <dl className="hbd-spell-card__meta">
              {metaItems.map((f) => (
                <div key={f.key} className="hbd-spell-card__meta-item">
                  <dt className="hbd-spell-card__meta-label">{f.label}</dt>
                  <dd className="hbd-spell-card__meta-value">{metaValues[f.key]}</dd>
                </div>
              ))}
            </dl>
          ) : null}
          {children ? <hr className="hbd-spell-card__rule" /> : null}
          {children ? <p className="hbd-spell-card__description">{children}</p> : null}
          {higherLevels ? (
            <div className="hbd-spell-card__higher-levels">
              <span className="hbd-spell-card__higher-levels-label">At Higher Levels.</span>{" "}
              {higherLevels}
            </div>
          ) : null}
          {footer ? <div className="hbd-spell-card__footer">{footer}</div> : null}
        </div>
      </article>
    );
  },
);
SpellCard.displayName = "SpellCard";

export { SpellCard };
