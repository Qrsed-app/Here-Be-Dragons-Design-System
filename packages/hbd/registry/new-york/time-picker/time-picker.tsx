"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

// Ported from ds/components/hbd-time-picker.js + ds/styles/components/time-picker.css.
//
// Keyboard-accessible time picker: plain scrollable hour / minute / (AM·PM)
// columns with a roving tabindex (arrows move focus, Enter/Space select, Home/
// End jump, Left/Right move between columns, Escape closes), plus a
// click-to-type hour/minute header for fast numeric entry. Clear/Cancel/Confirm
// footer.
//
// The panel is an INLINE, absolutely-positioned <div> (NOT a portal / Radix
// Popover) so the legacy max-height + opacity slide — driven by the
// .hbd-time-picker--open class on the wrapper — interpolates exactly as the WC
// did. The panel stays mounted across opens so the transition can run; only the
// wrapper class toggles. We re-apply EVERY legacy .hbd-time-picker* BEM class +
// .is-selected/.is-active states so the de-shadowed time-picker.css renders 1:1.
//
// Value model (1:1 with the WC):
//   - The committed value is the HH:MM (24h) string, exposed via controlled
//     `value` + `onValueChange` + uncontrolled `defaultValue`.
//   - While the panel is open, an in-panel WORKING selection (h24/minute/ampm)
//     is mutated by clicks/keys/typing WITHOUT touching the committed value.
//     A snapshot is taken on open; Escape / Cancel / outside-click restore it
//     and close (discard). Clear wipes the working selection but keeps the
//     panel open. Confirm commits the working selection (or null) and closes.
//   - onChange fires (with { value }) only when Confirm changes the committed
//     value, matching the WC's hbd:change.

// ── useControllableState (controlled-first with uncontrolled fallback) ──────
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

export type TimePickerFormat = "12" | "24";

export interface TimePickerChangeDetail {
  /** HH:MM (24h) string, or null when cleared. */
  value: string | null;
}

type Ampm = "AM" | "PM";

export interface TimePickerProps {
  /** Controlled HH:MM (24h) value. */
  value?: string | null;
  /** Uncontrolled initial HH:MM (24h) value. */
  defaultValue?: string | null;
  /** "24" (default) or "12" hour format. */
  format?: TimePickerFormat;
  /** Minute interval for the minute column (default 1). */
  minuteStep?: number;
  /** Disables the trigger. */
  disabled?: boolean;
  /** Form field name. */
  name?: string;
  /** Error message — sets the error state + renders an alert below the field. */
  error?: string;
  /** Trigger placeholder when no value is selected. */
  placeholder?: string;
  /** Accessible label for the trigger / panel. */
  "aria-label"?: string;
  className?: string;
  /** Fired on Confirm when the committed value changes (the WC's hbd:change). */
  onValueChange?: (value: string | null) => void;
  /** Lower-level commit callback carrying the full detail (hbd:change). */
  onChange?: (detail: TimePickerChangeDetail) => void;
  /** Fired after the panel opens (hbd:open). */
  onOpen?: () => void;
  /** Fired after the panel closes (hbd:close). */
  onClose?: () => void;
}

// ── Pure helpers (mirror the WC's getters/converters) ───────────────────────
function parseValue(v: string | null | undefined): {
  h24: number | null;
  minute: number | null;
  ampm: Ampm;
} {
  const m = v && /^(\d{1,2}):(\d{2})$/.exec(v);
  if (!m) return { h24: null, minute: null, ampm: "AM" };
  const h = parseInt(m[1], 10);
  const mn = parseInt(m[2], 10);
  if (h > 23 || mn > 59) return { h24: null, minute: null, ampm: "AM" };
  return { h24: h, minute: mn, ampm: h >= 12 ? "PM" : "AM" };
}

const toDisp12 = (h: number) => h % 12 || 12;
const toH24 = (disp: number, ap: Ampm) =>
  ap === "AM" ? (disp === 12 ? 0 : disp) : disp === 12 ? 12 : disp + 12;

const pad2 = (n: number | string) => String(n).padStart(2, "0");

function TimePicker({
  value: valueProp,
  defaultValue,
  format = "24",
  minuteStep = 1,
  disabled = false,
  name,
  error,
  placeholder = "Select the hour…",
  "aria-label": ariaLabel = "Time picker",
  className,
  onValueChange,
  onChange,
  onOpen,
  onClose,
}: TimePickerProps) {
  const is12 = format === "12";
  const step = minuteStep > 0 ? Math.floor(minuteStep) : 1;

  // Committed value (controlled-first).
  const [committed, setCommitted] = useControllableState<string | null>({
    value: valueProp === undefined ? undefined : (valueProp ?? null),
    defaultValue: defaultValue ?? null,
    onChange: onValueChange,
  });

  // Working selection while open. Initialised from the committed value on open.
  const [h24, setH24] = React.useState<number | null>(null);
  const [minute, setMinute] = React.useState<number | null>(null);
  const [ampm, setAmpm] = React.useState<Ampm>("AM");
  const [open, setOpen] = React.useState(false);
  // Inline header edit: which header field is being typed, or null.
  const [editing, setEditing] = React.useState<null | "hour" | "minute">(null);

  // Snapshot of the working selection at open-time (for discard).
  const snapshot = React.useRef<{ h24: number | null; minute: number | null; ampm: Ampm }>({
    h24: null,
    minute: null,
    ampm: "AM",
  });

  const rootRef = React.useRef<HTMLDivElement>(null);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const hourScrollRef = React.useRef<HTMLDivElement>(null);
  const minuteScrollRef = React.useRef<HTMLDivElement>(null);
  const editInputRef = React.useRef<HTMLInputElement>(null);
  const uid = React.useId();

  const hours = React.useMemo(
    () =>
      is12 ? [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] : Array.from({ length: 24 }, (_, i) => i),
    [is12],
  );
  const minutes = React.useMemo(() => {
    const arr: number[] = [];
    for (let m = 0; m < 60; m += step) arr.push(m);
    return arr;
  }, [step]);

  const selDispHr = h24 === null ? null : is12 ? toDisp12(h24) : h24;
  const curAmpm: Ampm = h24 !== null ? (h24 >= 12 ? "PM" : "AM") : ampm;

  // Display label for the trigger derives from the COMMITTED value (not the
  // working selection) — matches the WC's _displayStr/_syncTriggerLabel which
  // only update the trigger on commit.
  const committedParsed = React.useMemo(() => parseValue(committed), [committed]);
  const displayStr = React.useMemo(() => {
    const { h24: ch, minute: cm } = committedParsed;
    if (ch === null || cm === null) return null;
    const mm = pad2(cm);
    if (!is12) return `${pad2(ch)}:${mm}`;
    return `${toDisp12(ch)}:${mm} ${ch >= 12 ? "PM" : "AM"}`;
  }, [committedParsed, is12]);

  const headerH = h24 !== null && selDispHr !== null ? pad2(selDispHr) : "––";
  const headerM = minute !== null ? pad2(minute) : "––";

  // Roving tabindex: the selected cell (or the first) is the column tab stop.
  const hrFocusVal = selDispHr !== null ? selDispHr : hours[0];
  const mnFocusVal = minute !== null ? minute : minutes[0];

  // ── Scroll the selected (or first) cell into view in each column ──────────
  const scrollActiveIntoView = React.useCallback(() => {
    [hourScrollRef.current, minuteScrollRef.current].forEach((col) => {
      if (!col) return;
      const active =
        col.querySelector<HTMLElement>(".is-selected") ||
        col.querySelector<HTMLElement>('.hbd-time-picker__cell[tabindex="0"]');
      if (active) active.scrollIntoView({ block: "center" });
    });
  }, []);

  // ── Open / close ─────────────────────────────────────────────────────────
  const openPanel = React.useCallback(() => {
    if (open) return;
    const p = parseValue(committed);
    setH24(p.h24);
    setMinute(p.minute);
    setAmpm(p.ampm);
    snapshot.current = { h24: p.h24, minute: p.minute, ampm: p.ampm };
    setEditing(null);
    setOpen(true);
    onOpen?.();
  }, [open, committed, onOpen]);

  const closePanel = React.useCallback(
    (returnFocus: boolean) => {
      if (!open) return;
      setOpen(false);
      setEditing(null);
      if (returnFocus) triggerRef.current?.focus({ preventScroll: true });
      onClose?.();
    },
    [open, onClose],
  );

  // Restore the open-time snapshot, then close (Escape / Cancel / outside).
  const discardAndClose = React.useCallback(
    (returnFocus: boolean) => {
      const s = snapshot.current;
      setH24(s.h24);
      setMinute(s.minute);
      setAmpm(s.ampm);
      closePanel(returnFocus);
    },
    [closePanel],
  );

  // After opening, scroll selection into view + focus the hour tab stop.
  React.useEffect(() => {
    if (!open) return;
    scrollActiveIntoView();
    const firstStop = hourScrollRef.current?.querySelector<HTMLElement>(
      '.hbd-time-picker__cell[tabindex="0"]',
    );
    if (firstStop) firstStop.focus({ preventScroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Document-level outside-click (discard) + Escape (discard), only while open.
  React.useEffect(() => {
    if (!open) return;
    const onDocMouseDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        // Outside-click discards the working selection. Whether focus returns
        // to the trigger depends on whether focus was inside the picker.
        const focusInside = rootRef.current.contains(document.activeElement);
        discardAndClose(focusInside);
      }
    };
    const onDocKeydown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        discardAndClose(true);
      }
    };
    document.addEventListener("mousedown", onDocMouseDown);
    document.addEventListener("keydown", onDocKeydown);
    return () => {
      document.removeEventListener("mousedown", onDocMouseDown);
      document.removeEventListener("keydown", onDocKeydown);
    };
  }, [open, discardAndClose]);

  // Focus the inline header edit input when one opens.
  React.useEffect(() => {
    if (editing && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editing]);

  // ── Selection ──────────────────────────────────────────────────────────
  const selectHour = (v: number) => {
    setH24(is12 ? toH24(v, ampm) : v);
    // Re-focus the chosen hour cell (keeps keyboard position).
    requestAnimationFrame(() => refocusCell("hour", is12 ? v : v));
  };
  const selectMinute = (v: number) => {
    setMinute(v);
    requestAnimationFrame(() => refocusCell("minute", v));
  };
  const selectAmpm = (ap: Ampm) => {
    setAmpm(ap);
    if (h24 !== null) setH24(toH24(toDisp12(h24), ap));
  };

  // Move the roving tab stop to the cell for `val` and focus it.
  const refocusCell = (type: "hour" | "minute", val: number) => {
    const scroll = type === "hour" ? hourScrollRef.current : minuteScrollRef.current;
    if (!scroll) return;
    const el = scroll.querySelector<HTMLElement>(`.hbd-time-picker__cell[data-val="${val}"]`);
    if (el) el.focus();
  };

  // ── Roving-tabindex keyboard navigation inside a column ──────────────────
  const onCellKeyDown = (e: React.KeyboardEvent<HTMLDivElement>, type: "hour" | "minute") => {
    const cell = e.currentTarget;
    const col = cell.parentElement!;
    const cells = Array.from(col.querySelectorAll<HTMLElement>(".hbd-time-picker__cell"));
    const i = cells.indexOf(cell);

    const moveTo = (next: HTMLElement | undefined) => {
      if (!next) return;
      // Roving tabindex: the focused cell becomes the column's tab stop.
      cells.forEach((c) => c.setAttribute("tabindex", "-1"));
      next.setAttribute("tabindex", "0");
      next.focus();
      next.scrollIntoView({ block: "nearest" });
    };
    const moveColumn = (dir: number) => {
      const scrolls = [hourScrollRef.current, minuteScrollRef.current].filter(
        Boolean,
      ) as HTMLElement[];
      const colIdx = scrolls.indexOf(col as HTMLElement);
      const target = scrolls[colIdx + dir];
      if (!target) return;
      const stop =
        target.querySelector<HTMLElement>('.hbd-time-picker__cell[tabindex="0"]') ||
        target.querySelector<HTMLElement>(".hbd-time-picker__cell");
      if (stop) {
        stop.focus();
        stop.scrollIntoView({ block: "nearest" });
      }
    };

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        moveTo(cells[Math.min(i + 1, cells.length - 1)]);
        break;
      case "ArrowUp":
        e.preventDefault();
        moveTo(cells[Math.max(i - 1, 0)]);
        break;
      case "Home":
        e.preventDefault();
        moveTo(cells[0]);
        break;
      case "End":
        e.preventDefault();
        moveTo(cells[cells.length - 1]);
        break;
      case "ArrowRight":
        e.preventDefault();
        moveColumn(1);
        break;
      case "ArrowLeft":
        e.preventDefault();
        moveColumn(-1);
        break;
      case "Enter":
      case " ": {
        e.preventDefault();
        const val = parseInt(cell.getAttribute("data-val") || "", 10);
        if (type === "hour") selectHour(val);
        else selectMinute(val);
        break;
      }
      default:
        break;
    }
  };

  // ── Footer actions ───────────────────────────────────────────────────────
  const confirm = () => {
    const next = h24 === null || minute === null ? null : `${pad2(h24)}:${pad2(minute)}`;
    const prev = committed ?? null;
    const changed = next !== prev;
    setCommitted(next);
    if (changed) onChange?.({ value: next });
    closePanel(true);
  };
  // Clear wipes the working selection but keeps the panel open.
  const clear = () => {
    setH24(null);
    setMinute(null);
    setAmpm("AM");
  };
  const cancel = () => discardAndClose(true);

  // ── Inline header typing (click-to-type) ─────────────────────────────────
  const commitHourDraft = (raw: string) => {
    const n = parseInt((raw || "").trim(), 10);
    if (Number.isNaN(n)) {
      setEditing(null);
      return false;
    }
    if (is12) {
      if (n < 1 || n > 12) {
        setEditing(null);
        return false;
      }
      setH24(toH24(n, ampm));
    } else {
      if (n < 0 || n > 23) {
        setEditing(null);
        return false;
      }
      setH24(n);
    }
    setEditing(null);
    return true;
  };
  const commitMinuteDraft = (raw: string) => {
    const n = parseInt((raw || "").trim(), 10);
    if (Number.isNaN(n) || n < 0 || n > 59) {
      setEditing(null);
      return false;
    }
    setMinute(n);
    setEditing(null);
    return true;
  };

  // ── Render ───────────────────────────────────────────────────────────────
  const hasError = error != null && error !== "";

  const renderCell = (val: number, type: "hour" | "minute") => {
    const sel =
      type === "hour" ? selDispHr !== null && val === selDispHr : minute !== null && val === minute;
    const focusable = type === "hour" ? val === hrFocusVal : val === mnFocusVal;
    return (
      <div
        key={val}
        role="option"
        aria-selected={sel}
        tabIndex={focusable ? 0 : -1}
        className={cn("hbd-time-picker__cell", sel && "is-selected")}
        data-type={type}
        data-val={val}
        onClick={() => (type === "hour" ? selectHour(val) : selectMinute(val))}
        onKeyDown={(e) => onCellKeyDown(e, type)}
      >
        {pad2(val)}
      </div>
    );
  };

  const triggerAria = `${ariaLabel}${displayStr ? `, current value ${displayStr}` : ""}`;

  return (
    <div
      ref={rootRef}
      className={cn(
        "hbd-time-picker",
        open && "hbd-time-picker--open",
        disabled && "hbd-time-picker--disabled",
        hasError && "hbd-time-picker--error",
        className,
      )}
    >
      <button
        ref={triggerRef}
        type="button"
        className="hbd-time-picker__trigger"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={triggerAria}
        disabled={disabled}
        onClick={() => {
          if (!disabled) openPanel();
        }}
      >
        <span
          className={cn(
            "hbd-time-picker__trigger-label",
            !displayStr && "hbd-time-picker__trigger-label--placeholder",
          )}
        >
          {displayStr || placeholder}
        </span>
        <span className="hbd-time-picker__caret" aria-hidden="true" />
      </button>

      {/* Always-mounted panel; the slide is controlled by the wrapper --open
          class so the max-height/opacity transition can interpolate. */}
      <div
        className="hbd-time-picker__panel"
        role="dialog"
        aria-label={ariaLabel}
        aria-modal="false"
      >
        <div className="hbd-time-picker__header">
          {editing === "hour" ? (
            <input
              ref={editInputRef}
              type="text"
              inputMode="numeric"
              maxLength={2}
              defaultValue={selDispHr !== null ? String(selDispHr) : ""}
              className="hbd-time-picker__header-input"
              data-role="hour-input"
              aria-label={`Type hour, ${is12 ? "1 to 12" : "0 to 23"}`}
              onChange={(e) => {
                const v = e.target.value.replace(/\D/g, "").slice(0, 2);
                if (v !== e.target.value) e.target.value = v;
                // Auto-advance to minute on a complete value, or a leading
                // digit that cannot extend to a valid 2-digit hour.
                if (v.length === 2) {
                  if (commitHourDraft(v)) setEditing("minute");
                  return;
                }
                if (v.length === 1) {
                  const d = parseInt(v, 10);
                  const maxFirst = is12 ? 1 : 2;
                  if (d > maxFirst) {
                    if (commitHourDraft(v)) setEditing("minute");
                  }
                }
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.stopPropagation();
                  e.preventDefault();
                  if (commitHourDraft(e.currentTarget.value)) setEditing("minute");
                }
                if (e.key === "Escape") {
                  e.stopPropagation();
                  setEditing(null);
                }
                if (e.key === "Tab" && !e.shiftKey) {
                  e.preventDefault();
                  if (commitHourDraft(e.currentTarget.value)) setEditing("minute");
                }
              }}
              onBlur={(e) => commitHourDraft(e.currentTarget.value)}
            />
          ) : (
            <span
              className="hbd-time-picker__display-num hbd-time-picker__display-num--editable"
              role="button"
              tabIndex={0}
              aria-label={`Hour ${headerH}, activate to type`}
              data-edit-hour
              onClick={() => setEditing("hour")}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setEditing("hour");
                }
              }}
            >
              {headerH}
            </span>
          )}

          <span className="hbd-time-picker__display-sep" aria-hidden="true">
            :
          </span>

          {editing === "minute" ? (
            <input
              ref={editInputRef}
              type="text"
              inputMode="numeric"
              maxLength={2}
              defaultValue={minute !== null ? pad2(minute) : ""}
              className="hbd-time-picker__header-input"
              data-role="minute-input"
              aria-label="Type minute, 0 to 59"
              onChange={(e) => {
                const v = e.target.value.replace(/\D/g, "").slice(0, 2);
                if (v !== e.target.value) e.target.value = v;
                if (v.length === 2) {
                  commitMinuteDraft(v);
                  return;
                }
                if (v.length === 1) {
                  const d = parseInt(v, 10);
                  if (d > 5) commitMinuteDraft(v);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.stopPropagation();
                  e.preventDefault();
                  commitMinuteDraft(e.currentTarget.value);
                }
                if (e.key === "Escape") {
                  e.stopPropagation();
                  setEditing(null);
                }
              }}
              onBlur={(e) => commitMinuteDraft(e.currentTarget.value)}
            />
          ) : (
            <span
              className="hbd-time-picker__display-num hbd-time-picker__display-num--editable"
              role="button"
              tabIndex={0}
              aria-label={`Minute ${headerM}, activate to type`}
              data-edit-minute
              onClick={() => setEditing("minute")}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setEditing("minute");
                }
              }}
            >
              {headerM}
            </span>
          )}

          {is12 ? <span className="hbd-time-picker__display-ampm">{curAmpm}</span> : null}
        </div>

        <div className="hbd-time-picker__columns">
          <div className="hbd-time-picker__column">
            <div
              className="hbd-time-picker__column-label"
              id={`tp-hr-lbl-${uid}`}
              aria-hidden="true"
            >
              {is12 ? "Hour" : "Hour (24)"}
            </div>
            <div
              ref={hourScrollRef}
              className="hbd-time-picker__scroll"
              data-scroll="hour"
              role="listbox"
              aria-label="Select hour"
            >
              {hours.map((hr) => renderCell(hr, "hour"))}
            </div>
          </div>

          <div className="hbd-time-picker__divider" />

          <div className="hbd-time-picker__column">
            <div className="hbd-time-picker__column-label" aria-hidden="true">
              Min
            </div>
            <div
              ref={minuteScrollRef}
              className="hbd-time-picker__scroll"
              data-scroll="minute"
              role="listbox"
              aria-label="Select minute"
            >
              {minutes.map((mn) => renderCell(mn, "minute"))}
            </div>
          </div>

          {is12 ? (
            <>
              <div className="hbd-time-picker__divider" />
              <div className="hbd-time-picker__ampm">
                <div className="hbd-time-picker__column-label" aria-hidden="true">
                  AM·PM
                </div>
                <div className="hbd-time-picker__ampm-wrap" role="listbox" aria-label="AM or PM">
                  {(["AM", "PM"] as Ampm[]).map((ap) => (
                    <button
                      key={ap}
                      type="button"
                      role="option"
                      aria-selected={curAmpm === ap}
                      data-ampm={ap}
                      className={cn("hbd-time-picker__ampm-btn", curAmpm === ap && "is-active")}
                      onClick={() => selectAmpm(ap)}
                    >
                      {ap}
                    </button>
                  ))}
                </div>
              </div>
            </>
          ) : null}
        </div>

        <div className="hbd-time-picker__footer">
          <button type="button" className="hbd-time-picker__clear" onClick={clear}>
            Clear
          </button>
          <div className="hbd-time-picker__footer-group">
            <button type="button" className="hbd-time-picker__cancel" onClick={cancel}>
              Cancel
            </button>
            <button type="button" className="hbd-time-picker__confirm" onClick={confirm}>
              Confirm
            </button>
          </div>
        </div>
      </div>

      {/* Hidden input mirrors the WC's form-associated value for native forms. */}
      {name ? <input type="hidden" name={name} value={committed ?? ""} /> : null}

      {hasError ? (
        <span className="hbd-time-picker__error-message" role="alert">
          {error}
        </span>
      ) : null}
    </div>
  );
}
TimePicker.displayName = "TimePicker";

export { TimePicker };
