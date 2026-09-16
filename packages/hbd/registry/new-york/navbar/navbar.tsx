import * as React from "react";

import { cn } from "@/lib/utils";
import { NavigationMenuLink } from "@/registry/new-york/navigation-menu/navigation-menu";

function Navbar({
  className,
  sticky = false,
  transparent = false,
  bordered = false,
  ...props
}: React.ComponentProps<"header"> & {
  sticky?: boolean;
  transparent?: boolean;
  bordered?: boolean;
}) {
  return (
    <header
      data-slot="navbar"
      role="banner"
      className={cn(
        "z-50 block h-16 w-full bg-background font-sans shadow-sm",
        sticky && "sticky top-0",
        transparent && "bg-transparent shadow-none",
        bordered && "border-b border-border-subtle shadow-none",
        className,
      )}
      {...props}
    />
  );
}

function NavbarInner({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="navbar-inner"
      className={cn(
        "mx-auto flex h-full max-w-[68.75rem] items-center justify-between gap-4 px-[clamp(1rem,4vw,3rem)]",
        className,
      )}
      {...props}
    />
  );
}

function NavbarLogo({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="navbar-logo"
      className={cn(
        "flex shrink-0 items-center gap-2 font-display text-[length:clamp(1.0625rem,2.2vw,1.25rem)] leading-[1.1] font-bold tracking-[0.02em] text-foreground no-underline [&_a]:inline-flex [&_a]:items-center [&_a]:gap-2 [&_a]:text-inherit [&_a]:no-underline",
        className,
      )}
      {...props}
    />
  );
}

// Holds the NavigationMenu. Hidden below the mobile breakpoint, where the Sheet takes over.
function NavbarNav({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="navbar-nav"
      className={cn("hidden flex-1 items-center justify-center md:flex", className)}
      {...props}
    />
  );
}

function NavbarLink({ className, ...props }: React.ComponentProps<typeof NavigationMenuLink>) {
  return (
    <NavigationMenuLink
      data-slot="navbar-link"
      className={cn(
        "flex-row items-center gap-1 px-3 py-2 font-medium text-foreground-secondary",
        className,
      )}
      {...props}
    />
  );
}

function NavbarActions({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="navbar-actions"
      className={cn("flex shrink-0 items-center gap-2", className)}
      {...props}
    />
  );
}

function NavbarMobileNav({ className, ...props }: React.ComponentProps<"nav">) {
  return (
    <nav
      data-slot="navbar-mobile-nav"
      className={cn(
        "flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto overscroll-contain p-4",
        className,
      )}
      {...props}
    />
  );
}

function NavbarMobileLink({ className, ...props }: React.ComponentProps<"a">) {
  return (
    <a
      data-slot="navbar-mobile-link"
      className={cn(
        "flex min-h-11 w-full items-center gap-2 rounded-md px-4 py-3 font-sans text-[1.0625rem] font-medium text-foreground-secondary no-underline transition-[color,background-color] duration-120 ease-out outline-none hover:bg-surface-subtle hover:text-foreground focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring aria-[current=page]:bg-surface-subtle aria-[current=page]:font-semibold aria-[current=page]:text-foreground-emphasis",
        className,
      )}
      {...props}
    />
  );
}

function NavbarMobileActions({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="navbar-mobile-actions"
      className={cn(
        "flex shrink-0 flex-col gap-2 border-t border-border-subtle px-4 py-3 empty:hidden",
        className,
      )}
      {...props}
    />
  );
}

export {
  Navbar,
  NavbarInner,
  NavbarLogo,
  NavbarNav,
  NavbarLink,
  NavbarActions,
  NavbarMobileNav,
  NavbarMobileLink,
  NavbarMobileActions,
};
