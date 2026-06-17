"use client";

import * as React from "react";
import { Callout } from "@/registry/new-york/callout/callout";

/**
 * Dismissible callout — clicking the dismiss button collapses the callout and
 * unmounts it once the transition ends. A reset button brings it back so the
 * interaction can be replayed.
 */
export function CalloutDismissibleDemo() {
  const [dismissed, setDismissed] = React.useState(false);

  if (dismissed) {
    return (
      <Callout variant="info">
        Message dismissed.{" "}
        <button
          type="button"
          onClick={() => setDismissed(false)}
          style={{
            background: "none",
            border: "none",
            padding: 0,
            font: "inherit",
            color: "inherit",
            textDecoration: "underline",
            cursor: "pointer",
          }}
        >
          Show it again
        </button>
      </Callout>
    );
  }

  return (
    <Callout
      variant="warning"
      title="Uncharted waters ahead"
      dismissible
      onDismiss={() => setDismissed(true)}
    >
      Your voyage strays beyond the mapped coastline. Dismiss this notice to proceed at your own
      peril.
    </Callout>
  );
}
