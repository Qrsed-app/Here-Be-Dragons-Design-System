"use client";

import * as React from "react";
import * as ToggleGroupPrimitive from "@radix-ui/react-toggle-group";
import { cn } from "@/lib/utils";
import { Button, type ButtonProps } from "@/registry/new-york/button/button";

// Ported from ds/components/hbd-toggle-group.js + the .hbd-toggle-group rules
// that lived inside ds/styles/components/button.css (extracted into
// toggle-group.css). The legacy WC was a Light-DOM wrapper coordinating a row
// of <hbd-button toggle> children with two modes:
//   single — one-of-N (radio-like): role="radiogroup", each child is a radio
//            with aria-checked, roving tabindex, arrows move AND select, and
//            clicking the selected button does NOT un-press it.
//   multi  — independent on/off: role="group", each child is a toggle button
//            with aria-pressed, standard Tab between buttons.
//
// Radix ToggleGroup reproduces this exact selection + keyboard + ARIA model
// (type="single" gives the radiogroup/roving-tabindex/arrow-select behaviour;
// type="multiple" gives the independent toggle-button group). We compose the
// HBD <Button> as each item via ToggleGroupPrimitive.Item asChild, re-applying
// the .hbd-button--in-group BEM marker classes so the de-shadowed CSS strips
// each button's inner border/radius and the group draws one joined control.
//
// Controlled-first: value / values + onValueChange, with defaultValue /
// defaultValues uncontrolled fallback. onValueChange receives the legacy
// hbd:change detail shape — { value } in single mode, { values } in multi.

// ── useControllableState ─────────────────────────────────────────────
function useControllableState<T>(
  controlled: T | undefined,
  defaultValue: T,
  onChange?: (value: T) => void,
): [T, (value: T) => void] {
  const isControlled = controlled !== undefined;
  const [uncontrolled, setUncontrolled] = React.useState<T>(defaultValue);
  const value = isControlled ? (controlled as T) : uncontrolled;

  const setValue = React.useCallback(
    (next: T) => {
      if (!isControlled) setUncontrolled(next);
      onChange?.(next);
    },
    [isControlled, onChange],
  );

  return [value, setValue];
}

// ── ToggleGroup.Item ─────────────────────────────────────────────────
export interface ToggleGroupItemProps extends Omit<ButtonProps, "pressed" | "value" | "onChange"> {
  /** The value this item contributes to the group's selection. */
  value: string;
}

const ToggleGroupItem = React.forwardRef<HTMLButtonElement, ToggleGroupItemProps>(
  ({ value, className, variant = "default", children, ...props }, ref) => {
    const { orientation, mode } = React.useContext(ToggleGroupContext);
    const isVertical = orientation === "vertical";

    // ToggleGroupPrimitive.Item is the focusable control + selection target.
    // It sets data-state="on"/"off" and (in single mode) role=radio /
    // aria-checked, or (multi) aria-pressed, so the ARIA matches the WC.
    // We render the HBD Button via asChild and map the pressed look off the
    // Radix data-state by reading it inside a render closure.
    return (
      <ToggleGroupPrimitive.Item ref={ref} value={value} asChild {...props}>
        <ToggleGroupButton
          className={cn(
            "hbd-button--in-group",
            isVertical && "hbd-button--in-group-vertical",
            className,
          )}
          variant={variant}
          mode={mode}
        >
          {children}
        </ToggleGroupButton>
      </ToggleGroupPrimitive.Item>
    );
  },
);
ToggleGroupItem.displayName = "ToggleGroupItem";

// Bridges Radix's data-state="on"/"off" (injected as a prop on the asChild
// slot) onto the HBD Button's `pressed` prop so the joined-button pressed
// look renders 1:1.
interface ToggleGroupButtonProps extends ButtonProps {
  "data-state"?: "on" | "off";
  mode?: "single" | "multi";
}
const ToggleGroupButton = React.forwardRef<HTMLButtonElement, ToggleGroupButtonProps>(
  ({ "data-state": dataState, mode, ...props }, ref) => {
    const on = dataState === "on";
    // In single mode Radix sets role="radio" + aria-checked on this element;
    // let that win and suppress Button's aria-pressed so we don't double up
    // (WC: single -> aria-checked, multi -> aria-pressed). `pressed` still
    // drives the visual .hbd-button--pressed class in both modes.
    return (
      <Button
        ref={ref}
        data-state={dataState}
        pressed={on}
        aria-pressed={mode === "single" ? undefined : on}
        {...props}
      />
    );
  },
);
ToggleGroupButton.displayName = "ToggleGroupButton";

// ── ToggleGroup ──────────────────────────────────────────────────────
const ToggleGroupContext = React.createContext<{
  orientation: "horizontal" | "vertical";
  mode: "single" | "multi";
}>({ orientation: "horizontal", mode: "single" });

export interface ToggleGroupItemData {
  value: string;
  label: React.ReactNode;
  disabled?: boolean;
}

interface ToggleGroupBaseProps {
  /** Accessible label for the group (sets aria-label, matching the WC `label` attr). */
  label?: string;
  /** Layout direction. Vertical stacks the buttons + moves the separator to the bottom. */
  orientation?: "horizontal" | "vertical";
  /** Disable the entire group. */
  disabled?: boolean;
  /** Declarative item list. Alternative to <ToggleGroup.Item> children. */
  items?: ToggleGroupItemData[];
  className?: string;
  children?: React.ReactNode;
}

export interface ToggleGroupSingleProps extends ToggleGroupBaseProps {
  /** Single selection (radio-like). One-of-N, mutual exclusion. */
  mode?: "single";
  /** Controlled selected value. */
  value?: string;
  /** Uncontrolled initial value. */
  defaultValue?: string;
  /** Fires with { value } on selection. */
  onValueChange?: (detail: { value: string }) => void;
}

export interface ToggleGroupMultiProps extends ToggleGroupBaseProps {
  /** Multiple selection — independent on/off per button. */
  mode: "multi";
  /** Controlled selected values. */
  value?: string[];
  /** Uncontrolled initial values. */
  defaultValue?: string[];
  /** Fires with { values } on any toggle. */
  onValueChange?: (detail: { values: string[] }) => void;
}

export type ToggleGroupProps = ToggleGroupSingleProps | ToggleGroupMultiProps;

const ToggleGroup = React.forwardRef<HTMLDivElement, ToggleGroupProps>((props, ref) => {
  const {
    label,
    orientation = "horizontal",
    disabled,
    items,
    className,
    children,
    mode = "single",
  } = props as ToggleGroupBaseProps & { mode?: "single" | "multi" };

  const isVertical = orientation === "vertical";

  const content =
    items != null
      ? items.map((item) => (
          <ToggleGroupItem key={item.value} value={item.value} disabled={item.disabled}>
            {item.label}
          </ToggleGroupItem>
        ))
      : children;

  const sharedRootProps = {
    ref,
    "aria-label": label || undefined,
    disabled,
    orientation,
    // Roving tabindex direction follows orientation in the WC (arrows
    // map to Right/Down + Left/Up). Radix uses orientation for the same.
    className: cn("hbd-toggle-group", isVertical && "hbd-toggle-group--vertical", className),
  } as const;

  let root: React.ReactNode;
  if (mode === "multi") {
    const p = props as ToggleGroupMultiProps;
    root = (
      <MultiRoot
        {...sharedRootProps}
        value={p.value}
        defaultValue={p.defaultValue}
        onValueChange={p.onValueChange}
      >
        {content}
      </MultiRoot>
    );
  } else {
    const p = props as ToggleGroupSingleProps;
    root = (
      <SingleRoot
        {...sharedRootProps}
        value={p.value}
        defaultValue={p.defaultValue}
        onValueChange={p.onValueChange}
      >
        {content}
      </SingleRoot>
    );
  }

  return (
    <ToggleGroupContext.Provider value={{ orientation, mode }}>{root}</ToggleGroupContext.Provider>
  );
});
ToggleGroup.displayName = "ToggleGroup";

// Internal single-mode root (radiogroup). Radix enforces "clicking the
// selected button does not un-press it" only when the value can't be cleared;
// we re-add a guard so a re-select of the active value never clears it,
// matching the WC's radio rule.
interface SingleRootProps {
  value?: string;
  defaultValue?: string;
  onValueChange?: (detail: { value: string }) => void;
  children?: React.ReactNode;
  className?: string;
  orientation: "horizontal" | "vertical";
  disabled?: boolean;
  "aria-label"?: string;
}
const SingleRoot = React.forwardRef<HTMLDivElement, SingleRootProps>(
  ({ value, defaultValue, onValueChange, children, ...rest }, ref) => {
    const [val, setVal] = useControllableState<string>(value, defaultValue ?? "", (v) =>
      onValueChange?.({ value: v }),
    );
    return (
      <ToggleGroupPrimitive.Root
        ref={ref}
        type="single"
        value={val}
        onValueChange={(next: string) => {
          // WC radio rule: clicking the already-selected button must NOT
          // clear it. Radix passes "" on deselect — ignore that case.
          if (next === "") return;
          setVal(next);
        }}
        {...rest}
      >
        {children}
      </ToggleGroupPrimitive.Root>
    );
  },
);
SingleRoot.displayName = "SingleRoot";

interface MultiRootProps {
  value?: string[];
  defaultValue?: string[];
  onValueChange?: (detail: { values: string[] }) => void;
  children?: React.ReactNode;
  className?: string;
  orientation: "horizontal" | "vertical";
  disabled?: boolean;
  "aria-label"?: string;
}
const MultiRoot = React.forwardRef<HTMLDivElement, MultiRootProps>(
  ({ value, defaultValue, onValueChange, children, ...rest }, ref) => {
    const [vals, setVals] = useControllableState<string[]>(value, defaultValue ?? [], (v) =>
      onValueChange?.({ values: v }),
    );
    return (
      <ToggleGroupPrimitive.Root
        ref={ref}
        type="multiple"
        value={vals}
        onValueChange={(next: string[]) => setVals(next)}
        {...rest}
      >
        {children}
      </ToggleGroupPrimitive.Root>
    );
  },
);
MultiRoot.displayName = "MultiRoot";

export { ToggleGroup, ToggleGroupItem };
