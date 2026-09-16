import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";

import { cn } from "@/lib/utils";

// variant="inverted" is a fixed ink-900 scheme, independent of the page theme;
// every part re-tints itself through group-data-[variant=inverted]/full-banner.
const fullBannerVariants = cva(
  "group/full-banner flex min-h-screen items-center justify-center px-[clamp(1rem,4vw,3rem)] py-8 text-center font-sans",
  {
    variants: {
      variant: {
        default: "bg-background text-foreground",
        inverted: "bg-ink-900 text-parchment-50",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

function FullBanner({
  className,
  variant = "default",
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof fullBannerVariants>) {
  return (
    <div
      data-slot="full-banner"
      data-variant={variant}
      className={cn(fullBannerVariants({ variant, className }))}
      {...props}
    />
  );
}

function FullBannerContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="full-banner-content"
      className={cn("flex w-full max-w-[560px] flex-col items-center gap-4", className)}
      {...props}
    />
  );
}

// opacity-70: decorative illustration, exempt from contrast rules — the title
// carries the meaning.
const fullBannerMediaVariants = cva(
  "mb-2 inline-flex size-24 shrink-0 items-center justify-center opacity-70 [&_svg]:block [&_svg]:size-full",
  {
    variants: {
      variant: {
        default:
          "text-muted-foreground group-data-[variant=inverted]/full-banner:text-parchment-300",
        destructive: "text-error-border group-data-[variant=inverted]/full-banner:text-crimson-300",
        success: "text-success-border group-data-[variant=inverted]/full-banner:text-forest-300",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

function FullBannerMedia({
  className,
  variant = "default",
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof fullBannerMediaVariants>) {
  return (
    <div
      data-slot="full-banner-media"
      data-variant={variant}
      aria-hidden="true"
      className={cn(fullBannerMediaVariants({ variant, className }))}
      {...props}
    />
  );
}

const fullBannerEyebrowVariants = cva(
  "font-sans text-[0.8125rem] font-semibold tracking-[0.3em] uppercase",
  {
    variants: {
      variant: {
        default:
          "text-muted-foreground group-data-[variant=inverted]/full-banner:text-parchment-300",
        primary: "text-foreground-emphasis group-data-[variant=inverted]/full-banner:text-gold-300",
        warning: "text-warning-icon group-data-[variant=inverted]/full-banner:text-gold-300",
        destructive: "text-error-border group-data-[variant=inverted]/full-banner:text-crimson-300",
        success: "text-success-border group-data-[variant=inverted]/full-banner:text-forest-300",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

function FullBannerEyebrow({
  className,
  variant = "default",
  ...props
}: React.ComponentProps<"p"> & VariantProps<typeof fullBannerEyebrowVariants>) {
  return (
    <p
      data-slot="full-banner-eyebrow"
      data-variant={variant}
      className={cn(fullBannerEyebrowVariants({ variant, className }))}
      {...props}
    />
  );
}

function FullBannerTitle({
  className,
  asChild = false,
  ...props
}: React.ComponentProps<"h1"> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "h1";

  return (
    <Comp
      data-slot="full-banner-title"
      className={cn(
        "font-display text-[length:clamp(clamp(1.375rem,3vw,1.75rem),5vw,clamp(2rem,4.5vw,2.5rem))] leading-[1.1] font-bold tracking-[0.02em] text-foreground group-data-[variant=inverted]/full-banner:text-parchment-50",
        className,
      )}
      {...props}
    />
  );
}

function FullBannerDescription({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="full-banner-description"
      className={cn(
        "max-w-[440px] font-serif text-[1.0625rem] leading-[1.7] text-muted-foreground group-data-[variant=inverted]/full-banner:text-parchment-200",
        className,
      )}
      {...props}
    />
  );
}

function FullBannerActions({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="full-banner-actions"
      className={cn("flex flex-wrap items-center justify-center gap-2", className)}
      {...props}
    />
  );
}

function FullBannerMeta({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="full-banner-meta"
      className={cn(
        "mt-4 font-sans text-[0.6875rem] text-muted-foreground group-data-[variant=inverted]/full-banner:text-parchment-200",
        className,
      )}
      {...props}
    />
  );
}

export {
  FullBanner,
  FullBannerContent,
  FullBannerMedia,
  FullBannerEyebrow,
  FullBannerTitle,
  FullBannerDescription,
  FullBannerActions,
  FullBannerMeta,
  fullBannerVariants,
};
