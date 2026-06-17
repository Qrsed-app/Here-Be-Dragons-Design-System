"use client";

// StepperNav relies on React hooks (useControllableState → useState) but ships
// without its own 'use client' directive, so it cannot render inside server
// MDX. These thin client wrappers host every example — both the static prop
// showcases (which run on their uncontrolled fallback) and the genuinely
// interactive non-linear demo — so the hooks run on the client.

import * as React from "react";
import {
  StepperNav,
  StepperNavStep,
  type StepChangeDetail,
} from "@/registry/new-york/stepper-nav/stepper-nav";

const VOYAGE_STEPS = [
  { label: "Character", description: "Name and race" },
  { label: "Class", description: "Pick a calling" },
  { label: "Abilities", description: "Roll your stats" },
  { label: "Review", description: "Set sail" },
];

/** Horizontal stepper with the second step active. */
export function StepperNavHorizontalDemo() {
  return <StepperNav steps={VOYAGE_STEPS} activeStep={1} />;
}

/** Vertical orientation of the same flow. */
export function StepperNavVerticalDemo() {
  return <StepperNav variant="vertical" steps={VOYAGE_STEPS} activeStep={2} />;
}

/** Explicit error status override on a single step. */
export function StepperNavErrorDemo() {
  return (
    <StepperNav activeStep={2}>
      <StepperNavStep label="Character" description="Name and race" />
      <StepperNavStep label="Class" description="Pick a calling" />
      <StepperNavStep label="Abilities" description="Invalid stat roll" status="error" />
      <StepperNavStep label="Review" description="Set sail" />
    </StepperNav>
  );
}

/** Non-linear, fully controlled: completed steps become clickable buttons. */
export function StepperNavControlledDemo() {
  const [active, setActive] = React.useState(2);

  const handleChange = (detail: StepChangeDetail) => {
    setActive(detail.step);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--hbd-space-3, 0.75rem)" }}>
      <StepperNav
        mode="non-linear"
        steps={VOYAGE_STEPS}
        activeStep={active}
        onStepChange={handleChange}
      />
      <span style={{ font: "var(--hbd-font-ui, inherit)" }}>
        Active step: {active + 1} — {VOYAGE_STEPS[active]?.label}
      </span>
    </div>
  );
}
