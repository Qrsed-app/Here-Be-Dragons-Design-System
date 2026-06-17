"use client";

import * as React from "react";
import { DatePicker } from "@/registry/new-york/date-picker/date-picker";

/**
 * Single-date variant (default). Opening snapshots the saved value into a
 * pending working copy; Confirm commits and closes, Cancel/Escape discards.
 */
export function DatePickerBasicDemo() {
  return (
    <div style={{ minWidth: "18rem" }}>
      <DatePicker
        label="Departure date"
        placeholder="Select a date"
        defaultValue="1492-08-03"
        hint="When the fleet sets sail."
      />
    </div>
  );
}

/**
 * The three variants: single date, date + embedded time picker, and a
 * start/end range with hover-preview.
 */
export function DatePickerVariantsDemo() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "var(--hbd-space-4, 1rem)",
        minWidth: "18rem",
      }}
    >
      <DatePicker variant="date" label="Date" placeholder="Pick a day" />
      <DatePicker variant="date-time" label="Date & time" placeholder="Pick a moment" />
      <DatePicker
        variant="date-range"
        label="Voyage span"
        placeholder="Pick a range"
        defaultValueStart="1492-08-03"
        defaultValueEnd="1492-10-12"
      />
    </div>
  );
}

/**
 * Hint, error (sets aria-invalid + the error state), required, and disabled.
 */
export function DatePickerStatesDemo() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "var(--hbd-space-4, 1rem)",
        minWidth: "18rem",
      }}
    >
      <DatePicker
        label="Provisioning date"
        placeholder="Select a date"
        hint="Stock the hold before this day."
      />
      <DatePicker
        label="Charter date"
        placeholder="Select a date"
        required
        error="A charter date is required before departure."
      />
      <DatePicker
        label="Locked date"
        placeholder="Select a date"
        disabled
        defaultValue="1492-08-03"
      />
    </div>
  );
}

/**
 * min / max bound the selectable range; out-of-bounds days and month-nav past
 * the bounds are disabled.
 */
export function DatePickerBoundedDemo() {
  return (
    <div style={{ minWidth: "18rem" }}>
      <DatePicker
        label="Within the season"
        placeholder="Select a date"
        min="1492-08-01"
        max="1492-08-31"
        defaultValue="1492-08-15"
        hint="Only August 1492 is selectable."
      />
    </div>
  );
}

/**
 * Fully controlled — the committed ISO value lives in React via
 * value + onValueChange, mirrored in the readout below.
 */
export function DatePickerControlledDemo() {
  const [value, setValue] = React.useState<string | null>("1492-10-12");

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "var(--hbd-space-3, 0.75rem)",
        minWidth: "18rem",
      }}
    >
      <DatePicker
        label="Landfall"
        placeholder="Select a date"
        value={value ?? undefined}
        onValueChange={setValue}
      />
      <span style={{ font: "var(--hbd-font-ui, inherit)" }}>Value: {value || "(empty)"}</span>
    </div>
  );
}
