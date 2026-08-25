"use client";

// Accordion uses useState/useRef/useEffect/createContext internally without a
// 'use client' directive of its own, so it cannot render inside server MDX.
// These thin client wrappers host the examples so the hooks run on the client.

import * as React from "react";
import { Accordion } from "@/registry/new-york/accordion/accordion";

/** Default single mode — opening one item closes the previously open one. */
export function AccordionBasicDemo() {
  return (
    <Accordion defaultValue="origins" style={{ width: "100%", maxWidth: "34rem" }}>
      <Accordion.Item value="origins" title="What does 'Here Be Dragons' mean?">
        Medieval cartographers inked the phrase on the uncharted edges of their maps to mark
        dangerous or unexplored territory.
      </Accordion.Item>
      <Accordion.Item value="usage" title="When should I reach for an accordion?">
        Use it to condense long, secondary content into scannable sections so a reader can expand
        only the parts they need.
      </Accordion.Item>
      <Accordion.Item value="a11y" title="Is it keyboard accessible?">
        Yes — each trigger is a real button with aria-expanded, and Arrow / Home / End keys move
        focus between triggers.
      </Accordion.Item>
    </Accordion>
  );
}

/** Multi mode — items toggle independently and can all be open at once. */
export function AccordionMultiDemo() {
  return (
    <Accordion
      mode="multi"
      defaultValues={["compass", "sextant"]}
      style={{ width: "100%", maxWidth: "34rem" }}
    >
      <Accordion.Item value="compass" title="Compass">
        Points the way north so a navigator can hold a steady bearing.
      </Accordion.Item>
      <Accordion.Item value="sextant" title="Sextant">
        Measures the angle between a star and the horizon to fix latitude.
      </Accordion.Item>
      <Accordion.Item value="astrolabe" title="Astrolabe">
        An older instrument for locating and predicting the positions of stars.
      </Accordion.Item>
    </Accordion>
  );
}

/** Visual variants: bordered, divided, and flush. */
export function AccordionVariantsDemo() {
  return (
    <>
      <Accordion bordered defaultValue="0" style={{ width: "100%", maxWidth: "34rem" }}>
        <Accordion.Item title="Bordered">
          A boxed container with a border around the whole group.
        </Accordion.Item>
        <Accordion.Item title="Second item">
          Sibling content tucked inside the bordered shell.
        </Accordion.Item>
      </Accordion>

      <Accordion divided defaultValue="0" style={{ width: "100%", maxWidth: "34rem" }}>
        <Accordion.Item title="Divided">
          Hairline rules separate each item from the next.
        </Accordion.Item>
        <Accordion.Item title="Second item">
          The divider sits between rows rather than around the group.
        </Accordion.Item>
      </Accordion>

      <Accordion flush defaultValue="0" style={{ width: "100%", maxWidth: "34rem" }}>
        <Accordion.Item title="Flush">
          Chrome stripped back to blend straight into the page.
        </Accordion.Item>
        <Accordion.Item title="Second item">
          No surrounding border, ideal inside an existing card.
        </Accordion.Item>
      </Accordion>
    </>
  );
}

/** A disabled item is dimmed, non-interactive, and skipped by keyboard nav. */
export function AccordionDisabledDemo() {
  return (
    <Accordion defaultValue="available" style={{ width: "100%", maxWidth: "34rem" }}>
      <Accordion.Item value="available" title="Available chapter">
        This section is open and fully interactive.
      </Accordion.Item>
      <Accordion.Item value="locked" title="Locked chapter" disabled>
        You should not be able to reach or open this one.
      </Accordion.Item>
      <Accordion.Item value="next" title="Next chapter">
        Arrow keys jump straight past the locked item above.
      </Accordion.Item>
    </Accordion>
  );
}

/** Controlled single mode — open state lives in React and updates live. */
export function AccordionControlledDemo() {
  const sections = [
    { value: "north", title: "Northern passage" },
    { value: "south", title: "Southern passage" },
    { value: "east", title: "Eastern passage" },
  ];
  const [open, setOpen] = React.useState<string | null>("north");

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "var(--hbd-space-3, 0.75rem)",
        width: "100%",
        maxWidth: "34rem",
      }}
    >
      <Accordion value={open} onValueChange={(v) => setOpen(v as string | null)}>
        {sections.map((s) => (
          <Accordion.Item key={s.value} value={s.value} title={s.title}>
            Charting the {s.title.toLowerCase()} toward the unknown edge of the map.
          </Accordion.Item>
        ))}
      </Accordion>
      <p style={{ margin: 0 }}>
        Open section: <strong>{open ?? "none"}</strong>
      </p>
    </div>
  );
}
