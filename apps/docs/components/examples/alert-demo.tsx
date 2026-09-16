"use client";

import * as React from "react";

import { Alert, AlertAction, AlertDescription, AlertTitle } from "@/registry/new-york/alert/alert";
import { Button } from "@/registry/new-york/button/button";

export function AlertDismissibleDemo() {
  const [open, setOpen] = React.useState(true);

  if (!open) {
    return (
      <Button variant="secondary" size="sm" onClick={() => setOpen(true)}>
        Restore notice
      </Button>
    );
  }

  return (
    <Alert variant="success" className="w-full">
      <svg
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <circle cx="8" cy="8" r="6.5" />
        <polyline points="5,8.5 7.2,10.6 11,6.5" />
      </svg>
      <AlertTitle>Voyage logged</AlertTitle>
      <AlertDescription>Your chart has been saved to the ship&apos;s ledger.</AlertDescription>
      <AlertAction>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Dismiss"
          onClick={() => setOpen(false)}
          className="size-12 border-0 text-current opacity-80 hover:bg-transparent hover:text-current hover:opacity-100 focus-visible:outline-current"
        >
          <svg
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <line x1="4" y1="4" x2="12" y2="12" />
            <line x1="12" y1="4" x2="4" y2="12" />
          </svg>
        </Button>
      </AlertAction>
    </Alert>
  );
}
