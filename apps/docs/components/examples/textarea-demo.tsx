"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import { Field, FieldDescription, FieldLabel } from "@/registry/new-york/field/field";
import { Textarea } from "@/registry/new-york/textarea/textarea";

const MAX = 120;

export function TextareaCountDemo() {
  const [value, setValue] = React.useState("Here be dragons.");

  return (
    <Field className="max-w-md">
      <FieldLabel htmlFor="bio">Bio</FieldLabel>
      <Textarea
        id="bio"
        maxLength={MAX}
        value={value}
        onChange={(event) => setValue(event.target.value)}
      />
      <div className="flex items-start justify-between gap-2">
        <FieldDescription>Keep it brief.</FieldDescription>
        <FieldDescription
          aria-live="polite"
          className={cn(
            "ms-auto text-right",
            value.length >= MAX * 0.8 && "text-foreground-gold",
            value.length >= MAX && "font-medium text-foreground-emphasis",
          )}
        >
          {value.length}/{MAX}
        </FieldDescription>
      </div>
    </Field>
  );
}
