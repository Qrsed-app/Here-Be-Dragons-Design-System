"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

// Ported from ds/components/hbd-stepper-nav.js + the .hbd-stepper* rules
// extracted from ds/styles/components/stepper.css into stepper-nav.css.
//
// Step-progress nav: a horizontal or vertical row/column of numbered step
// indicators joined by connectors. Each step's status is `active` (the
// current index), `completed` (before it), `upcoming` (after it), or an
// explicit `error` override. The legacy element is <hbd-stepper-nav> but
// its CSS block is `.hbd-stepper*`, so the React markup emits those exact
// BEM classes for a 1:1 render. Tailwind utilities are additive only —
// the token-backed stepper-nav.css is the styling.
//
// API shapes (both supported, mirroring the WC's <hbd-step> children):
//   <StepperNav activeStep={1} onStepChange={({ step, label }) => …}>
//     <StepperNav.Step label="Character" description="Name and race" />
//     <StepperNav.Step label="Class" />
//     <StepperNav.Step label="Abilities" status="error" />
//   </StepperNav>
// or the data-driven form:
//   <StepperNav steps={[{ label: "Character" }, …]} activeStep={1} />
//
// Controlled-first: pass `activeStep` (+ `onStepChange`) for controlled
// use, or `defaultActiveStep` for the uncontrolled fallback. In
// non-linear mode, completed/error indicators render as real <button>s
// that move the active step on click (hbd:change → onStepChange).

// ── useControllableState (inline, controlled-first with uncontrolled fallback)
function useControllableState<T>({
  value,
  defaultValue,
  onChange,
}: {
  value?: T;
  defaultValue: T;
  onChange?: (value: T) => void;
}): [T, (next: T) => void] {
  const [uncontrolled, setUncontrolled] = React.useState<T>(defaultValue);
  const isControlled = value !== undefined;
  const state = isControlled ? (value as T) : uncontrolled;

  const setState = React.useCallback(
    (next: T) => {
      if (!isControlled) setUncontrolled(next);
      onChange?.(next);
    },
    [isControlled, onChange],
  );

  return [state, setState];
}

export type StepperNavVariant = "horizontal" | "vertical";
export type StepperNavMode = "linear" | "non-linear";
export type StepStatus = "upcoming" | "active" | "completed" | "error";

// Explicit per-step status override (mirrors <hbd-step status="…">).
export type StepStatusOverride = "completed" | "error" | "upcoming" | "active";

// detail payload carried by the legacy hbd:change event.
export interface StepChangeDetail {
  step: number;
  label: string;
}

const stepperVariants = cva("hbd-stepper", {
  variants: {
    variant: {
      horizontal: "hbd-stepper--horizontal",
      vertical: "hbd-stepper--vertical",
    },
    mode: {
      linear: "",
      "non-linear": "hbd-stepper--non-linear",
    },
  },
  defaultVariants: { variant: "horizontal", mode: "linear" },
});

// ── <StepperNav.Step> — data carrier (no visual rendering of its own).
// Mirrors <hbd-step>: the parent owns the rendered DOM, this just holds
// label/description/optional explicit status.
export interface StepperNavStepProps {
  /** Visible step label. */
  label?: string;
  /** Secondary line shown under the label. */
  description?: string;
  /** Explicit status override; otherwise derived from the active index. */
  status?: StepStatusOverride;
}

const StepperNavStep: React.FC<StepperNavStepProps> = () => null;
StepperNavStep.displayName = "StepperNav.Step";

// Item form of the same data, for the `steps[]` prop.
export interface StepItem {
  label?: string;
  description?: string;
  status?: StepStatusOverride;
}

// ── Icons (carried verbatim from the WC's _iconFor) ──────────────────
const CheckIcon = () => (
  <span className="hbd-stepper__indicator-icon" aria-hidden="true">
    <svg
      viewBox="0 0 16 16"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="3 8.5 7 12 13 5" />
    </svg>
  </span>
);

const ErrorIcon = () => (
  <span className="hbd-stepper__indicator-icon" aria-hidden="true">
    <svg
      viewBox="0 0 16 16"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="8" y1="4" x2="8" y2="9" />
      <line x1="8" y1="12" x2="8" y2="12" />
    </svg>
  </span>
);

export interface StepperNavProps
  extends
    Omit<React.HTMLAttributes<HTMLElement>, "onChange">,
    VariantProps<typeof stepperVariants> {
  /** Controlled 0-based index of the current step. */
  activeStep?: number;
  /** Uncontrolled initial active index (default 0). */
  defaultActiveStep?: number;
  /** Data-driven steps; alternative to <StepperNav.Step> children. */
  steps?: StepItem[];
  /** Fired when a non-linear indicator is clicked (hbd:change). */
  onStepChange?: (detail: StepChangeDetail) => void;
  /** <StepperNav.Step> children (ignored when `steps` is provided). */
  children?: React.ReactNode;
}

// Collect step data from either the `steps` prop or <StepperNav.Step> kids.
function collectSteps(steps: StepItem[] | undefined, children: React.ReactNode): StepItem[] {
  if (steps) return steps;
  const out: StepItem[] = [];
  React.Children.forEach(children, (child) => {
    if (!React.isValidElement(child)) return;
    if (child.type !== StepperNavStep) return;
    const p = child.props as StepperNavStepProps;
    out.push({
      label: p.label,
      description: p.description,
      status: p.status,
    });
  });
  return out;
}

const StepperNavRoot = React.forwardRef<HTMLElement, StepperNavProps>(
  (
    {
      className,
      variant,
      mode,
      activeStep: activeStepProp,
      defaultActiveStep = 0,
      steps,
      onStepChange,
      children,
      ...props
    },
    ref,
  ) => {
    const resolvedMode: StepperNavMode = mode === "non-linear" ? "non-linear" : "linear";

    const items = collectSteps(steps, children);
    const total = items.length;

    const [active, setActive] = useControllableState<number>({
      value: activeStepProp,
      defaultValue: defaultActiveStep,
    });

    const fireChange = (index: number) => {
      const label = items[index]?.label ?? "";
      onStepChange?.({ step: index, label });
    };

    // Status computation mirrors the WC's _statusFor: explicit status wins,
    // otherwise derive from the active index.
    const statusFor = (item: StepItem, index: number): StepStatus => {
      if (item.status) return item.status;
      if (index < active) return "completed";
      if (index === active) return "active";
      return "upcoming";
    };

    const handleIndicatorClick = (index: number) => {
      if (index === active) return;
      setActive(index);
      fireChange(index);
    };

    return (
      <nav
        ref={ref}
        className={cn(stepperVariants({ variant, mode }), className)}
        aria-label="Progress steps"
        {...props}
      >
        <ol className="hbd-stepper__list">
          {items.map((item, index) => {
            const label = item.label ?? "";
            const description = item.description ?? "";
            const status = statusFor(item, index);
            const isLast = index === total - 1;

            const clickable =
              resolvedMode === "non-linear" && (status === "completed" || status === "error");

            let indicatorInner: React.ReactNode;
            if (status === "completed") indicatorInner = <CheckIcon />;
            else if (status === "error") indicatorInner = <ErrorIcon />;
            else indicatorInner = index + 1;

            // SR-only status prefix so progress reaches AT without colour.
            let srStatus: React.ReactNode = null;
            if (status === "error") {
              srStatus = <span className="hbd-sr-only">Error: </span>;
            } else if (status === "completed") {
              srStatus = <span className="hbd-sr-only">Completed: </span>;
            }

            return (
              <li
                key={index}
                className={cn("hbd-stepper__step", `hbd-stepper__step--${status}`)}
                aria-current={index === active ? "step" : undefined}
              >
                {clickable ? (
                  <button
                    className="hbd-stepper__indicator"
                    type="button"
                    data-step={index}
                    aria-label={`Go to step ${index + 1}: ${label}`}
                    onClick={() => handleIndicatorClick(index)}
                  >
                    {indicatorInner}
                  </button>
                ) : (
                  <div className="hbd-stepper__indicator" aria-hidden="true">
                    {indicatorInner}
                  </div>
                )}
                <div className="hbd-stepper__content">
                  <div className="hbd-stepper__label">
                    {srStatus}
                    {label}
                  </div>
                  {description ? (
                    <div className="hbd-stepper__description">{description}</div>
                  ) : null}
                </div>
                {!isLast ? <div className="hbd-stepper__connector" aria-hidden="true" /> : null}
              </li>
            );
          })}
        </ol>
      </nav>
    );
  },
);
StepperNavRoot.displayName = "StepperNav";

// Compound export: <StepperNav> + <StepperNav.Step>.
const StepperNav = Object.assign(StepperNavRoot, { Step: StepperNavStep });

export { StepperNav, StepperNavStep, stepperVariants };
