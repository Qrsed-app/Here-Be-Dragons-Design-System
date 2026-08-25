"use client";

import * as React from "react";
import { OtpInput } from "@/registry/new-york/otp-input/otp-input";

/**
 * Fully controlled OTP — the joined value lives in React via
 * value + onValueChange, and onComplete fires once every cell is filled.
 */
export function OtpInputControlledDemo() {
  const [code, setCode] = React.useState("");
  const [verified, setVerified] = React.useState(false);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--hbd-space-3, 0.75rem)" }}>
      <OtpInput
        label="Verification code"
        length={6}
        value={code}
        onValueChange={(next) => {
          setCode(next);
          setVerified(false);
        }}
        onComplete={() => setVerified(true)}
        hint="Enter the 6-digit code we sent to your raven."
      />
      <span style={{ font: "var(--hbd-font-ui, inherit)" }}>
        Value: {code || "(empty)"} {verified ? "— complete" : ""}
      </span>
    </div>
  );
}
