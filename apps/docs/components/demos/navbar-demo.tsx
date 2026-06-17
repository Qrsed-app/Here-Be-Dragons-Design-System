"use client";

// Navbar is a 'use client' component, but it relies on createPortal, focus
// management, scroll-locking and resize listeners for its off-canvas mobile
// menu. These thin client wrappers host the examples so all of that runs on
// the client (server MDX cannot render the portal/effects).

import { Navbar } from "@/registry/new-york/navbar/navbar";
import { Button } from "@/registry/new-york/button/button";

/** Default bar: logo, centred nav links and an actions cluster. */
export function NavbarBasicDemo() {
  return (
    <Navbar style={{ width: "100%" }}>
      <Navbar.Logo>Here Be Dragons</Navbar.Logo>
      <Navbar.Link href="#" active>
        Atlas
      </Navbar.Link>
      <Navbar.Link href="#">Voyages</Navbar.Link>
      <Navbar.Link href="#">Crew</Navbar.Link>
      <Navbar.Link href="#">Lore</Navbar.Link>
      <Navbar.Actions>
        <Button variant="default" size="sm">
          Sign in
        </Button>
        <Button variant="primary" size="sm">
          Set sail
        </Button>
      </Navbar.Actions>
    </Navbar>
  );
}

/** A hairline bottom border instead of the default drop shadow. */
export function NavbarBorderedDemo() {
  return (
    <Navbar bordered style={{ width: "100%" }}>
      <Navbar.Logo>Cartographers' Guild</Navbar.Logo>
      <Navbar.Link href="#" active>
        Maps
      </Navbar.Link>
      <Navbar.Link href="#">Instruments</Navbar.Link>
      <Navbar.Link href="#">Archives</Navbar.Link>
      <Navbar.Actions>
        <Button variant="gold" size="sm">
          Commission
        </Button>
      </Navbar.Actions>
    </Navbar>
  );
}

/** Transparent background with no shadow — for use over a hero image. */
export function NavbarTransparentDemo() {
  return (
    <Navbar transparent style={{ width: "100%" }}>
      <Navbar.Logo>The Leviathan</Navbar.Logo>
      <Navbar.Link href="#" active>
        Deck
      </Navbar.Link>
      <Navbar.Link href="#">Hold</Navbar.Link>
      <Navbar.Link href="#">Charts</Navbar.Link>
      <Navbar.Actions>
        <Button variant="default" size="sm">
          Log
        </Button>
      </Navbar.Actions>
    </Navbar>
  );
}
