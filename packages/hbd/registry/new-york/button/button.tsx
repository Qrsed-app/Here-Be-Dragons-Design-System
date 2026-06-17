import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Spinner } from "@/registry/new-york/spinner/spinner";

// Ported from ds/components/hbd-button.js + ds/styles/components/button.css.
// Variants map to the legacy .hbd-button--{variant}/--{size} classes so the
// de-shadowed button.css reproduces the exact HBD look 1:1. Tailwind utilities
// are NOT used for the visual design here — the token-backed component CSS is.
const buttonVariants = cva("hbd-button", {
  variants: {
    variant: {
      default: "hbd-button--default",
      primary: "hbd-button--primary",
      gold: "hbd-button--gold",
    },
    size: {
      sm: "hbd-button--sm",
      md: "hbd-button--md",
      lg: "hbd-button--lg",
    },
    iconOnly: { true: "hbd-button--icon-only", false: "" },
  },
  defaultVariants: { variant: "primary", size: "md", iconOnly: false },
});

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  /** Render as the child element (Radix Slot) instead of a <button>. */
  asChild?: boolean;
  /** Show the loading spinner overlay; also disables the button. */
  loading?: boolean;
  /** Toggle "on" state (renders the pressed look + aria-pressed). */
  pressed?: boolean;
  /** Icon-only buttons MUST also receive an aria-label. */
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      iconOnly,
      asChild = false,
      loading = false,
      pressed,
      disabled,
      leftIcon,
      rightIcon,
      children,
      type,
      ...props
    },
    ref,
  ) => {
    const Comp = asChild ? Slot : "button";

    const content = asChild ? (
      children
    ) : (
      <>
        {loading && (
          <Spinner className="hbd-button__spinner" size="sm" variant="inherit" label="Loading" />
        )}
        {!iconOnly && leftIcon ? <span className="hbd-button__icon">{leftIcon}</span> : null}
        {children}
        {!iconOnly && rightIcon ? <span className="hbd-button__icon">{rightIcon}</span> : null}
      </>
    );

    return (
      <Comp
        ref={ref}
        type={asChild ? undefined : (type ?? "button")}
        className={cn(
          buttonVariants({ variant, size, iconOnly }),
          pressed && "hbd-button--pressed",
          loading && "is-loading",
          disabled && "is-disabled",
          className,
        )}
        disabled={asChild ? undefined : disabled || loading}
        aria-busy={loading || undefined}
        aria-pressed={pressed}
        {...props}
      >
        {content}
      </Comp>
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
