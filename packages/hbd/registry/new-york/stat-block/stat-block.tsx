import * as React from "react";
import { cn } from "@/lib/utils";

// Ported 1:1 from ds/components/hbd-stat-block.js (light DOM — no Shadow DOM).
// A D&D 5e creature/NPC stat block: name + subtitle header, basic stats
// (AC/HP/Speed), a six-ability score table, properties (saves/senses/languages/
// CR) and trait/action/reaction/legendary sections. Purely presentational — the
// legacy WC had no behaviour. The .hbd-stat-block__* BEM classes are emitted
// verbatim so the de-shadowed stat-block.css reproduces the exact look 1:1.
//
// Named slots from the WC (saving-throws, skills, immunities, senses, languages,
// traits, actions, reactions, legendary-actions) become render-prop / ReactNode
// props. Trait/action bodies are author markup that already contains
// .hbd-stat-block__trait elements — pass them through as children of each prop.

const ABILITIES = ["str", "dex", "con", "int", "wis", "cha"] as const;

// Ability modifier from score, formatted "+N" / "−N" (U+2212 for negatives).
function modifier(score: number | string | undefined): string {
  const n = typeof score === "number" ? score : parseInt(String(score), 10);
  if (Number.isNaN(n)) return "";
  const mod = Math.floor((n - 10) / 2);
  if (mod < 0) return `−${Math.abs(mod)}`;
  return `+${mod}`;
}

function buildSubtitle(size?: string, type?: string, alignment?: string): string {
  const sizeType = [size, type].filter(Boolean).join(" ");
  return [sizeType, alignment].filter(Boolean).join(", ");
}

export interface StatBlockProps extends React.HTMLAttributes<HTMLElement> {
  /** Creature / NPC name (rendered as the <h2> heading). */
  creatureName?: string;
  /** Size descriptor, e.g. "Large". Combines with type + alignment into the subtitle. */
  size?: string;
  /** Creature type, e.g. "dragon". */
  type?: string;
  /** Alignment, e.g. "chaotic evil". */
  alignment?: string;
  /** Armor Class. */
  ac?: string | number;
  /** Hit Points. */
  hp?: string | number;
  /** Speed. */
  speed?: string | number;
  /** Challenge rating. */
  cr?: string | number;
  /** Ability scores — present scores render the table; absent ones show "—". */
  str?: string | number;
  dex?: string | number;
  con?: string | number;
  int?: string | number;
  wis?: string | number;
  cha?: string | number;
  /** Render the Legendary Actions section + legendary modifier class. */
  legendary?: boolean;
  /** Compact density (reduced padding + type). */
  compact?: boolean;
  /** Property rows (label supplied here, value is the node). */
  savingThrows?: React.ReactNode;
  skills?: React.ReactNode;
  immunities?: React.ReactNode;
  senses?: React.ReactNode;
  languages?: React.ReactNode;
  /** Trait/action sections — author markup containing .hbd-stat-block__trait items. */
  traits?: React.ReactNode;
  actions?: React.ReactNode;
  reactions?: React.ReactNode;
  legendaryActions?: React.ReactNode;
}

const BASIC_FIELDS: { key: "ac" | "hp" | "speed"; label: string }[] = [
  { key: "ac", label: "Armor Class" },
  { key: "hp", label: "Hit Points" },
  { key: "speed", label: "Speed" },
];

function PropertyRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="hbd-stat-block__property">
      <dt className="hbd-stat-block__property-label">{label}</dt>
      <dd className="hbd-stat-block__property-value">{children}</dd>
    </div>
  );
}

function Section({
  heading,
  legendary,
  children,
}: {
  heading: string;
  legendary?: boolean;
  children: React.ReactNode;
}) {
  if (children == null || children === false || children === "") return null;
  return (
    <section
      className={cn("hbd-stat-block__section", legendary && "hbd-stat-block__section--legendary")}
    >
      <h3 className="hbd-stat-block__section-heading">{heading}</h3>
      {children}
    </section>
  );
}

const StatBlock = React.forwardRef<HTMLElement, StatBlockProps>(
  (
    {
      className,
      creatureName,
      size,
      type,
      alignment,
      ac,
      hp,
      speed,
      cr,
      str,
      dex,
      con,
      int,
      wis,
      cha,
      legendary = false,
      compact = false,
      savingThrows,
      skills,
      immunities,
      senses,
      languages,
      traits,
      actions,
      reactions,
      legendaryActions,
      ...props
    },
    ref,
  ) => {
    const subtitle = buildSubtitle(size, type, alignment);

    const scores: Record<(typeof ABILITIES)[number], string | number | undefined> = {
      str,
      dex,
      con,
      int,
      wis,
      cha,
    };
    const basicValues: Record<"ac" | "hp" | "speed", string | number | undefined> = {
      ac,
      hp,
      speed,
    };

    const basics = BASIC_FIELDS.filter(
      (f) =>
        basicValues[f.key] !== undefined &&
        basicValues[f.key] !== null &&
        basicValues[f.key] !== "",
    );
    const hasAbilities = ABILITIES.some(
      (a) => scores[a] !== undefined && scores[a] !== null && scores[a] !== "",
    );

    const propRows: React.ReactNode[] = [];
    if (savingThrows != null && savingThrows !== false && savingThrows !== "")
      propRows.push(
        <PropertyRow key="saving-throws" label="Saving Throws">
          {savingThrows}
        </PropertyRow>,
      );
    if (skills != null && skills !== false && skills !== "")
      propRows.push(
        <PropertyRow key="skills" label="Skills">
          {skills}
        </PropertyRow>,
      );
    if (immunities != null && immunities !== false && immunities !== "")
      propRows.push(
        <PropertyRow key="immunities" label="Immunities">
          {immunities}
        </PropertyRow>,
      );
    if (senses != null && senses !== false && senses !== "")
      propRows.push(
        <PropertyRow key="senses" label="Senses">
          {senses}
        </PropertyRow>,
      );
    if (languages != null && languages !== false && languages !== "")
      propRows.push(
        <PropertyRow key="languages" label="Languages">
          {languages}
        </PropertyRow>,
      );
    if (cr !== undefined && cr !== null && cr !== "")
      propRows.push(
        <PropertyRow key="challenge" label="Challenge">
          {cr}
        </PropertyRow>,
      );

    const hasSections =
      (traits != null && traits !== false && traits !== "") ||
      (actions != null && actions !== false && actions !== "") ||
      (reactions != null && reactions !== false && reactions !== "") ||
      (legendary &&
        legendaryActions != null &&
        legendaryActions !== false &&
        legendaryActions !== "");

    const showTopDivider = basics.length > 0 || hasAbilities || propRows.length > 0;

    return (
      <article
        ref={ref as React.Ref<HTMLElement>}
        role="article"
        className={cn(
          "hbd-stat-block",
          legendary && "hbd-stat-block--legendary",
          compact && "hbd-stat-block--compact",
          className,
        )}
        aria-label={`${creatureName ?? ""} stat block`}
        {...props}
      >
        <div className="hbd-stat-block__inner">
          <header className="hbd-stat-block__header">
            {creatureName ? <h2 className="hbd-stat-block__name">{creatureName}</h2> : null}
            {subtitle ? <p className="hbd-stat-block__subtitle">{subtitle}</p> : null}
          </header>

          {showTopDivider ? <hr className="hbd-stat-block__divider" /> : null}

          {basics.length > 0 ? (
            <dl className="hbd-stat-block__basics">
              {basics.map((f) => (
                <div key={f.key} className="hbd-stat-block__property">
                  <dt className="hbd-stat-block__property-label">{f.label}</dt>
                  <dd className="hbd-stat-block__property-value">{basicValues[f.key]}</dd>
                </div>
              ))}
            </dl>
          ) : null}

          {hasAbilities ? (
            <table className="hbd-stat-block__ability-grid">
              <caption className="hbd-sr-only">Ability scores</caption>
              <thead>
                <tr>
                  {ABILITIES.map((a) => (
                    <th key={a} scope="col" className="hbd-stat-block__ability-label">
                      {a.toUpperCase()}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  {ABILITIES.map((a) => {
                    const v = scores[a];
                    const present = v !== undefined && v !== null && v !== "";
                    return (
                      <td key={a} className="hbd-stat-block__ability-score">
                        {present ? v : "—"}
                      </td>
                    );
                  })}
                </tr>
                <tr>
                  {ABILITIES.map((a) => {
                    const v = scores[a];
                    const present = v !== undefined && v !== null && v !== "";
                    return (
                      <td key={a} className="hbd-stat-block__ability-modifier">
                        {present ? modifier(v) : ""}
                      </td>
                    );
                  })}
                </tr>
              </tbody>
            </table>
          ) : null}

          {propRows.length > 0 ? (
            <>
              <hr className="hbd-stat-block__divider" />
              <dl className="hbd-stat-block__properties">{propRows}</dl>
            </>
          ) : null}

          {hasSections ? <hr className="hbd-stat-block__divider" /> : null}

          <Section heading="Traits">{traits}</Section>
          <Section heading="Actions">{actions}</Section>
          <Section heading="Reactions">{reactions}</Section>
          {legendary ? (
            <Section heading="Legendary Actions" legendary>
              {legendaryActions}
            </Section>
          ) : null}
        </div>
      </article>
    );
  },
);
StatBlock.displayName = "StatBlock";

export { StatBlock };
