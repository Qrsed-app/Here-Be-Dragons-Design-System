"use client";

import * as React from "react";
import { Card } from "@/registry/new-york/card/card";

/**
 * Interactive card — fires onCardClick on click or keyboard (Enter/Space)
 * activation. Mirrors the WC's hbd:click event with detail = { href }.
 */
export function CardInteractiveDemo() {
  const [count, setCount] = React.useState(0);

  return (
    <Card
      variant="interactive"
      title="Eastern Sea Route"
      subtitle="Tap or press Enter / Space"
      onCardClick={() => setCount((c) => c + 1)}
      style={{ maxWidth: "20rem" }}
    >
      <Card.Body>
        Activated {count} {count === 1 ? "time" : "times"}.
      </Card.Body>
    </Card>
  );
}
