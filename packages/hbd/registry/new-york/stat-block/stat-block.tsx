import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";

import { cn } from "@/lib/utils";

// The manuscript double rule: thick top/bottom bars on the border, hairlines 4px
// inside them drawn by ::before/::after, so the content needs no wrapper element.
const statBlockVariants = cva(
  "group/stat-block relative block max-w-[24rem] border-y-[6px] border-primary bg-[linear-gradient(135deg,var(--background),var(--surface-subtle))] font-serif shadow-md before:pointer-events-none before:absolute before:inset-x-0 before:top-1 before:h-px before:bg-primary after:pointer-events-none after:absolute after:inset-x-0 after:bottom-1 after:h-px after:bg-primary",
  {
    variants: {
      size: {
        default: "px-5 py-[calc(0.25rem+1px+1rem)]",
        sm: "px-4 py-[calc(0.25rem+1px+0.75rem)]",
      },
    },
    defaultVariants: {
      size: "default",
    },
  },
);

function StatBlock({
  className,
  size = "default",
  ...props
}: React.ComponentProps<"article"> & VariantProps<typeof statBlockVariants>) {
  return (
    <article
      data-slot="stat-block"
      data-size={size}
      className={cn(statBlockVariants({ size, className }))}
      {...props}
    />
  );
}

function StatBlockHeader({ className, ...props }: React.ComponentProps<"header">) {
  return <header data-slot="stat-block-header" className={cn("mb-3", className)} {...props} />;
}

function StatBlockTitle({
  className,
  asChild = false,
  ...props
}: React.ComponentProps<"h2"> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "h2";

  return (
    <Comp
      data-slot="stat-block-title"
      className={cn(
        "mb-[2px] font-display text-2xl leading-[1.2] font-bold tracking-[0.02em] text-foreground-emphasis group-data-[size=sm]/stat-block:text-xl",
        className,
      )}
      {...props}
    />
  );
}

function StatBlockDescription({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="stat-block-description"
      className={cn("font-serif text-[0.9375rem] text-foreground-secondary italic", className)}
      {...props}
    />
  );
}

function StatBlockSeparator({ className, ...props }: React.ComponentProps<"hr">) {
  return (
    <hr
      data-slot="stat-block-separator"
      className={cn("my-[0.625rem] border-t border-primary", className)}
      {...props}
    />
  );
}

function StatBlockProperties({ className, ...props }: React.ComponentProps<"dl">) {
  return <dl data-slot="stat-block-properties" className={className} {...props} />;
}

function StatBlockProperty({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="stat-block-property"
      className={cn(
        "flex flex-wrap gap-2 font-sans text-[0.8125rem] leading-[1.7] text-foreground-secondary group-data-[size=sm]/stat-block:text-[0.6875rem]",
        className,
      )}
      {...props}
    />
  );
}

function StatBlockPropertyLabel({ className, ...props }: React.ComponentProps<"dt">) {
  return (
    <dt
      data-slot="stat-block-property-label"
      className={cn(
        "font-display font-bold tracking-wider text-foreground-emphasis-strong",
        className,
      )}
      {...props}
    />
  );
}

function StatBlockPropertyValue({ className, ...props }: React.ComponentProps<"dd">) {
  return (
    <dd data-slot="stat-block-property-value" className={cn("font-normal", className)} {...props} />
  );
}

const ABILITIES = ["str", "dex", "con", "int", "wis", "cha"] as const;

type Ability = (typeof ABILITIES)[number];
type AbilityScore = number | string | null | undefined;

// U+2212 minus for negatives, as printed in the Monster Manual.
function getAbilityModifier(score: AbilityScore): string {
  const n = typeof score === "number" ? score : parseInt(String(score), 10);
  if (Number.isNaN(n)) return "";
  const mod = Math.floor((n - 10) / 2);
  return mod < 0 ? `−${Math.abs(mod)}` : `+${mod}`;
}

const abilityBorder = "border-[rgba(122,18,18,0.2)]";

function StatBlockAbilities({
  className,
  str,
  dex,
  con,
  int,
  wis,
  cha,
  ...props
}: Omit<React.ComponentProps<"table">, "children"> & Partial<Record<Ability, AbilityScore>>) {
  const scores: Record<Ability, AbilityScore> = { str, dex, con, int, wis, cha };
  const present = (a: Ability) => scores[a] !== undefined && scores[a] !== null && scores[a] !== "";

  return (
    <table
      data-slot="stat-block-abilities"
      className={cn(
        "my-[0.625rem] w-full table-fixed border-collapse border bg-[rgba(122,18,18,0.06)] text-center",
        abilityBorder,
        className,
      )}
      {...props}
    >
      <caption className="sr-only">Ability scores</caption>
      <thead>
        <tr>
          {ABILITIES.map((a) => (
            <th
              key={a}
              scope="col"
              className={cn(
                "border-b py-[0.3125rem] font-display text-[0.625rem] font-bold tracking-[0.1em] text-foreground-emphasis uppercase",
                abilityBorder,
              )}
            >
              {a.toUpperCase()}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        <tr>
          {ABILITIES.map((a) => (
            <td
              key={a}
              className="pt-[0.3125rem] pb-0.5 font-sans text-[0.9375rem] font-bold text-foreground"
            >
              {present(a) ? scores[a] : "—"}
            </td>
          ))}
        </tr>
        <tr>
          {ABILITIES.map((a) => (
            <td
              key={a}
              className="pb-[0.3125rem] font-sans text-[0.6875rem] text-foreground-emphasis"
            >
              {present(a) ? getAbilityModifier(scores[a]) : ""}
            </td>
          ))}
        </tr>
      </tbody>
    </table>
  );
}

function StatBlockSection({ className, ...props }: React.ComponentProps<"section">) {
  return <section data-slot="stat-block-section" className={cn("mt-2", className)} {...props} />;
}

function StatBlockSectionTitle({
  className,
  asChild = false,
  ...props
}: React.ComponentProps<"h3"> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "h3";

  return (
    <Comp
      data-slot="stat-block-section-title"
      className={cn(
        "mt-3 mb-2 border-b border-primary pb-1 font-display text-base leading-[1.1] font-bold tracking-[0.02em] text-foreground-emphasis group-data-[size=sm]/stat-block:text-[0.8125rem]",
        className,
      )}
      {...props}
    />
  );
}

function StatBlockTrait({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="stat-block-trait"
      className={cn(
        "mt-1.5 font-sans text-[0.8125rem] leading-[1.55] text-foreground-secondary group-data-[size=sm]/stat-block:text-[0.6875rem]",
        className,
      )}
      {...props}
    />
  );
}

function StatBlockTraitName({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="stat-block-trait-name"
      className={cn("font-bold text-foreground italic", className)}
      {...props}
    />
  );
}

export {
  StatBlock,
  StatBlockHeader,
  StatBlockTitle,
  StatBlockDescription,
  StatBlockSeparator,
  StatBlockProperties,
  StatBlockProperty,
  StatBlockPropertyLabel,
  StatBlockPropertyValue,
  StatBlockAbilities,
  StatBlockSection,
  StatBlockSectionTitle,
  StatBlockTrait,
  StatBlockTraitName,
  getAbilityModifier,
  statBlockVariants,
};
