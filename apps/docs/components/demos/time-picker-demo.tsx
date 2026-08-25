"use client";

import * as React from "react";
import { TimePicker } from "@/registry/new-york/time-picker/time-picker";

/**
 * Basic uncontrolled 24-hour picker. Click the trigger to open the panel, then
 * pick an hour and minute (or click the header numbers to type) and Confirm.
 */
export function TimePickerBasicDemo() {
  return (
    <div style={{ minWidth: "18rem" }}>
      <TimePicker aria-label="Departure time" defaultValue="09:30" />
    </div>
  );
}

/** 24-hour and 12-hour (AM·PM) formats side by side. */
export function TimePickerFormatsDemo() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "var(--hbd-space-4, 1rem)",
        minWidth: "18rem",
      }}
    >
      <TimePicker aria-label="24-hour time" format="24" defaultValue="14:00" />
      <TimePicker aria-label="12-hour time" format="12" defaultValue="14:00" />
    </div>
  );
}

/** A coarser minute column via minuteStep (here every 15 minutes). */
export function TimePickerStepDemo() {
  return (
    <div style={{ minWidth: "18rem" }}>
      <TimePicker aria-label="Watch change" minuteStep={15} defaultValue="08:15" />
    </div>
  );
}

/** Error and disabled states. */
export function TimePickerStatesDemo() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "var(--hbd-space-4, 1rem)",
        minWidth: "18rem",
      }}
    >
      <TimePicker aria-label="Muster time" error="Pick a time before weighing anchor." />
      <TimePicker aria-label="Locked time" disabled defaultValue="06:00" />
    </div>
  );
}

/**
 * Fully controlled — the committed value lives in React via value +
 * onValueChange, shown below and updated on Confirm.
 */
export function TimePickerControlledDemo() {
  const [value, setValue] = React.useState<string | null>("11:45");

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "var(--hbd-space-3, 0.75rem)",
        minWidth: "18rem",
      }}
    >
      <TimePicker aria-label="Eight bells" value={value} onValueChange={setValue} />
      <span style={{ font: "var(--hbd-font-ui, inherit)" }}>Value: {value ?? "(empty)"}</span>
    </div>
  );
}
