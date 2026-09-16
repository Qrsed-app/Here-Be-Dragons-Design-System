"use client";

import * as React from "react";
import { CheckIcon } from "lucide-react";

import { Button } from "@/registry/new-york/button/button";
import {
  StepperNav,
  StepperNavContent,
  StepperNavDescription,
  StepperNavIndicator,
  StepperNavItem,
  StepperNavList,
  StepperNavSeparator,
  StepperNavTitle,
} from "@/registry/new-york/stepper-nav/stepper-nav";

const steps = [
  { title: "Character", description: "Name and race" },
  { title: "Class", description: "Path and powers" },
  { title: "Abilities", description: "Roll the dice" },
  { title: "Review", description: "Seal the sheet" },
];

export function StepperNavDemo() {
  const [active, setActive] = React.useState(1);

  return (
    <div className="flex w-full flex-col gap-6">
      <StepperNav>
        <StepperNavList>
          {steps.map((step, i) => {
            const status = i < active ? "completed" : i === active ? "active" : "upcoming";
            return (
              <StepperNavItem key={step.title} status={status}>
                {status === "completed" ? (
                  <StepperNavIndicator asChild>
                    <button
                      type="button"
                      aria-label={`Go back to step ${i + 1}: ${step.title}`}
                      onClick={() => setActive(i)}
                    >
                      <CheckIcon />
                    </button>
                  </StepperNavIndicator>
                ) : (
                  <StepperNavIndicator aria-hidden="true">{i + 1}</StepperNavIndicator>
                )}
                <StepperNavContent>
                  <StepperNavTitle>
                    {status === "completed" ? <span className="sr-only">Completed: </span> : null}
                    {step.title}
                  </StepperNavTitle>
                  <StepperNavDescription>{step.description}</StepperNavDescription>
                </StepperNavContent>
                {i < steps.length - 1 ? <StepperNavSeparator /> : null}
              </StepperNavItem>
            );
          })}
        </StepperNavList>
      </StepperNav>

      <div className="flex justify-center gap-2">
        <Button
          variant="secondary"
          size="sm"
          disabled={active === 0}
          onClick={() => setActive((s) => Math.max(0, s - 1))}
        >
          Back
        </Button>
        <Button
          size="sm"
          disabled={active === steps.length - 1}
          onClick={() => setActive((s) => Math.min(steps.length - 1, s + 1))}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
