"use client";

import { MenuIcon } from "lucide-react";

import { Button } from "@/registry/new-york/button/button";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuList,
} from "@/registry/new-york/navigation-menu/navigation-menu";
import {
  Navbar,
  NavbarActions,
  NavbarInner,
  NavbarLink,
  NavbarLogo,
  NavbarMobileActions,
  NavbarMobileLink,
  NavbarMobileNav,
  NavbarNav,
} from "@/registry/new-york/navbar/navbar";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/registry/new-york/sheet/sheet";

const links = [
  { label: "Atlas", href: "#atlas" },
  { label: "Bestiary", href: "#bestiary", active: true },
  { label: "Spellbook", href: "#spellbook" },
];

export function NavbarDemo() {
  return (
    <Navbar bordered className="rounded-md border border-border-subtle">
      <NavbarInner>
        <NavbarLogo>
          <a href="#navbar">Here Be Dragons</a>
        </NavbarLogo>

        <NavbarNav>
          <NavigationMenu>
            <NavigationMenuList>
              {links.map((link) => (
                <NavigationMenuItem key={link.href}>
                  <NavbarLink href={link.href} active={link.active}>
                    {link.label}
                  </NavbarLink>
                </NavigationMenuItem>
              ))}
            </NavigationMenuList>
          </NavigationMenu>
        </NavbarNav>

        <NavbarActions>
          <Button variant="secondary" size="sm">
            Sign in
          </Button>

          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="secondary"
                size="icon-sm"
                className="md:hidden"
                aria-label="Open navigation menu"
              >
                <MenuIcon />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-full p-0 sm:max-w-sm">
              <SheetHeader className="h-16 border-b border-border-subtle px-4">
                <SheetTitle className="font-display text-[length:clamp(1.0625rem,2.2vw,1.25rem)] font-bold tracking-[0.02em]">
                  Here Be Dragons
                </SheetTitle>
              </SheetHeader>
              <NavbarMobileNav>
                {links.map((link) => (
                  <NavbarMobileLink
                    key={link.href}
                    href={link.href}
                    aria-current={link.active ? "page" : undefined}
                  >
                    {link.label}
                  </NavbarMobileLink>
                ))}
              </NavbarMobileNav>
              <NavbarMobileActions>
                <Button variant="secondary" size="sm">
                  Sign in
                </Button>
              </NavbarMobileActions>
            </SheetContent>
          </Sheet>
        </NavbarActions>
      </NavbarInner>
    </Navbar>
  );
}
