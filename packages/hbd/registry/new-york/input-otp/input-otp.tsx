"use client";

import * as React from "react";
import { OTPInput, OTPInputContext } from "input-otp";

import { cn } from "@/lib/utils";

function InputOTP({
  className,
  containerClassName,
  value,
  defaultValue,
  onChange,
  ...props
}: React.ComponentProps<typeof OTPInput> & {
  containerClassName?: string;
}) {
  // input-otp forwards defaultValue to its hidden <input> next to value, which React
  // rejects as both controlled and uncontrolled; keep the uncontrolled value here instead.
  const [uncontrolledValue, setUncontrolledValue] = React.useState(
    typeof defaultValue === "string" ? defaultValue : "",
  );
  const isControlled = value !== undefined;

  return (
    <OTPInput
      data-slot="input-otp"
      containerClassName={cn(
        "group/input-otp flex items-center gap-2 has-disabled:opacity-50",
        containerClassName,
      )}
      className={cn("disabled:cursor-not-allowed", className)}
      value={isControlled ? value : uncontrolledValue}
      onChange={(next: string) => {
        if (!isControlled) setUncontrolledValue(next);
        onChange?.(next);
      }}
      {...props}
    />
  );
}

function InputOTPGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="input-otp-group"
      className={cn("flex items-center gap-2", className)}
      {...props}
    />
  );
}

// aria-invalid / data-valid work on each slot (upstream) or once on <InputOTP>, where
// input-otp forwards them to its hidden input and the group-has rules pick them up.
function InputOTPSlot({
  index,
  className,
  ...props
}: React.ComponentProps<"div"> & {
  index: number;
}) {
  const inputOTPContext = React.useContext(OTPInputContext);
  const { char, hasFakeCaret, isActive } = inputOTPContext?.slots[index] ?? {};

  return (
    <div
      data-slot="input-otp-slot"
      data-active={isActive}
      data-filled={Boolean(char)}
      className={cn(
        "relative flex size-12 items-center justify-center rounded-md border-2 border-border-strong bg-background font-mono text-[length:clamp(1.0625rem,2.2vw,1.25rem)] leading-[1.7] font-semibold text-foreground transition-[border-color,background-color] duration-120 ease-out outline-none",
        "data-[filled=true]:bg-surface-subtle",
        "data-[active=true]:z-10 data-[active=true]:border-input-focus data-[active=true]:outline-2 data-[active=true]:outline-offset-2 data-[active=true]:outline-ring data-[active=true]:outline-solid",
        "aria-invalid:border-error-border aria-invalid:text-foreground-emphasis data-[active=true]:aria-invalid:border-error-border data-[active=true]:aria-invalid:outline-error-border",
        "group-has-[input[aria-invalid=true]]/input-otp:border-error-border group-has-[input[aria-invalid=true]]/input-otp:text-foreground-emphasis group-has-[input[aria-invalid=true]]/input-otp:data-[active=true]:border-error-border group-has-[input[aria-invalid=true]]/input-otp:data-[active=true]:outline-error-border",
        "group-has-[input[data-valid=true]]/input-otp:text-forest-700 group-has-[input[data-valid=true]]/input-otp:data-[filled=true]:border-success-border",
        className,
      )}
      {...props}
    >
      {char}
      {hasFakeCaret && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-5 w-px animate-caret-blink bg-primary duration-1000" />
        </div>
      )}
    </div>
  );
}

function InputOTPSeparator({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="input-otp-separator"
      role="separator"
      className={cn(
        "px-1 font-sans text-[length:clamp(1.0625rem,2.2vw,1.25rem)] leading-[1.7] text-muted-foreground select-none",
        className,
      )}
      {...props}
    >
      –
    </div>
  );
}

export { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator };
