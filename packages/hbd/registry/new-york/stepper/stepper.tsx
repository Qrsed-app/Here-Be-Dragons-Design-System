"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const stepperVariants = cva(
  "group/stepper flex w-full items-stretch overflow-hidden rounded-md border border-border-strong font-sans transition-[border-color] duration-120 ease-out focus-within:border-input-focus focus-within:outline-2 focus-within:outline-solid focus-within:outline-offset-2 focus-within:outline-ring has-[input:disabled]:border-border-subtle has-[input:disabled]:bg-surface-subtle has-[input:disabled]:opacity-50 has-[input[aria-invalid=true]]:border-error-border",
  {
    variants: {
      variant: {
        default: "",
        thin: "inline-flex w-auto",
      },
      size: { sm: "", default: "", lg: "" },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

const stepperButtonVariants = cva(
  // The leading follows each text size: tailwind-merge treats a font size as overriding a
  // line height, so a leading declared before it would be dropped.
  "flex shrink-0 cursor-pointer items-center justify-center rounded-none bg-surface-subtle font-sans text-foreground transition-[background-color] duration-120 ease-out outline-none select-none hover:bg-surface-raised active:bg-border-subtle focus-visible:outline-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:text-foreground-disabled",
  {
    variants: {
      size: {
        sm: "min-h-8 w-8 text-[0.8125rem] leading-[1.7]",
        default: "min-h-11 w-8 text-lg leading-[1.7]",
        lg: "min-h-13 w-8 text-[1.0625rem] leading-[1.7]",
      },
      variant: {
        default: "",
        thin: "w-6",
      },
    },
    defaultVariants: { size: "default", variant: "default" },
  },
);

const stepperInputVariants = cva(
  "min-w-0 flex-1 rounded-none bg-background text-center font-mono font-medium text-foreground outline-none [-moz-appearance:textfield] aria-invalid:text-foreground-emphasis disabled:cursor-not-allowed disabled:bg-surface-subtle disabled:text-foreground-disabled [&::-webkit-inner-spin-button]:m-0 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:m-0 [&::-webkit-outer-spin-button]:appearance-none",
  {
    variants: {
      size: {
        sm: "min-h-8 px-2 py-1 text-[0.8125rem] leading-[1.7]",
        default: "min-h-11 px-2 py-2 text-[1.0625rem] leading-[1.7]",
        lg: "min-h-13 px-4 py-3 text-[1.0625rem] leading-[1.7]",
      },
      variant: {
        default: "",
        // content-box: the width is room for the digits, not the padded box.
        thin: "w-5 flex-none box-content",
      },
    },
    defaultVariants: { size: "default", variant: "default" },
  },
);

/** Decimal places of the step, so 0.1 + 0.2 lands on 0.3 rather than 0.30000000000000004. */
function decimals(step: number) {
  const text = String(step);
  const point = text.indexOf(".");
  return point === -1 ? 0 : text.length - point - 1;
}

function Stepper({
  className,
  variant = "default",
  size = "default",
  value: valueProp,
  defaultValue = 0,
  onValueChange,
  min,
  max,
  step = 1,
  disabled,
  onChange,
  onBlur,
  onKeyDown,
  ...props
}: Omit<React.ComponentProps<"input">, "value" | "defaultValue" | "size" | "type"> &
  VariantProps<typeof stepperVariants> & {
    value?: number;
    defaultValue?: number;
    onValueChange?: (value: number) => void;
    min?: number;
    max?: number;
    step?: number;
  }) {
  const [uncontrolled, setUncontrolled] = React.useState(defaultValue);
  const value = valueProp ?? uncontrolled;

  // What the input shows. Typing is free-form — "-", "1.", "" are all valid on the way to a
  // number — so the committed value only follows on a step, an arrow key or blur.
  const [text, setText] = React.useState(() => String(value));
  React.useEffect(() => {
    setText(String(value));
  }, [value]);

  const inputRef = React.useRef<HTMLInputElement>(null);
  const stepSize = Number.isFinite(step) && step > 0 ? step : 1;

  const commit = React.useCallback(
    (next: number) => {
      let clamped = next;
      if (min !== undefined && clamped < min) clamped = min;
      if (max !== undefined && clamped > max) clamped = max;
      const rounded = Number.parseFloat(clamped.toFixed(decimals(stepSize)));
      setText(String(rounded));
      if (valueProp === undefined) setUncontrolled(rounded);
      if (rounded !== value) onValueChange?.(rounded);
    },
    [min, max, stepSize, valueProp, value, onValueChange],
  );

  const nudge = (multiplier: number) => {
    const current = Number.parseFloat(text);
    const base = Number.isFinite(current) ? current : (min ?? 0);
    commit(base + stepSize * multiplier);
  };

  const atMin = Boolean(disabled) || (min !== undefined && value <= min);
  const atMax = Boolean(disabled) || (max !== undefined && value >= max);

  return (
    <div
      data-slot="stepper"
      data-variant={variant}
      data-size={size}
      role="group"
      className={cn(stepperVariants({ variant, size }), className)}
    >
      <button
        type="button"
        data-slot="stepper-decrement"
        aria-label="Decrease"
        tabIndex={-1}
        disabled={atMin}
        className={cn(stepperButtonVariants({ size, variant }), "border-r border-border-subtle")}
        onClick={() => {
          nudge(-1);
          inputRef.current?.focus();
        }}
      >
        {"−"}
      </button>

      <input
        ref={inputRef}
        type="number"
        data-slot="stepper-input"
        inputMode={decimals(stepSize) > 0 ? "decimal" : "numeric"}
        value={text}
        min={min}
        max={max}
        step={stepSize}
        disabled={disabled}
        className={cn(stepperInputVariants({ size, variant }))}
        onChange={(event) => {
          setText(event.target.value);
          onChange?.(event);
        }}
        onBlur={(event) => {
          const parsed = Number.parseFloat(event.target.value);
          if (Number.isFinite(parsed)) commit(parsed);
          else setText(String(value));
          onBlur?.(event);
        }}
        onKeyDown={(event) => {
          onKeyDown?.(event);
          if (event.defaultPrevented || disabled) return;
          switch (event.key) {
            case "ArrowUp":
              event.preventDefault();
              nudge(1);
              break;
            case "ArrowDown":
              event.preventDefault();
              nudge(-1);
              break;
            case "PageUp":
              event.preventDefault();
              nudge(10);
              break;
            case "PageDown":
              event.preventDefault();
              nudge(-10);
              break;
            case "Home":
              if (min !== undefined) {
                event.preventDefault();
                commit(min);
              }
              break;
            case "End":
              if (max !== undefined) {
                event.preventDefault();
                commit(max);
              }
              break;
            default:
              break;
          }
        }}
        {...props}
      />

      <button
        type="button"
        data-slot="stepper-increment"
        aria-label="Increase"
        tabIndex={-1}
        disabled={atMax}
        className={cn(stepperButtonVariants({ size, variant }), "border-l border-border-subtle")}
        onClick={() => {
          nudge(1);
          inputRef.current?.focus();
        }}
      >
        +
      </button>
    </div>
  );
}

export { Stepper, stepperVariants };
