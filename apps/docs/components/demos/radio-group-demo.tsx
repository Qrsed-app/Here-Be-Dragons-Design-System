"use client";

import * as React from "react";
import { RadioGroup } from "@/registry/new-york/radio-group/radio-group";

/**
 * Fully controlled radio group — the selected value lives in React via
 * value + onValueChange. onValueChange receives the legacy { value, name }
 * detail shape, matching the original web component's hbd:change event.
 */
export function RadioGroupControlledDemo() {
  const [value, setValue] = React.useState("sea");

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "var(--hbd-space-3, 0.75rem)",
      }}
    >
      <RadioGroup
        name="route"
        label="Choose your route"
        value={value}
        onValueChange={(detail) => setValue(detail.value)}
        items={[
          { value: "sea", label: "By sea", hint: "Fastest, but storms lie ahead." },
          { value: "land", label: "Overland", hint: "Slower, with safer harbours." },
          { value: "air", label: "By airship", hint: "Costly, yet beyond the dragons." },
        ]}
      />
      <span style={{ font: "var(--hbd-font-ui, inherit)" }}>Selected: {value}</span>
    </div>
  );
}
