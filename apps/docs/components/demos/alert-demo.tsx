"use client";

import * as React from "react";
import { Alert, AlertAction } from "@/registry/new-york/alert/alert";

/**
 * Dismissible alert — clicking the × runs the collapse-on-dismiss exit and
 * fires onDismiss, which unmounts the banner. A "Restore" control brings it
 * back so the demo is repeatable.
 */
export function AlertDismissibleDemo() {
  const [dismissed, setDismissed] = React.useState(false);

  if (dismissed) {
    return <AlertAction onClick={() => setDismissed(false)}>Restore notice</AlertAction>;
  }

  return (
    <Alert variant="success" title="Voyage logged" dismissible onDismiss={() => setDismissed(true)}>
      Your chart has been saved to the ship&apos;s ledger.
    </Alert>
  );
}

/** Alert with an action button slot wired to a handler. */
export function AlertWithActionDemo() {
  const [retries, setRetries] = React.useState(0);

  return (
    <Alert variant="error" title="Failed to reach the harbour master">
      The request timed out after 30 seconds.{" "}
      <AlertAction onClick={() => setRetries((n) => n + 1)}>
        Retry{retries > 0 ? ` (${retries})` : ""}
      </AlertAction>
    </Alert>
  );
}
