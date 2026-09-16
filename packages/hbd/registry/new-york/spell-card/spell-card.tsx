import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";

import { cn } from "@/lib/utils";

// The school sets three local custom properties that the bar, level badge and
// tags read, so a consumer can also theme a card with their own colours.
const spellCardVariants = cva(
  "group/spell-card relative overflow-hidden border-2 border-border-ink bg-[linear-gradient(135deg,var(--background),var(--surface-subtle))] px-3.5 pt-[calc(3px+0.75rem)] pb-3 font-sans shadow-[4px_4px_0_var(--parchment-400)] outline-none focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-offset-2 focus-visible:outline-ring data-[selected=true]:border-gold data-[selected=true]:shadow-[4px_4px_0_var(--gold-deep)]",
  {
    variants: {
      school: {
        abjuration:
          "[--spell-card-school:var(--school-abjuration)] [--spell-card-school-accent:var(--school-abjuration-accent)] [--spell-card-school-foreground:var(--school-abjuration-foreground)]",
        conjuration:
          "[--spell-card-school:var(--school-conjuration)] [--spell-card-school-accent:var(--school-conjuration-accent)] [--spell-card-school-foreground:var(--school-conjuration-foreground)]",
        divination:
          "[--spell-card-school:var(--school-divination)] [--spell-card-school-accent:var(--school-divination-accent)] [--spell-card-school-foreground:var(--school-divination-foreground)]",
        enchantment:
          "[--spell-card-school:var(--school-enchantment)] [--spell-card-school-accent:var(--school-enchantment-accent)] [--spell-card-school-foreground:var(--school-enchantment-foreground)]",
        evocation:
          "[--spell-card-school:var(--school-evocation)] [--spell-card-school-accent:var(--school-evocation-accent)] [--spell-card-school-foreground:var(--school-evocation-foreground)]",
        illusion:
          "[--spell-card-school:var(--school-illusion)] [--spell-card-school-accent:var(--school-illusion-accent)] [--spell-card-school-foreground:var(--school-illusion-foreground)]",
        necromancy:
          "[--spell-card-school:var(--school-necromancy)] [--spell-card-school-accent:var(--school-necromancy-accent)] [--spell-card-school-foreground:var(--school-necromancy-foreground)]",
        transmutation:
          "[--spell-card-school:var(--school-transmutation)] [--spell-card-school-accent:var(--school-transmutation-accent)] [--spell-card-school-foreground:var(--school-transmutation-foreground)]",
      },
    },
    defaultVariants: {
      school: "evocation",
    },
  },
);

const cornerClassName = "pointer-events-none absolute size-[18px] border-gold";

function SpellCard({
  className,
  school = "evocation",
  selected = false,
  children,
  ...props
}: React.ComponentProps<"article"> &
  VariantProps<typeof spellCardVariants> & {
    selected?: boolean;
  }) {
  return (
    <article
      data-slot="spell-card"
      data-school={school}
      data-selected={selected ? "true" : undefined}
      className={cn(spellCardVariants({ school, className }))}
      {...props}
    >
      <span
        data-slot="spell-card-bar"
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-[3px] bg-[linear-gradient(to_right,var(--spell-card-school),var(--spell-card-school-accent),var(--spell-card-school))]"
      />
      <span
        aria-hidden="true"
        className={cn(cornerClassName, "top-[5px] left-[5px] border-t-[1.5px] border-l-[1.5px]")}
      />
      <span
        aria-hidden="true"
        className={cn(cornerClassName, "top-[5px] right-[5px] border-t-[1.5px] border-r-[1.5px]")}
      />
      <span
        aria-hidden="true"
        className={cn(cornerClassName, "bottom-[5px] left-[5px] border-b-[1.5px] border-l-[1.5px]")}
      />
      <span
        aria-hidden="true"
        className={cn(
          cornerClassName,
          "right-[5px] bottom-[5px] border-r-[1.5px] border-b-[1.5px]",
        )}
      />
      {children}
    </article>
  );
}

function SpellCardLevel({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="spell-card-level"
      className={cn(
        "absolute top-2.5 right-2.5 bg-(--spell-card-school) px-1.5 py-0.5 font-display text-[0.5625rem] tracking-[0.1em] text-(--spell-card-school-foreground) uppercase",
        className,
      )}
      {...props}
    />
  );
}

function SpellCardSchool({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="spell-card-school"
      className={cn(
        "mb-1 font-display text-[0.5625rem] tracking-[0.25em] text-foreground-gold uppercase",
        className,
      )}
      {...props}
    />
  );
}

function SpellCardTitle({
  className,
  asChild = false,
  ...props
}: React.ComponentProps<"h3"> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "h3";

  return (
    <Comp
      data-slot="spell-card-title"
      className={cn(
        "mb-2 font-display text-[1.0625rem] leading-[1.2] font-bold tracking-[0.02em] text-foreground",
        className,
      )}
      {...props}
    />
  );
}

function SpellCardTags({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="spell-card-tags"
      className={cn("mb-2 flex flex-wrap gap-1", className)}
      {...props}
    />
  );
}

function SpellCardTag({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="spell-card-tag"
      className={cn(
        "bg-(--spell-card-school) px-1.5 py-0.5 font-display text-[0.5rem] tracking-[0.1em] text-(--spell-card-school-foreground) uppercase",
        className,
      )}
      {...props}
    />
  );
}

function SpellCardSeparator({ className, ...props }: React.ComponentProps<"hr">) {
  return (
    <hr
      data-slot="spell-card-separator"
      className={cn("my-2 border-t border-dashed border-muted-foreground", className)}
      {...props}
    />
  );
}

function SpellCardMeta({ className, ...props }: React.ComponentProps<"dl">) {
  return (
    <dl
      data-slot="spell-card-meta"
      // 1fr, not grid-cols-2 (minmax(0,1fr)): a long value may widen its column.
      className={cn("mb-2 grid grid-cols-[1fr_1fr] gap-x-2 gap-y-1", className)}
      {...props}
    />
  );
}

function SpellCardMetaItem({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="spell-card-meta-item" className={className} {...props} />;
}

function SpellCardMetaLabel({ className, ...props }: React.ComponentProps<"dt">) {
  return (
    <dt
      data-slot="spell-card-meta-label"
      className={cn(
        "block font-display text-[0.5rem] tracking-[0.2em] text-foreground-emphasis uppercase",
        className,
      )}
      {...props}
    />
  );
}

function SpellCardMetaValue({ className, ...props }: React.ComponentProps<"dd">) {
  return (
    <dd
      data-slot="spell-card-meta-value"
      className={cn("font-sans text-[0.6875rem] text-foreground-secondary", className)}
      {...props}
    />
  );
}

function SpellCardDescription({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="spell-card-description"
      className={cn(
        "font-serif text-[0.6875rem] leading-normal text-foreground-secondary italic",
        className,
      )}
      {...props}
    />
  );
}

function SpellCardHigherLevels({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="spell-card-higher-levels"
      className={cn(
        "mt-2 font-serif text-[0.6875rem] leading-normal text-foreground-secondary",
        className,
      )}
      {...props}
    />
  );
}

function SpellCardHigherLevelsLabel({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="spell-card-higher-levels-label"
      className={cn(
        "font-display text-[0.5rem] tracking-[0.2em] text-foreground-gold uppercase",
        className,
      )}
      {...props}
    />
  );
}

function SpellCardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="spell-card-footer"
      className={cn(
        "mt-2 border-t border-dashed border-muted-foreground pt-2 font-sans text-[0.5rem] tracking-[0.1em] text-muted-foreground uppercase",
        className,
      )}
      {...props}
    />
  );
}

export {
  SpellCard,
  SpellCardLevel,
  SpellCardSchool,
  SpellCardTitle,
  SpellCardTags,
  SpellCardTag,
  SpellCardSeparator,
  SpellCardMeta,
  SpellCardMetaItem,
  SpellCardMetaLabel,
  SpellCardMetaValue,
  SpellCardDescription,
  SpellCardHigherLevels,
  SpellCardHigherLevelsLabel,
  SpellCardFooter,
  spellCardVariants,
};
