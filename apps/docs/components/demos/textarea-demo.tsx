"use client";

// Textarea uses React hooks (useState/useRef/useMemo/useLayoutEffect) but ships
// without its own 'use client' directive, so it cannot render inside server MDX.
// These thin client wrappers host every example — both the "static" prop
// showcases and the genuinely interactive controlled demos — so the hooks run on
// the client.

import * as React from "react";
import { Textarea } from "@/registry/new-york/textarea/textarea";

const stackStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "var(--hbd-space-4, 1rem)",
  width: "100%",
  maxWidth: "32rem",
};

/** Basic labelled textarea with a placeholder. */
export function TextareaBasicDemo() {
  return (
    <div style={stackStyle}>
      <Textarea
        label="Captain's log"
        placeholder="Today we sailed past the edge of the map…"
        rows={4}
      />
    </div>
  );
}

/** Size showcase: sm / md / lg. */
export function TextareaSizesDemo() {
  return (
    <div style={stackStyle}>
      <Textarea size="sm" label="Small" placeholder="sm" rows={2} />
      <Textarea size="md" label="Medium" placeholder="md" rows={2} />
      <Textarea size="lg" label="Large" placeholder="lg" rows={2} />
    </div>
  );
}

/** Validation + interaction states. */
export function TextareaStatesDemo() {
  return (
    <div style={stackStyle}>
      <Textarea
        label="With hint"
        hint="Describe the encounter in a sentence or two."
        placeholder="A great wyrm circled the mast…"
      />
      <Textarea label="Notes" error="This entry cannot be left blank." defaultValue="" />
      <Textarea
        label="Notes"
        success="Logged to the ship's archive."
        defaultValue="Calm seas, fair winds, no dragons sighted."
      />
      <Textarea label="Disabled" placeholder="Unavailable" disabled />
      <Textarea label="Read only" defaultValue="Locked entry — cannot edit." readOnly />
    </div>
  );
}

/** Live character counter — announces politely as you type. */
export function TextareaCharCountDemo() {
  return (
    <div style={stackStyle}>
      <Textarea
        label="Bio"
        hint="Keep it brief."
        maxLength={120}
        defaultValue="Here be dragons."
        rows={3}
      />
    </div>
  );
}

/** Auto-resizing field — grows to fit its content as you type. */
export function TextareaAutoresizeDemo() {
  const [value, setValue] = React.useState(
    "This field grows as you type.\nAdd a few more lines to watch it expand.",
  );

  return (
    <div style={stackStyle}>
      <Textarea label="Auto-resize" autoresize value={value} onValueChange={setValue} rows={2} />
    </div>
  );
}

/** Fully controlled textarea — value lives in React via value + onValueChange. */
export function TextareaControlledDemo() {
  const [value, setValue] = React.useState("");

  return (
    <div style={stackStyle}>
      <Textarea
        label="Message"
        placeholder="Write your dispatch…"
        value={value}
        onValueChange={setValue}
      />
      <span style={{ font: "var(--hbd-font-ui, inherit)" }}>
        {value.length} character{value.length === 1 ? "" : "s"} typed
      </span>
    </div>
  );
}
