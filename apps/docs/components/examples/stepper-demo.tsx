"use client";

import * as React from "react";

import { Field, FieldDescription, FieldError, FieldLabel } from "@/registry/new-york/field/field";
import { Stepper } from "@/registry/new-york/stepper/stepper";

export function StepperDemo() {
  return (
    <Field className="w-64">
      <FieldLabel htmlFor="quantity">Quantity</FieldLabel>
      <Stepper id="quantity" defaultValue={1} min={0} max={10} />
      <FieldDescription>Between 0 and 10.</FieldDescription>
    </Field>
  );
}

export function StepperSizesDemo() {
  return (
    <div className="flex w-64 flex-col gap-4">
      <Stepper size="sm" defaultValue={1} min={0} max={10} aria-label="Small" />
      <Stepper defaultValue={1} min={0} max={10} aria-label="Default" />
      <Stepper size="lg" defaultValue={1} min={0} max={10} aria-label="Large" />
    </div>
  );
}

export function StepperThinDemo() {
  return (
    <div className="flex items-start gap-4">
      <div className="inline-flex flex-col items-start gap-1 font-sans">
        <FieldLabel htmlFor="spell-level">Spell level</FieldLabel>
        <Stepper id="spell-level" variant="thin" defaultValue={3} min={1} max={9} />
      </div>
      <div className="inline-flex flex-col items-start gap-1 font-sans">
        <FieldLabel htmlFor="character-level">Character level</FieldLabel>
        <Stepper id="character-level" variant="thin" defaultValue={1} min={1} max={20} />
      </div>
    </div>
  );
}

export function StepperStepDemo() {
  return (
    <Field className="w-64">
      <FieldLabel htmlFor="trim">Rudder trim</FieldLabel>
      <Stepper id="trim" defaultValue={0} min={-1} max={1} step={0.5} />
      <FieldDescription>Half-step increments between -1 and 1.</FieldDescription>
    </Field>
  );
}

export function StepperInvalidDemo() {
  return (
    <Field className="w-64" data-invalid="true">
      <FieldLabel htmlFor="rations">Rations</FieldLabel>
      <Stepper id="rations" aria-invalid defaultValue={0} min={0} />
      <FieldError>At least one barrel is required.</FieldError>
    </Field>
  );
}

export function StepperDisabledDemo() {
  return (
    <Field className="w-64" data-disabled="true">
      <FieldLabel htmlFor="cannons">Cannons</FieldLabel>
      <Stepper id="cannons" disabled defaultValue={2} />
      <FieldDescription>Sealed by the quartermaster.</FieldDescription>
    </Field>
  );
}

export function StepperControlledDemo() {
  const [value, setValue] = React.useState(3);

  return (
    <Field className="w-64">
      <FieldLabel htmlFor="doubloons">Gold doubloons</FieldLabel>
      <Stepper id="doubloons" value={value} onValueChange={setValue} min={0} max={20} />
      <FieldDescription>Current haul: {value}</FieldDescription>
    </Field>
  );
}
