"use client";

// The Slider component already ships with its own 'use client' directive, so the
// static prop showcases can render inline inside server MDX. This wrapper hosts
// the genuinely interactive example, where slider state is controlled by React
// hooks (useState + onValueChange) that must run on the client.

import * as React from "react";
import { Slider } from "@/registry/new-york/slider/slider";

/** Fully controlled slider — value lives in React via value + onValueChange. */
export function SliderControlledDemo() {
  const [volume, setVolume] = React.useState(40);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "var(--hbd-space-3, 0.75rem)",
        width: "100%",
        maxWidth: "20rem",
      }}
    >
      <Slider
        label="Volume"
        value={volume}
        onValueChange={(v) => setVolume(v as number)}
        showValue
      />
      <span style={{ font: "var(--hbd-font-ui, inherit)" }}>Current value: {volume}</span>
    </div>
  );
}

/** Controlled two-handle range slider — value is a [low, high] tuple. */
export function SliderRangeDemo() {
  const [price, setPrice] = React.useState<[number, number]>([200, 750]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "var(--hbd-space-3, 0.75rem)",
        width: "100%",
        maxWidth: "20rem",
      }}
    >
      <Slider
        label="Price range"
        range
        min={0}
        max={1000}
        step={50}
        value={price}
        onValueChange={(v) => setPrice(v as [number, number])}
        showValue
        showTicks
        tickCount={5}
      />
      <span style={{ font: "var(--hbd-font-ui, inherit)" }}>
        {price[0]} gold – {price[1]} gold
      </span>
    </div>
  );
}
