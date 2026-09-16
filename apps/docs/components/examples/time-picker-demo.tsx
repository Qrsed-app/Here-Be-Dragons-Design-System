"use client";

import * as React from "react";

import { Field, FieldDescription, FieldError, FieldLabel } from "@/registry/new-york/field/field";
import {
  TimePicker,
  TimePickerContent,
  TimePickerTrigger,
  TimePickerValue,
} from "@/registry/new-york/time-picker/time-picker";

export function TimePickerDemo() {
  return (
    <TimePicker defaultValue="09:30">
      <TimePickerTrigger aria-label="Departure time">
        <TimePickerValue />
      </TimePickerTrigger>
      <TimePickerContent />
    </TimePicker>
  );
}

export function TimePicker12HourDemo() {
  return (
    <TimePicker format="12" defaultValue="14:00">
      <TimePickerTrigger aria-label="Departure time">
        <TimePickerValue />
      </TimePickerTrigger>
      <TimePickerContent />
    </TimePicker>
  );
}

export function TimePickerMinuteStepDemo() {
  return (
    <TimePicker minuteStep={15} defaultValue="08:15">
      <TimePickerTrigger aria-label="Watch change">
        <TimePickerValue />
      </TimePickerTrigger>
      <TimePickerContent />
    </TimePicker>
  );
}

export function TimePickerFieldDemo() {
  return (
    <Field className="w-fit">
      <FieldLabel htmlFor="muster">Muster time</FieldLabel>
      <TimePicker name="muster" defaultValue="06:00">
        <TimePickerTrigger id="muster">
          <TimePickerValue />
        </TimePickerTrigger>
        <TimePickerContent />
      </TimePicker>
      <FieldDescription>Every hand on deck before the tide turns.</FieldDescription>
    </Field>
  );
}

export function TimePickerInvalidDemo() {
  return (
    <div className="inline-block">
      <TimePicker>
        <TimePickerTrigger aria-invalid aria-label="Muster time">
          <TimePickerValue />
        </TimePickerTrigger>
        <TimePickerContent />
      </TimePicker>
      <FieldError className="mt-1">Pick a time before weighing anchor.</FieldError>
    </div>
  );
}

export function TimePickerDisabledDemo() {
  return (
    <TimePicker disabled defaultValue="06:00">
      <TimePickerTrigger aria-label="Locked time">
        <TimePickerValue />
      </TimePickerTrigger>
      <TimePickerContent />
    </TimePicker>
  );
}

export function TimePickerControlledDemo() {
  const [value, setValue] = React.useState("11:45");

  return (
    <div className="flex flex-col items-start gap-2">
      <TimePicker value={value} onValueChange={setValue}>
        <TimePickerTrigger aria-label="Eight bells">
          <TimePickerValue />
        </TimePickerTrigger>
        <TimePickerContent />
      </TimePicker>
      <p className="font-sans text-[0.8125rem] text-muted-foreground">
        Value: {value || "(empty)"}
      </p>
    </div>
  );
}
