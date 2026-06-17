"use client";

// Stepper uses React hooks (useState/useRef/useMemo/useImperativeHandle) but
// ships without its own 'use client' directive, so it cannot render inside
// server MDX. These thin client wrappers host every example — both the prop
// showcases (which run on their uncontrolled fallback) and the genuinely
// controlled demo — so the hooks run on the client.

import * as React from "react";
import { Stepper } from "@/registry/new-york/stepper/stepper";

/** Basic uncontrolled stepper with a label and bounds. */
export function StepperBasicDemo() {
  return <Stepper label="Quantity" defaultValue="1" min={0} max={10} />;
}

/** Size showcase: sm / md / lg. */
export function StepperSizesDemo() {
  return (
    <>
      <Stepper size="sm" label="Small" defaultValue="1" />
      <Stepper size="md" label="Medium" defaultValue="1" />
      <Stepper size="lg" label="Large" defaultValue="1" />
    </>
  );
}

/** Step + bounds: half-step increments clamped between -1 and 1. */
export function StepperStepDemo() {
  return (
    <Stepper
      label="Rudder trim"
      defaultValue="0"
      min={-1}
      max={1}
      step={0.5}
      hint="Use ± or the arrow keys to adjust in 0.5 steps."
    />
  );
}

/** States: hint, error, and disabled. */
export function StepperStatesDemo() {
  return (
    <>
      <Stepper label="Crew" defaultValue="4" hint="Recommended: 4–8 sailors." min={0} />
      <Stepper label="Rations" defaultValue="0" error="At least one barrel is required." min={0} />
      <Stepper label="Cannons" defaultValue="2" disabled />
    </>
  );
}

/** Fully controlled — value lives in React via value + onValueChange. */
export function StepperControlledDemo() {
  const [value, setValue] = React.useState("3");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--hbd-space-3, 0.75rem)" }}>
      <Stepper
        label="Gold doubloons"
        value={value}
        onValueChange={setValue}
        min={0}
        max={20}
        required
      />
      <span style={{ font: "var(--hbd-font-ui, inherit)" }}>Current haul: {value}</span>
    </div>
  );
}
