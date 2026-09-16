"use client";

import * as React from "react";

import { Field, FieldDescription, FieldLabel } from "@/registry/new-york/field/field";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/registry/new-york/input-otp/input-otp";

export function InputOTPControlledDemo() {
  const [value, setValue] = React.useState("");

  return (
    <Field className="w-fit">
      <FieldLabel htmlFor="otp-controlled">Verification code</FieldLabel>
      <InputOTP id="otp-controlled" maxLength={6} value={value} onChange={setValue}>
        <InputOTPGroup>
          <InputOTPSlot index={0} />
          <InputOTPSlot index={1} />
          <InputOTPSlot index={2} />
        </InputOTPGroup>
        <InputOTPSeparator />
        <InputOTPGroup>
          <InputOTPSlot index={3} />
          <InputOTPSlot index={4} />
          <InputOTPSlot index={5} />
        </InputOTPGroup>
      </InputOTP>
      <FieldDescription>
        {value === "" ? "Enter the 6-digit code we sent by raven." : `You entered: ${value}`}
      </FieldDescription>
    </Field>
  );
}
