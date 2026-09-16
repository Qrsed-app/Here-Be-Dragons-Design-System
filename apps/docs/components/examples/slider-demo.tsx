"use client";

import * as React from "react";

import { Field, FieldLabel } from "@/registry/new-york/field/field";
import { Slider } from "@/registry/new-york/slider/slider";

export function SliderControlledDemo() {
  const [volume, setVolume] = React.useState([40]);

  return (
    <Field className="max-w-80 gap-2">
      <div className="flex items-baseline justify-between">
        <FieldLabel id="volume-label">Volume</FieldLabel>
        <span className="min-w-8 text-right font-mono text-[0.8125rem] text-muted-foreground">
          {volume[0]}
        </span>
      </div>
      <Slider value={volume} onValueChange={setVolume} aria-labelledby="volume-label" />
    </Field>
  );
}
