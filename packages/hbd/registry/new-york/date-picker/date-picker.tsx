"use client";

import * as React from "react";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { cn } from "@/lib/utils";
import { TimePicker } from "@/registry/new-york/time-picker/time-picker";

// Ported from ds/components/hbd-date-picker.js + ds/styles/components/date-picker.css.
//
// The legacy WC was a Shadow-DOM custom element: a click-triggered calendar
// popover built on the shared field chrome (the .hbd-field label/footer +
// a trigger styled like the input surface) plus a portalled panel containing
// a month header (prev/next nav + Intl month-year label), a weekday
// columnheader row, a 6×7 APG grid (role="grid", roving tabindex, full
// keyboard date navigation), and a Today/Clear/Cancel/Confirm footer. Three
// variants: "date" (single), "date-time" (single + an embedded TimePicker in
// the panel footer), "date-range" (start + end with hover-preview).
//
// The interaction model is committed-vs-pending:
//   • Opening snapshots the saved value into a "pending" working copy.
//   • Cell clicks / Today / Clear mutate PENDING only; the panel STAYS open.
//   • Confirm commits pending → saved (fires onValueChange/onChange) and
//     closes, returning focus to the trigger.
//   • Cancel and Escape DISCARD pending and close, returning focus.
//   • Outside-pointerdown DISCARDS pending and closes WITHOUT returning focus
//     (the user is interacting elsewhere).
//
// We use Radix Popover for the portal + focus-trap + scroll handling +
// Escape/outside dismissal + return-focus plumbing, then re-apply the legacy
// .hbd-date-picker* BEM classes to the parts so the de-shadowed date-picker.css
// renders the HBD look 1:1. We intercept Radix's dismissal callbacks to run the
// commit/discard logic and to suppress return-focus on outside-click.
//
// Native Intl.DateTimeFormat drives locale-aware month/weekday/aria-label
// text; plain Date arithmetic drives navigation (no external date library,
// matching the WC).

// ── useControllableState (inline, controlled-first w/ uncontrolled fallback) ─
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

// ── Date helpers (no external library — verbatim from the WC) ─────────────
function parseISODate(s: string | null | undefined): Date | null {
  if (!s || typeof s !== "string") return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
  if (!m) return null;
  const d = new Date(+m[1], +m[2] - 1, +m[3]);
  return Number.isNaN(d.getTime()) ? null : d;
}
// Local Y-M-D (not toISOString — which converts to UTC and can shift the day).
function toISODate(d: Date | null | undefined): string {
  if (!d) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
function sameDay(a: Date | null, b: Date | null): boolean {
  return (
    !!a &&
    !!b &&
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}
function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}
function addMonths(d: Date, n: number): Date {
  const target = new Date(d);
  target.setDate(1);
  target.setMonth(target.getMonth() + n);
  const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  target.setDate(Math.min(d.getDate(), lastDay));
  return target;
}
function clampToRange(d: Date | null, min: Date | null, max: Date | null): Date | null {
  if (!d) return d;
  if (min && d < min) return new Date(min);
  if (max && d > max) return new Date(max);
  return d;
}

export type DatePickerVariant = "date" | "date-time" | "date-range";

/** Detail payload for the single / date-time variants (hbd:change). */
export interface DateChangeDetail {
  value: string | null;
}
/** Detail payload for the date-range variant (hbd:change). */
export interface DateRangeChangeDetail {
  start: string | null;
  end: string | null;
}

export interface DatePickerProps {
  /** Variant — single date (default), date+time, or a start/end range. */
  variant?: DatePickerVariant;

  /** Controlled saved value (single / date-time variants), an ISO YYYY-MM-DD. */
  value?: string;
  /** Uncontrolled initial value (single / date-time variants). */
  defaultValue?: string;
  /** Controlled saved range start (date-range variant). */
  valueStart?: string;
  /** Controlled saved range end (date-range variant). */
  valueEnd?: string;
  /** Uncontrolled initial range start. */
  defaultValueStart?: string;
  /** Uncontrolled initial range end. */
  defaultValueEnd?: string;

  /** Earliest selectable date (ISO YYYY-MM-DD). */
  min?: string;
  /** Latest selectable date (ISO YYYY-MM-DD). */
  max?: string;

  /** Visible field label, associated with the trigger via aria-labelledby. */
  label?: string;
  /** Helper text below the field. */
  hint?: string;
  /** Error message — sets aria-invalid + the error state when non-empty. */
  error?: string;
  /** Trigger placeholder shown when no value is selected. */
  placeholder?: string;
  /** Form control name (carried for parity; no native form binding). */
  name?: string;
  required?: boolean;
  disabled?: boolean;

  /** BCP-47 locale for month/weekday/cell-label text (defaults to navigator). */
  locale?: string;
  /** First day of week, 0=Sun…6=Sat (overrides the locale's weekInfo). */
  firstDay?: number;
  /** Intl.DateTimeFormat options for the displayed (committed) value. */
  format?: Intl.DateTimeFormatOptions;

  /** Controlled open state of the panel (hbd:open / hbd:close). */
  open?: boolean;
  /** Uncontrolled initial open state. */
  defaultOpen?: boolean;
  /** Open-state change callback (controlled-first overlay pattern). */
  onOpenChange?: (open: boolean) => void;
  /** Fired after the panel opens (the WC's hbd:open). */
  onOpen?: () => void;
  /** Fired after the panel closes (the WC's hbd:close). */
  onClose?: () => void;

  /** Committed value-change callback for single / date-time variants. */
  onValueChange?: (value: string | null) => void;
  /** Committed range-change callback for the date-range variant. */
  onRangeChange?: (range: DateRangeChangeDetail) => void;
  /** Lower-level commit callback carrying the full hbd:change detail. */
  onChange?: (detail: DateChangeDetail | DateRangeChangeDetail) => void;

  className?: string;
}

let uidCounter = 0;

const CalendarIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <rect x="2" y="3" width="12" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
    <path d="M2 6h12" stroke="currentColor" strokeWidth="1.4" />
    <path d="M5 1.5v3M11 1.5v3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
  </svg>
);

const ChevronLeft = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
    <path
      d="M9 3L5 7l4 4"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const ChevronRight = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
    <path
      d="M5 3l4 4-4 4"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

interface GridCell {
  date: Date;
  isOutsideMonth: boolean;
  isToday: boolean;
  isDisabled: boolean;
  isSelected: boolean;
  isRangeStart: boolean;
  isRangeEnd: boolean;
  isInRange: boolean;
  isPreviewEnd: boolean;
  isFocused: boolean;
}

const DatePicker = React.forwardRef<HTMLButtonElement, DatePickerProps>(
  (
    {
      variant = "date",
      value: valueProp,
      defaultValue,
      valueStart: valueStartProp,
      valueEnd: valueEndProp,
      defaultValueStart,
      defaultValueEnd,
      min,
      max,
      label,
      hint,
      error,
      placeholder = "Select a date",
      name,
      required = false,
      disabled = false,
      locale: localeProp,
      firstDay: firstDayProp,
      format,
      open: openProp,
      defaultOpen,
      onOpenChange,
      onOpen,
      onClose,
      onValueChange,
      onRangeChange,
      onChange,
      className,
    },
    ref,
  ) => {
    const resolvedVariant: DatePickerVariant = ["date", "date-time", "date-range"].includes(variant)
      ? variant
      : "date";
    const isRange = resolvedVariant === "date-range";
    const isDateTime = resolvedVariant === "date-time";

    const reactId = React.useId();
    const uid = React.useMemo(() => `hbd-date-picker-${++uidCounter}`, []);

    // ── Locale / config ──────────────────────────────────────────────
    const locale =
      localeProp || (typeof navigator !== "undefined" ? navigator.language : "en-US") || "en-US";

    const firstDay = React.useMemo(() => {
      if (
        firstDayProp != null &&
        Number.isFinite(firstDayProp) &&
        firstDayProp >= 0 &&
        firstDayProp <= 6
      ) {
        return firstDayProp;
      }
      try {
        const loc = new Intl.Locale(locale) as Intl.Locale & {
          weekInfo?: { firstDay?: number };
          getWeekInfo?: () => { firstDay?: number };
        };
        const wi =
          loc.weekInfo || (typeof loc.getWeekInfo === "function" ? loc.getWeekInfo() : null);
        if (wi && Number.isFinite(wi.firstDay)) {
          // Intl returns 1–7 where 1=Mon, 7=Sun; convert to 0=Sun…6=Sat.
          return wi.firstDay === 7 ? 0 : (wi.firstDay as number);
        }
      } catch {
        /* fall through */
      }
      return 1; // Monday default
    }, [firstDayProp, locale]);

    const minDate = React.useMemo(() => parseISODate(min), [min]);
    const maxDate = React.useMemo(() => parseISODate(max), [max]);
    const formatOptions: Intl.DateTimeFormatOptions = format || {
      year: "numeric",
      month: "long",
      day: "numeric",
    };

    // ── Committed (saved) state — controlled-first ───────────────────
    const [valueIso, setValueIso] = useControllableState<string>({
      value: valueProp,
      defaultValue: defaultValue ?? "",
    });
    const [startIso, setStartIso] = useControllableState<string>({
      value: valueStartProp,
      defaultValue: defaultValueStart ?? "",
    });
    const [endIso, setEndIso] = useControllableState<string>({
      value: valueEndProp,
      defaultValue: defaultValueEnd ?? "",
    });

    const savedValue = parseISODate(valueIso);
    const savedStart = parseISODate(startIso);
    const savedEnd = parseISODate(endIso);

    // Saved time for the date-time variant ('HH:MM').
    const [savedTime, setSavedTime] = React.useState<string | null>(null);

    // ── Open state — controlled-first ────────────────────────────────
    const [isOpen, setIsOpen] = useControllableState<boolean>({
      value: openProp,
      defaultValue: defaultOpen ?? false,
      onChange: onOpenChange,
    });

    // ── Pending (open-panel) working state ───────────────────────────
    const [pendingValue, setPendingValue] = React.useState<Date | null>(null);
    const [pendingStart, setPendingStart] = React.useState<Date | null>(null);
    const [pendingEnd, setPendingEnd] = React.useState<Date | null>(null);
    const [pendingTime, setPendingTime] = React.useState<string | null>(null);
    const [selectingEnd, setSelectingEnd] = React.useState(false);
    const [hoveredDate, setHoveredDate] = React.useState<Date | null>(null);

    const [currentMonth, setCurrentMonth] = React.useState<Date>(() =>
      startOfMonth(savedValue || savedStart || new Date()),
    );
    const [focusedDate, setFocusedDate] = React.useState<Date>(
      () => savedValue || savedStart || new Date(),
    );

    const triggerRef = React.useRef<HTMLButtonElement>(null);
    React.useImperativeHandle(ref, () => triggerRef.current as HTMLButtonElement);
    const gridRef = React.useRef<HTMLDivElement>(null);
    // Pending-discard guard so the controlled onOpenChange(false) path doesn't
    // double-run commit/discard logic.
    const suppressReturnFocusRef = React.useRef(false);

    // ── Formatting helpers ───────────────────────────────────────────
    const formatDisplay = React.useCallback(
      (d: Date | null) => (d ? new Intl.DateTimeFormat(locale, formatOptions).format(d) : ""),
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [locale, JSON.stringify(formatOptions)],
    );
    const formatMonthYear = React.useCallback(
      (d: Date) =>
        new Intl.DateTimeFormat(locale, {
          year: "numeric",
          month: "long",
        }).format(d),
      [locale],
    );
    const formatCellLabel = React.useCallback(
      (d: Date) =>
        new Intl.DateTimeFormat(locale, {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        }).format(d),
      [locale],
    );
    const weekdayLabels = React.useMemo(() => {
      // Reference Sunday (2024-01-07 was a Sunday) rotated to first-day.
      const base = new Date(2024, 0, 7);
      const labels: string[] = [];
      for (let i = 0; i < 7; i++) {
        const d = addDays(base, (firstDay + i) % 7);
        labels.push(new Intl.DateTimeFormat(locale, { weekday: "short" }).format(d));
      }
      return labels;
    }, [locale, firstDay]);

    const isDisabledDate = React.useCallback(
      (d: Date | null) => {
        if (!d) return false;
        if (minDate && d < minDate) return true;
        if (maxDate && d > maxDate) return true;
        return false;
      },
      [minDate, maxDate],
    );

    // ── Trigger display text ─────────────────────────────────────────
    const triggerDisplayText = (() => {
      if (isRange) {
        const s = savedStart ? formatDisplay(savedStart) : "";
        const e = savedEnd ? formatDisplay(savedEnd) : "";
        if (!s && !e) return "";
        if (s && e) return `${s} – ${e}`;
        return s || e;
      }
      if (isDateTime && savedValue && savedTime) {
        return `${formatDisplay(savedValue)} · ${savedTime}`;
      }
      return savedValue ? formatDisplay(savedValue) : "";
    })();
    const isPlaceholder = !triggerDisplayText;
    const displayText = triggerDisplayText || placeholder;

    const hasError = error != null && error !== "";
    const hasHint = hint != null && hint !== "";

    // ── Build the 6×7 grid (reflects PENDING while open, SAVED while closed) ─
    const cells: GridCell[] = React.useMemo(() => {
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth();
      const first = new Date(year, month, 1);
      const firstWeekday = first.getDay(); // 0–6 Sun..Sat
      const offset = (firstWeekday - firstDay + 7) % 7;
      const gridStart = addDays(first, -offset);

      const today = new Date();
      const valSingle = isOpen ? pendingValue : savedValue;
      const rangeStart = isOpen ? pendingStart : savedStart;
      const rangeEnd = isOpen ? pendingEnd : savedEnd;

      // Range hover preview — while picking the end, treat the hovered date
      // as a provisional end so the in-range run renders dynamically.
      let previewEnd: Date | null = null;
      if (
        isRange &&
        isOpen &&
        selectingEnd &&
        rangeStart &&
        hoveredDate &&
        !sameDay(hoveredDate, rangeStart)
      ) {
        previewEnd = hoveredDate;
      }
      // Normalise so start < end (auto-swap visual).
      let effStart = rangeStart;
      let effEnd = rangeEnd || previewEnd;
      if (effStart && effEnd && effEnd < effStart) {
        const t = effStart;
        effStart = effEnd;
        effEnd = t;
      }

      const out: GridCell[] = [];
      for (let i = 0; i < 42; i++) {
        const d = addDays(gridStart, i);
        const isRangeStart = isRange && sameDay(d, effStart);
        const isRangeEnd = isRange && sameDay(d, effEnd);
        const inRange = isRange && !!effStart && !!effEnd && d > effStart && d < effEnd;
        const isPreviewEnd = !!previewEnd && sameDay(d, previewEnd);
        const isSelected = isRange ? isRangeStart || isRangeEnd : sameDay(d, valSingle);

        out.push({
          date: d,
          isOutsideMonth: d.getMonth() !== month,
          isToday: sameDay(d, today),
          isDisabled: isDisabledDate(d),
          isSelected,
          isRangeStart,
          isRangeEnd,
          isInRange: inRange,
          isPreviewEnd,
          isFocused: sameDay(d, focusedDate),
        });
      }
      return out;
    }, [
      currentMonth,
      firstDay,
      isOpen,
      pendingValue,
      pendingStart,
      pendingEnd,
      savedValue,
      savedStart,
      savedEnd,
      isRange,
      selectingEnd,
      hoveredDate,
      focusedDate,
      isDisabledDate,
    ]);

    // ── Focus the roving cell whenever it / the month changes while open ──
    React.useEffect(() => {
      if (!isOpen) return;
      const iso = toISODate(focusedDate);
      const grid = gridRef.current;
      if (!grid) return;
      const btn = grid.querySelector<HTMLButtonElement>(
        `.hbd-date-picker__cell-inner[data-date="${iso}"]`,
      );
      if (btn) btn.focus({ preventScroll: true });
      // Re-focus on month change too (focusedDate may move into a new month).
    }, [isOpen, focusedDate, currentMonth]);

    // ── Dispatch a committed change ──────────────────────────────────
    const dispatchChange = React.useCallback(
      (
        nextValue: Date | null,
        nextStart: Date | null,
        nextEnd: Date | null,
        nextTime: string | null,
      ) => {
        if (isRange) {
          const detail: DateRangeChangeDetail = {
            start: nextStart ? toISODate(nextStart) : null,
            end: nextEnd ? toISODate(nextEnd) : null,
          };
          onRangeChange?.(detail);
          onChange?.(detail);
        } else {
          const detail: DateChangeDetail = {
            value: nextValue
              ? isDateTime && nextTime
                ? `${toISODate(nextValue)}T${nextTime}`
                : toISODate(nextValue)
              : null,
          };
          onValueChange?.(detail.value);
          onChange?.(detail);
        }
      },
      [isRange, isDateTime, onValueChange, onRangeChange, onChange],
    );

    // ── Open ─────────────────────────────────────────────────────────
    const openPanel = React.useCallback(() => {
      if (isOpen || disabled) return;
      const pv = savedValue ? new Date(savedValue) : null;
      const ps = savedStart ? new Date(savedStart) : null;
      const pe = savedEnd ? new Date(savedEnd) : null;
      setPendingValue(pv);
      setPendingStart(ps);
      setPendingEnd(pe);
      setPendingTime(savedTime);
      setSelectingEnd(isRange && !!ps && !pe);
      setHoveredDate(null);
      const anchor = savedValue || savedStart || new Date();
      const focused = clampToRange(new Date(anchor), minDate, maxDate)!;
      setFocusedDate(focused);
      setCurrentMonth(startOfMonth(focused));
      setIsOpen(true);
      onOpen?.();
    }, [
      isOpen,
      disabled,
      savedValue,
      savedStart,
      savedEnd,
      savedTime,
      isRange,
      minDate,
      maxDate,
      setIsOpen,
      onOpen,
    ]);

    // ── Commit pending → saved, returns true if anything changed ─────
    const commitPending = React.useCallback((): boolean => {
      let changed = false;
      if (isRange) {
        const ns = pendingStart ? toISODate(pendingStart) : "";
        const ne = pendingEnd ? toISODate(pendingEnd) : "";
        const os = savedStart ? toISODate(savedStart) : "";
        const oe = savedEnd ? toISODate(savedEnd) : "";
        if (ns !== os || ne !== oe) {
          setStartIso(ns);
          setEndIso(ne);
          changed = true;
          dispatchChange(null, pendingStart, pendingEnd, null);
        }
      } else {
        const nv = pendingValue ? toISODate(pendingValue) : "";
        const ov = savedValue ? toISODate(savedValue) : "";
        let timeChanged = false;
        if (isDateTime && pendingTime !== savedTime) {
          setSavedTime(pendingTime);
          timeChanged = true;
        }
        if (nv !== ov) {
          setValueIso(nv);
          changed = true;
        }
        if (changed || timeChanged) {
          dispatchChange(pendingValue, null, null, pendingTime);
          changed = true;
        }
      }
      return changed;
    }, [
      isRange,
      isDateTime,
      pendingStart,
      pendingEnd,
      pendingValue,
      pendingTime,
      savedStart,
      savedEnd,
      savedValue,
      savedTime,
      setStartIso,
      setEndIso,
      setValueIso,
      dispatchChange,
    ]);

    const resetPending = React.useCallback(() => {
      setPendingValue(null);
      setPendingStart(null);
      setPendingEnd(null);
      setSelectingEnd(false);
      setHoveredDate(null);
    }, []);

    // Close with optional commit + optional return-focus. onClose fires after.
    const finishClose = React.useCallback(
      (commit: boolean, returnFocus: boolean) => {
        if (!isOpen) return;
        if (commit) commitPending();
        resetPending();
        suppressReturnFocusRef.current = !returnFocus;
        setIsOpen(false);
        onClose?.();
      },
      [isOpen, commitPending, resetPending, setIsOpen, onClose],
    );

    // ── Selection — mutates PENDING only; panel stays open ───────────
    const selectDate = React.useCallback(
      (d: Date) => {
        if (isRange) {
          if (!pendingStart || (pendingStart && pendingEnd)) {
            // Start a fresh range.
            setPendingStart(new Date(d));
            setPendingEnd(null);
            setSelectingEnd(true);
            setFocusedDate(new Date(d));
            return;
          }
          // Complete the range — auto-swap if end picked before start.
          let start = pendingStart;
          let end = new Date(d);
          if (end < start) {
            const t = start;
            start = end;
            end = t;
          }
          setPendingStart(start);
          setPendingEnd(end);
          setSelectingEnd(false);
          setFocusedDate(new Date(d));
          return;
        }
        // Single / date-time.
        setPendingValue(new Date(d));
        setFocusedDate(new Date(d));
      },
      [isRange, pendingStart, pendingEnd],
    );

    // ── Header nav ───────────────────────────────────────────────────
    const minNav = minDate ? new Date(minDate.getFullYear(), minDate.getMonth(), 1) : null;
    const maxNav = maxDate ? new Date(maxDate.getFullYear(), maxDate.getMonth(), 1) : null;
    const prevDisabled = !!minNav && currentMonth <= minNav;
    const nextDisabled = !!maxNav && currentMonth >= maxNav;

    const onPrevMonth = () => setCurrentMonth((m) => addMonths(m, -1));
    const onNextMonth = () => setCurrentMonth((m) => addMonths(m, 1));

    // ── Footer actions ───────────────────────────────────────────────
    const onTodayClick = () => {
      const t = new Date();
      setCurrentMonth(startOfMonth(t));
      setFocusedDate(clampToRange(new Date(t), minDate, maxDate)!);
      if (!isDisabledDate(t)) {
        if (isRange) {
          setPendingStart(new Date(t));
          setPendingEnd(null);
          setSelectingEnd(true);
        } else {
          setPendingValue(new Date(t));
        }
      }
    };
    const onClearClick = () => {
      if (isRange) {
        setPendingStart(null);
        setPendingEnd(null);
        setSelectingEnd(false);
      } else {
        setPendingValue(null);
        setPendingTime(null);
      }
    };
    const onCancelClick = () => finishClose(false, true);
    const onConfirmClick = () => finishClose(true, true);

    // ── Grid keyboard navigation (APG grid pattern) ──────────────────
    const onGridKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
      const k = e.key;
      let nextDate: Date | null = null;
      switch (k) {
        case "ArrowRight":
          nextDate = addDays(focusedDate, 1);
          break;
        case "ArrowLeft":
          nextDate = addDays(focusedDate, -1);
          break;
        case "ArrowDown":
          nextDate = addDays(focusedDate, 7);
          break;
        case "ArrowUp":
          nextDate = addDays(focusedDate, -7);
          break;
        case "Home": {
          const wd = (focusedDate.getDay() - firstDay + 7) % 7;
          nextDate = addDays(focusedDate, -wd);
          break;
        }
        case "End": {
          const wd = (focusedDate.getDay() - firstDay + 7) % 7;
          nextDate = addDays(focusedDate, 6 - wd);
          break;
        }
        case "PageDown":
          nextDate = addMonths(focusedDate, e.shiftKey ? 12 : 1);
          break;
        case "PageUp":
          nextDate = addMonths(focusedDate, e.shiftKey ? -12 : -1);
          break;
        case "Enter":
        case " ":
        case "Spacebar":
          e.preventDefault();
          if (!isDisabledDate(focusedDate)) selectDate(focusedDate);
          return;
        case "Escape":
          // Escape handled by Radix onEscapeKeyDown (discard + return-focus);
          // let it bubble so the panel closes there.
          return;
        default:
          return;
      }
      if (!nextDate) return;
      e.preventDefault();
      nextDate = clampToRange(nextDate, minDate, maxDate)!;
      const monthChanged =
        nextDate.getMonth() !== currentMonth.getMonth() ||
        nextDate.getFullYear() !== currentMonth.getFullYear();
      setFocusedDate(nextDate);
      if (monthChanged) setCurrentMonth(startOfMonth(nextDate));
      // focus follows via the effect keyed on focusedDate/currentMonth.
    };

    // ── Range hover-preview ──────────────────────────────────────────
    const onGridMouseOver = (e: React.MouseEvent<HTMLDivElement>) => {
      if (!isRange || !selectingEnd) return;
      const btn = (e.target as HTMLElement).closest<HTMLButtonElement>(
        ".hbd-date-picker__cell-inner",
      );
      if (!btn) return;
      const d = parseISODate(btn.getAttribute("data-date"));
      if (!d) return;
      if (hoveredDate && sameDay(hoveredDate, d)) return;
      setHoveredDate(d);
    };
    const onGridMouseLeave = () => {
      if (!isRange || !selectingEnd) return;
      if (!hoveredDate) return;
      setHoveredDate(null);
    };

    // ── Trigger keyboard (open on ArrowDown / Enter / Space) ─────────
    const onTriggerKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
      if (disabled) return;
      if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " " || e.key === "Spacebar") {
        e.preventDefault();
        openPanel();
      }
    };

    // ── Radix open-state bridge ──────────────────────────────────────
    const handleRadixOpenChange = (next: boolean) => {
      if (next) openPanel();
      else {
        // Radix requests close (e.g. trigger re-click). Treat as discard with
        // return-focus, matching the WC's _closePanel default.
        finishClose(false, true);
      }
    };

    // Block classes mirror the WC's host modifiers.
    const blockClasses = cn(
      "hbd-date-picker",
      isOpen && "hbd-date-picker--open",
      disabled && "hbd-date-picker--disabled",
      hasError && "hbd-date-picker--error",
      isRange && "hbd-date-picker--range",
      isDateTime && "hbd-date-picker--datetime",
      className,
    );

    const fieldClasses = cn(
      "hbd-field",
      hasError && "hbd-field--error",
      disabled && "hbd-field--disabled",
    );

    const describedBy =
      [hasHint ? `hint-${reactId}` : "", hasError ? `error-${reactId}` : ""]
        .filter(Boolean)
        .join(" ") || undefined;

    const monthLabel = formatMonthYear(currentMonth);

    return (
      <div className={fieldClasses}>
        {label ? (
          <label
            className="hbd-field__label"
            id={`label-${reactId}`}
            htmlFor={`trigger-${reactId}`}
          >
            {label}
            {required ? (
              <span className="hbd-field__label-required" aria-hidden="true">
                *
              </span>
            ) : null}
          </label>
        ) : null}

        <PopoverPrimitive.Root open={isOpen} onOpenChange={handleRadixOpenChange}>
          <div className={blockClasses}>
            <PopoverPrimitive.Trigger asChild>
              <button
                type="button"
                ref={triggerRef}
                id={`trigger-${reactId}`}
                className="hbd-date-picker__trigger"
                aria-labelledby={label ? `label-${reactId}` : undefined}
                aria-haspopup="dialog"
                aria-expanded={isOpen}
                aria-controls={`panel-${reactId}`}
                aria-required={required || undefined}
                aria-invalid={hasError || undefined}
                aria-describedby={describedBy}
                disabled={disabled}
                name={name}
                onKeyDown={onTriggerKeyDown}
              >
                <span
                  className={cn(
                    "hbd-date-picker__trigger-value",
                    isPlaceholder && "hbd-date-picker__trigger-value--placeholder",
                  )}
                >
                  {displayText}
                </span>
                <span className="hbd-date-picker__trigger-icon" aria-hidden="true">
                  <CalendarIcon />
                </span>
              </button>
            </PopoverPrimitive.Trigger>

            <PopoverPrimitive.Portal>
              <PopoverPrimitive.Content
                id={`panel-${reactId}`}
                role="dialog"
                aria-modal="false"
                aria-labelledby={label ? `label-${reactId}` : undefined}
                side="bottom"
                align="start"
                sideOffset={4}
                className={cn(
                  "hbd-date-picker__panel",
                  isDateTime && "hbd-date-picker__panel--datetime",
                )}
                // Outside-pointerdown DISCARDS pending and closes WITHOUT
                // returning focus (the WC's _onDocPointer behaviour). We use
                // onPointerDownOutside (precise) rather than onInteractOutside
                // so the close isn't double-triggered.
                onPointerDownOutside={() => finishClose(false, false)}
                // Escape DISCARDS pending and closes WITH return-focus.
                onEscapeKeyDown={() => finishClose(false, true)}
                // Suppress Radix's default return-focus on outside-click.
                onCloseAutoFocus={(e: Event) => {
                  if (suppressReturnFocusRef.current) {
                    e.preventDefault();
                    suppressReturnFocusRef.current = false;
                  }
                }}
              >
                <div className="hbd-date-picker__header">
                  <button
                    type="button"
                    className="hbd-date-picker__nav-btn"
                    data-nav="prev"
                    aria-label="Previous month"
                    disabled={prevDisabled}
                    onClick={onPrevMonth}
                  >
                    <ChevronLeft />
                  </button>
                  <span
                    className="hbd-date-picker__month-label"
                    id={`month-label-${reactId}`}
                    aria-live="polite"
                  >
                    {monthLabel}
                  </span>
                  <button
                    type="button"
                    className="hbd-date-picker__nav-btn"
                    data-nav="next"
                    aria-label="Next month"
                    disabled={nextDisabled}
                    onClick={onNextMonth}
                  >
                    <ChevronRight />
                  </button>
                </div>

                <div className="hbd-date-picker__weekdays" role="row">
                  {weekdayLabels.map((w, i) => (
                    <div
                      key={i}
                      className="hbd-date-picker__weekday"
                      role="columnheader"
                      aria-label={w}
                    >
                      {w}
                    </div>
                  ))}
                </div>

                <div
                  ref={gridRef}
                  className="hbd-date-picker__grid"
                  role="grid"
                  aria-labelledby={`month-label-${reactId}`}
                  onKeyDown={onGridKeyDown}
                  onMouseOver={onGridMouseOver}
                  onMouseLeave={onGridMouseLeave}
                >
                  {cells.map((c) => {
                    const iso = toISODate(c.date);
                    const baseLabel = formatCellLabel(c.date);
                    let ariaLabel = baseLabel;
                    if (isRange) {
                      if (c.isRangeStart) ariaLabel = `Start: ${baseLabel}`;
                      else if (c.isRangeEnd) ariaLabel = `End: ${baseLabel}`;
                      else if (selectingEnd) ariaLabel = `End date, ${baseLabel}`;
                      else ariaLabel = `Start date, ${baseLabel}`;
                    }
                    return (
                      <div
                        key={iso}
                        className={cn(
                          "hbd-date-picker__cell",
                          c.isToday && "is-today",
                          c.isSelected && "is-selected",
                          c.isOutsideMonth && "is-outside-month",
                          c.isDisabled && "is-disabled",
                          c.isInRange && "is-in-range",
                          c.isRangeStart && "is-range-start",
                          c.isRangeEnd && "is-range-end",
                          c.isFocused && "is-focused",
                        )}
                        role="gridcell"
                        aria-selected={c.isSelected}
                        aria-current={c.isToday ? "date" : undefined}
                        aria-disabled={c.isDisabled || undefined}
                      >
                        <button
                          type="button"
                          className="hbd-date-picker__cell-inner"
                          tabIndex={c.isFocused ? 0 : -1}
                          data-date={iso}
                          aria-label={ariaLabel}
                          disabled={c.isDisabled}
                          onClick={() => {
                            if (!c.isDisabled) selectDate(c.date);
                          }}
                        >
                          {c.date.getDate()}
                        </button>
                      </div>
                    );
                  })}
                </div>

                <div className="hbd-date-picker__footer">
                  <div className="hbd-date-picker__footer-group">
                    <button
                      type="button"
                      className="hbd-date-picker__footer-btn hbd-date-picker__footer-btn--muted"
                      data-action="today"
                      onClick={onTodayClick}
                    >
                      Today
                    </button>
                    <button
                      type="button"
                      className="hbd-date-picker__footer-btn hbd-date-picker__footer-btn--muted"
                      data-action="clear"
                      onClick={onClearClick}
                    >
                      Clear
                    </button>
                  </div>
                  <div className="hbd-date-picker__footer-group">
                    <button
                      type="button"
                      className="hbd-date-picker__footer-btn hbd-date-picker__footer-btn--muted"
                      data-action="cancel"
                      onClick={onCancelClick}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="hbd-date-picker__footer-btn"
                      data-action="confirm"
                      onClick={onConfirmClick}
                    >
                      Confirm
                    </button>
                  </div>
                </div>

                {isDateTime ? (
                  <div className="hbd-date-picker__time-slot">
                    <TimePicker
                      value={pendingTime ?? undefined}
                      aria-label="Time of day"
                      onValueChange={(v) => {
                        if (typeof v === "string") setPendingTime(v);
                      }}
                    />
                  </div>
                ) : null}
              </PopoverPrimitive.Content>
            </PopoverPrimitive.Portal>
          </div>
        </PopoverPrimitive.Root>

        <div className="hbd-field__footer">
          {hasHint ? (
            <span className="hbd-field__hint" id={`hint-${reactId}`}>
              {hint}
            </span>
          ) : null}
          {hasError ? (
            <span className="hbd-field__error" id={`error-${reactId}`} role="alert">
              {error}
            </span>
          ) : null}
        </div>
      </div>
    );
  },
);
DatePicker.displayName = "DatePicker";

export { DatePicker };
