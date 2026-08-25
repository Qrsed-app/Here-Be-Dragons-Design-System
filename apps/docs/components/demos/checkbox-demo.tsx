"use client";

// Checkbox uses React hooks (useState/useId/useRef/useEffect) but ships without
// its own 'use client' directive, so it cannot render inside server MDX. These
// thin client wrappers host every example — both the "static" prop showcases and
// the genuinely interactive controlled demos — so the hooks run on the client.

import * as React from "react";
import { Checkbox } from "@/registry/new-york/checkbox/checkbox";

/** Static state showcase: unchecked / checked / indeterminate. */
export function CheckboxStatesDemo() {
  return (
    <>
      <Checkbox>Unchecked</Checkbox>
      <Checkbox defaultChecked>Checked</Checkbox>
      <Checkbox indeterminate>Indeterminate</Checkbox>
    </>
  );
}

/** Static disabled showcase. */
export function CheckboxDisabledDemo() {
  return (
    <>
      <Checkbox disabled>Disabled</Checkbox>
      <Checkbox disabled defaultChecked>
        Disabled &amp; checked
      </Checkbox>
    </>
  );
}

/** Static hint + error showcase. */
export function CheckboxHintErrorDemo() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--hbd-space-4, 1rem)" }}>
      <Checkbox hint="We'll only email you about active voyages.">Subscribe to dispatches</Checkbox>
      <Checkbox error="You must accept the terms to continue.">
        I accept the terms of the voyage
      </Checkbox>
    </div>
  );
}

/** Fully controlled checkbox — state lives in React via checked + onCheckedChange. */
export function CheckboxControlledDemo() {
  const [accepted, setAccepted] = React.useState(false);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--hbd-space-3, 0.75rem)" }}>
      <Checkbox
        checked={accepted}
        onCheckedChange={({ checked }) => setAccepted(checked)}
        hint="Toggle me — the state below stays in sync."
      >
        I accept the terms of the voyage
      </Checkbox>
      <span style={{ font: "var(--hbd-font-ui, inherit)" }}>
        Status: {accepted ? "accepted" : "not accepted"}
      </span>
    </div>
  );
}

/**
 * "Select all" parent with an indeterminate state when only some children
 * are checked. Indeterminate is driven imperatively by the component.
 */
export function CheckboxIndeterminateDemo() {
  const items = ["Compass", "Astrolabe", "Sextant"];
  const [checked, setChecked] = React.useState<string[]>(["Compass"]);

  const allChecked = checked.length === items.length;
  const someChecked = checked.length > 0 && !allChecked;

  const toggleAll = (next: boolean) => setChecked(next ? [...items] : []);
  const toggleOne = (item: string, next: boolean) =>
    setChecked((prev) => (next ? [...prev, item] : prev.filter((i) => i !== item)));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--hbd-space-3, 0.75rem)" }}>
      <Checkbox
        checked={allChecked}
        indeterminate={someChecked}
        onCheckedChange={({ checked }) => toggleAll(checked)}
      >
        Pack all instruments
      </Checkbox>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "var(--hbd-space-2, 0.5rem)",
          paddingInlineStart: "var(--hbd-space-6, 1.5rem)",
        }}
      >
        {items.map((item) => (
          <Checkbox
            key={item}
            checked={checked.includes(item)}
            onCheckedChange={({ checked }) => toggleOne(item, checked)}
          >
            {item}
          </Checkbox>
        ))}
      </div>
    </div>
  );
}
