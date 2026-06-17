"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

// Ported from ds/components/hbd-accordion.js + ds/styles/components/accordion.css.
// The legacy WC was Light-DOM and shuffled authored <hbd-accordion-item>
// children into a generated header+panel structure; in React we express the
// same final markup declaratively via an <Accordion> + <Accordion.Item>
// compound API, so the de-shadowed accordion.css reproduces the exact HBD look
// 1:1. The expand/collapse animation is CSS-only (max-height transition driven
// by the .hbd-accordion__item--open class) — no scrollHeight measurement, no JS
// timing. Tailwind utilities are additive only — the token-backed component CSS
// is the styling.
//
// Behaviour preserved from the WC:
//   • mode="single" (default) — opening an item closes any other open item.
//   • mode="multi" — items toggle independently.
//   • heading-level 2|3|4 (default 3) — the trigger is wrapped in h2/h3/h4.
//   • Each trigger is a real <button> with aria-expanded + aria-controls; the
//     panel is role="region" + aria-labelledby pointing back at the trigger.
//   • Disabled items: trigger gets the disabled attribute, --disabled class,
//     and is skipped by roving keyboard navigation.
//   • Keyboard: ArrowUp/ArrowDown move between triggers (wrapping, skipping
//     disabled), Home/End jump to the first/last enabled trigger; Enter/Space
//     toggle via the native <button>.
//   • hbd:open  → onOpen({ index, title }); hbd:close → onClose({ index, title }).
//
// Controlled-first: `value` (single) / `values` (multi) + onValueChange, with
// `defaultValue` / `defaultValues` uncontrolled fallbacks. Item identity is the
// item's `value` prop, falling back to its zero-based index.

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

const accordionVariants = cva("hbd-accordion", {
  variants: {
    bordered: { true: "hbd-accordion--bordered", false: "" },
    divided: { true: "hbd-accordion--divided", false: "" },
    flush: { true: "hbd-accordion--flush", false: "" },
  },
  defaultVariants: { bordered: false, divided: false, flush: false },
});

export type AccordionMode = "single" | "multi";
export type AccordionHeadingLevel = 2 | 3 | 4;

// detail payload carried by the legacy hbd:open / hbd:close CustomEvents.
export interface AccordionToggleDetail {
  index: number;
  title: string;
}

interface AccordionContextValue {
  uid: string;
  headingLevel: AccordionHeadingLevel;
  isItemOpen: (key: string) => boolean;
  toggleItem: (key: string, index: number, title: string) => void;
  registerTrigger: (index: number, el: HTMLButtonElement | null) => void;
  onTriggerKeyDown: (index: number, e: React.KeyboardEvent) => void;
}

const AccordionContext = React.createContext<AccordionContextValue | null>(null);

export interface AccordionProps
  extends
    Omit<React.HTMLAttributes<HTMLDivElement>, "onChange" | "defaultValue">,
    VariantProps<typeof accordionVariants> {
  /** "single" (default) — one item open at a time; "multi" — independent. */
  mode?: AccordionMode;
  /** Heading element that wraps each trigger: 2 | 3 (default) | 4. */
  headingLevel?: AccordionHeadingLevel;
  /** Controlled open item key (single mode). Item value, else its index string. */
  value?: string | null;
  /** Uncontrolled initial open key (single mode). */
  defaultValue?: string | null;
  /** Controlled open item keys (multi mode). */
  values?: string[];
  /** Uncontrolled initial open keys (multi mode). */
  defaultValues?: string[];
  /** Fired when the open set changes — string|null (single) or string[] (multi). */
  onValueChange?: (value: string | null | string[]) => void;
  /** Fired when an item expands (hbd:open). */
  onOpen?: (detail: AccordionToggleDetail) => void;
  /** Fired when an item collapses (hbd:close). */
  onClose?: (detail: AccordionToggleDetail) => void;
}

let accordionUidCounter = 0;

const AccordionRoot = React.forwardRef<HTMLDivElement, AccordionProps>(
  (
    {
      className,
      mode = "single",
      headingLevel = 3,
      bordered,
      divided,
      flush,
      value: valueProp,
      defaultValue,
      values: valuesProp,
      defaultValues,
      onValueChange,
      onOpen,
      onClose,
      children,
      ...props
    },
    ref,
  ) => {
    const uid = React.useMemo(() => `hbd-accordion-${++accordionUidCounter}`, []);

    const isMulti = mode === "multi";

    // Single-mode controllable state (string | null).
    const [singleValue, setSingleValue] = useControllableState<string | null>({
      value: isMulti ? undefined : valueProp,
      defaultValue: defaultValue ?? null,
      onChange: isMulti ? undefined : (onValueChange as (v: string | null) => void),
    });

    // Multi-mode controllable state (string[]).
    const [multiValues, setMultiValues] = useControllableState<string[]>({
      value: isMulti ? valuesProp : undefined,
      defaultValue: defaultValues ?? [],
      onChange: isMulti ? (onValueChange as (v: string[]) => void) : undefined,
    });

    const triggersRef = React.useRef<Array<HTMLButtonElement | null>>([]);

    const registerTrigger = React.useCallback((index: number, el: HTMLButtonElement | null) => {
      triggersRef.current[index] = el;
    }, []);

    const isItemOpen = React.useCallback(
      (key: string) => (isMulti ? multiValues.includes(key) : singleValue === key),
      [isMulti, multiValues, singleValue],
    );

    const toggleItem = React.useCallback(
      (key: string, index: number, title: string) => {
        const wasOpen = isItemOpen(key);
        if (isMulti) {
          const next = wasOpen ? multiValues.filter((k) => k !== key) : [...multiValues, key];
          setMultiValues(next);
        } else {
          setSingleValue(wasOpen ? null : key);
        }
        if (wasOpen) onClose?.({ index, title });
        else onOpen?.({ index, title });
      },
      [isMulti, multiValues, setMultiValues, setSingleValue, isItemOpen, onOpen, onClose],
    );

    // Roving keyboard navigation across enabled triggers (wraps at the ends).
    const onTriggerKeyDown = React.useCallback((index: number, e: React.KeyboardEvent) => {
      const triggers = triggersRef.current;
      const enabled = (el: HTMLButtonElement | null) => el != null && !el.disabled;

      const step = (from: number, dir: 1 | -1) => {
        const len = triggers.length;
        if (len === 0) return null;
        let i = from;
        for (let n = 0; n < len; n += 1) {
          i = (i + dir + len) % len;
          if (enabled(triggers[i])) return triggers[i];
        }
        return null;
      };

      switch (e.key) {
        case "ArrowDown": {
          e.preventDefault();
          step(index, 1)?.focus();
          break;
        }
        case "ArrowUp": {
          e.preventDefault();
          step(index, -1)?.focus();
          break;
        }
        case "Home": {
          e.preventDefault();
          triggers.find(enabled)?.focus();
          break;
        }
        case "End": {
          e.preventDefault();
          [...triggers].reverse().find(enabled)?.focus();
          break;
        }
        default:
          break;
      }
    }, []);

    // Stamp a sequential index onto each <Accordion.Item> child, mirroring the
    // WC's item ordering used by the open/close detail + keyboard navigation.
    let itemIndex = -1;
    const stampedChildren = React.Children.map(children, (child) => {
      if (!React.isValidElement(child) || child.type !== AccordionItem) return child;
      itemIndex += 1;
      return React.cloneElement(child as React.ReactElement<AccordionItemProps>, {
        index: itemIndex,
      });
    });

    const ctx: AccordionContextValue = {
      uid,
      headingLevel,
      isItemOpen,
      toggleItem,
      registerTrigger,
      onTriggerKeyDown,
    };

    return (
      <AccordionContext.Provider value={ctx}>
        <div
          ref={ref}
          className={cn(accordionVariants({ bordered, divided, flush }), className)}
          {...props}
        >
          {stampedChildren}
        </div>
      </AccordionContext.Provider>
    );
  },
);
AccordionRoot.displayName = "Accordion";

export interface AccordionItemProps {
  /** Header label. */
  title: string;
  /** Stable identity for controlled open state (falls back to the index). */
  value?: string;
  /** Disabled — non-interactive trigger, dimmed, skipped by keyboard nav. */
  disabled?: boolean;
  /** Panel body content. */
  children?: React.ReactNode;
  /** Extra class names merged onto the item element. */
  className?: string;
  /** Internal — injected by <Accordion> to mirror the WC's item index. */
  index?: number;
}

const AccordionItem = React.forwardRef<HTMLDivElement, AccordionItemProps>((props, ref) => {
  const { title, value, disabled = false, children, className, index = 0 } = props;

  const ctx = React.useContext(AccordionContext);
  if (!ctx) {
    throw new Error("Accordion.Item must be used within <Accordion>");
  }

  const key = value ?? String(index);
  const isOpen = ctx.isItemOpen(key);

  const triggerId = `${ctx.uid}-trigger-${index}`;
  const panelId = `${ctx.uid}-panel-${index}`;

  const Heading = `h${ctx.headingLevel}` as "h2" | "h3" | "h4";

  const triggerRef = React.useRef<HTMLButtonElement | null>(null);
  React.useEffect(() => {
    ctx.registerTrigger(index, triggerRef.current);
    return () => ctx.registerTrigger(index, null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  const handleClick = () => {
    if (disabled) return;
    ctx.toggleItem(key, index, title);
  };

  return (
    <div
      ref={ref}
      className={cn(
        "hbd-accordion__item",
        isOpen && "hbd-accordion__item--open",
        disabled && "hbd-accordion__item--disabled",
        className,
      )}
      id={`${ctx.uid}-item-${index}`}
      data-accordion-item-index={index}
    >
      <Heading className="hbd-accordion__header">
        <button
          ref={triggerRef}
          className="hbd-accordion__trigger"
          type="button"
          id={triggerId}
          aria-expanded={isOpen}
          aria-controls={panelId}
          disabled={disabled}
          onClick={handleClick}
          onKeyDown={(e) => ctx.onTriggerKeyDown(index, e)}
        >
          <span className="hbd-accordion__title">{title}</span>
          <span className="hbd-accordion__icon" aria-hidden="true">
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
              <polyline points="4 6 8 10 12 6" />
            </svg>
          </span>
        </button>
      </Heading>

      <div className="hbd-accordion__panel" id={panelId} role="region" aria-labelledby={triggerId}>
        <div className="hbd-accordion__body" data-accordion-body>
          {children}
        </div>
      </div>
    </div>
  );
});
AccordionItem.displayName = "Accordion.Item";

type AccordionComponent = typeof AccordionRoot & { Item: typeof AccordionItem };
const Accordion = AccordionRoot as AccordionComponent;
Accordion.Item = AccordionItem;

export { Accordion, AccordionItem, accordionVariants };
