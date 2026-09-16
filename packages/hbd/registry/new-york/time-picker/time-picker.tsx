"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/registry/new-york/popover/popover";

type TimePickerFormat = "12" | "24";
type Meridiem = "AM" | "PM";

/** The panel's working selection: committed only when Confirm is pressed. */
type Draft = { hour: number | null; minute: number | null; meridiem: Meridiem };

const pad2 = (value: number) => String(value).padStart(2, "0");

function parseTime(value: string | undefined): { hour: number; minute: number } | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value ?? "");
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour > 23 || minute > 59) return null;
  return { hour, minute };
}

function formatTime(value: string, format: TimePickerFormat) {
  const parsed = parseTime(value);
  if (!parsed) return "";
  const { hour, minute } = parsed;
  if (format === "24") return `${pad2(hour)}:${pad2(minute)}`;
  return `${hour % 12 || 12}:${pad2(minute)} ${hour >= 12 ? "PM" : "AM"}`;
}

const to24 = (displayHour: number, meridiem: Meridiem) =>
  meridiem === "AM" ? displayHour % 12 : (displayHour % 12) + 12;

function toDraft(value: string): Draft {
  const parsed = parseTime(value);
  if (!parsed) return { hour: null, minute: null, meridiem: "AM" };
  return { hour: parsed.hour, minute: parsed.minute, meridiem: parsed.hour >= 12 ? "PM" : "AM" };
}

function useControllableState<T>(
  prop: T | undefined,
  defaultValue: T,
  onChange?: (value: T) => void,
) {
  const [uncontrolled, setUncontrolled] = React.useState(defaultValue);
  const isControlled = prop !== undefined;
  const state = isControlled ? prop : uncontrolled;
  const setState = React.useCallback(
    (next: T) => {
      if (!isControlled) setUncontrolled(next);
      onChange?.(next);
    },
    [isControlled, onChange],
  );
  return [state, setState] as const;
}

type TimePickerContextValue = {
  value: string;
  commit: (value: string) => void;
  format: TimePickerFormat;
  minuteStep: number;
  disabled: boolean;
  open: boolean;
  setOpen: (open: boolean) => void;
  draft: Draft;
  setDraft: React.Dispatch<React.SetStateAction<Draft>>;
};

const TimePickerContext = React.createContext<TimePickerContextValue | null>(null);

function useTimePicker() {
  const context = React.useContext(TimePickerContext);
  if (!context) throw new Error("TimePicker parts must be used within <TimePicker>");
  return context;
}

function TimePicker({
  value: valueProp,
  defaultValue = "",
  onValueChange,
  format = "24",
  minuteStep = 1,
  disabled = false,
  name,
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  children,
  ...props
}: Omit<React.ComponentProps<typeof Popover>, "value" | "defaultValue"> & {
  /** Controlled `HH:MM` value on a 24-hour clock, whatever the display format. */
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  format?: TimePickerFormat;
  minuteStep?: number;
  disabled?: boolean;
  name?: string;
}) {
  const [value, setValue] = useControllableState(valueProp, defaultValue, onValueChange);
  const [open, setOpenState] = useControllableState(openProp, defaultOpen, onOpenChange);
  const [draft, setDraft] = React.useState<Draft>(() => toDraft(value));

  // Opening snapshots the committed value into the draft, so closing any other way than
  // Confirm — Cancel, Escape, an outside click — leaves the committed value alone.
  const setOpen = React.useCallback(
    (next: boolean) => {
      if (next) setDraft(toDraft(value));
      setOpenState(next);
    },
    [value, setOpenState],
  );

  const commit = React.useCallback(
    (next: string) => {
      if (next !== value) setValue(next);
      setOpenState(false);
    },
    [value, setValue, setOpenState],
  );

  const context = React.useMemo<TimePickerContextValue>(
    () => ({
      value,
      commit,
      format,
      minuteStep,
      disabled,
      open,
      setOpen,
      draft,
      setDraft,
    }),
    [value, commit, format, minuteStep, disabled, open, setOpen, draft],
  );

  return (
    <TimePickerContext.Provider value={context}>
      <Popover open={open} onOpenChange={setOpen} {...props}>
        {children}
      </Popover>
      {name ? <input type="hidden" name={name} value={value} /> : null}
    </TimePickerContext.Provider>
  );
}

function TimePickerTrigger({ className, children, ...props }: React.ComponentProps<"button">) {
  const { disabled, open } = useTimePicker();

  return (
    <PopoverTrigger asChild>
      <button
        type="button"
        data-slot="time-picker-trigger"
        data-state={open ? "open" : "closed"}
        disabled={disabled}
        className={cn(
          "inline-flex min-h-12 min-w-44 cursor-pointer items-center justify-between gap-2 rounded-md border border-border-strong bg-parchment-300 px-3 py-2 font-display text-[1.0625rem] leading-[1.7] text-foreground transition-[border-color,box-shadow] duration-120 ease-out outline-none focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-offset-2 focus-visible:outline-ring data-[state=open]:border-input-focus aria-invalid:border-error disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-surface-raised disabled:opacity-50",
          className,
        )}
        {...props}
      >
        {children}
        <span
          data-slot="time-picker-caret"
          aria-hidden="true"
          className="size-0 shrink-0 border-x-4 border-t-4 border-x-transparent border-t-muted-foreground"
        />
      </button>
    </PopoverTrigger>
  );
}

function TimePickerValue({
  className,
  placeholder = "Select the hour…",
  ...props
}: React.ComponentProps<"span"> & { placeholder?: string }) {
  const { value, format } = useTimePicker();
  const display = formatTime(value, format);

  return (
    <span
      data-slot="time-picker-value"
      data-placeholder={display ? undefined : ""}
      className={cn(
        "flex-1 text-left whitespace-nowrap data-[placeholder]:text-muted-foreground",
        className,
      )}
      {...props}
    >
      {display || placeholder}
    </span>
  );
}

const footerButton =
  "min-h-12 cursor-pointer px-2 py-1 font-display text-[0.8125rem] leading-[1.7] tracking-wide text-muted-foreground uppercase transition-[color] duration-120 ease-out outline-none hover:text-foreground focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-offset-2 focus-visible:outline-ring";

function TimePickerContent({
  className,
  align = "start",
  sideOffset = 4,
  showArrow = false,
  onOpenAutoFocus,
  ...props
}: React.ComponentProps<typeof PopoverContent>) {
  const { format, minuteStep, draft, setDraft, value, commit, setOpen } = useTimePicker();
  const is12 = format === "12";
  const step = minuteStep > 0 ? Math.floor(minuteStep) : 1;

  const hours = React.useMemo(
    () =>
      is12 ? Array.from({ length: 12 }, (_, i) => i + 1) : Array.from({ length: 24 }, (_, i) => i),
    [is12],
  );
  const minutes = React.useMemo(() => {
    const out: number[] = [];
    for (let minute = 0; minute < 60; minute += step) out.push(minute);
    return out;
  }, [step]);

  const displayHour = draft.hour === null ? null : is12 ? draft.hour % 12 || 12 : draft.hour;
  const meridiem: Meridiem =
    draft.hour !== null ? (draft.hour >= 12 ? "PM" : "AM") : draft.meridiem;

  const contentRef = React.useRef<HTMLDivElement>(null);
  const [editing, setEditing] = React.useState<null | "hour" | "minute">(null);
  const editRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (!editing) return;
    editRef.current?.focus();
    editRef.current?.select();
  }, [editing]);

  const selectHour = (hour: number) =>
    setDraft((prev) => ({ ...prev, hour: is12 ? to24(hour, meridiem) : hour }));
  const selectMinute = (minute: number) => setDraft((prev) => ({ ...prev, minute }));
  const selectMeridiem = (next: Meridiem) =>
    setDraft((prev) => ({
      ...prev,
      meridiem: next,
      hour: prev.hour === null ? null : to24(prev.hour % 12 || 12, next),
    }));

  const confirm = () =>
    commit(
      draft.hour === null || draft.minute === null
        ? ""
        : `${pad2(draft.hour)}:${pad2(draft.minute)}`,
    );

  const columns = () =>
    Array.from(
      contentRef.current?.querySelectorAll<HTMLElement>('[data-slot="time-picker-scroll"]') ?? [],
    );

  const onCellKeyDown = (
    event: React.KeyboardEvent<HTMLDivElement>,
    onSelect: (value: number) => void,
  ) => {
    const cell = event.currentTarget;
    const column = cell.parentElement;
    const cells = Array.from(
      column?.querySelectorAll<HTMLElement>('[data-slot="time-picker-cell"]') ?? [],
    );
    const index = cells.indexOf(cell);
    const move = (next: HTMLElement | undefined) => {
      if (!next) return;
      next.focus();
      next.scrollIntoView({ block: "nearest" });
    };
    const moveColumn = (direction: number) => {
      const all = columns();
      const target = all[all.indexOf(column as HTMLElement) + direction];
      if (!target) return;
      move(
        target.querySelector<HTMLElement>('[data-slot="time-picker-cell"][tabindex="0"]') ??
          target.querySelector<HTMLElement>('[data-slot="time-picker-cell"]') ??
          undefined,
      );
    };

    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        move(cells[Math.min(index + 1, cells.length - 1)]);
        break;
      case "ArrowUp":
        event.preventDefault();
        move(cells[Math.max(index - 1, 0)]);
        break;
      case "Home":
        event.preventDefault();
        move(cells[0]);
        break;
      case "End":
        event.preventDefault();
        move(cells[cells.length - 1]);
        break;
      case "ArrowRight":
        event.preventDefault();
        moveColumn(1);
        break;
      case "ArrowLeft":
        event.preventDefault();
        moveColumn(-1);
        break;
      case "Enter":
      case " ":
        event.preventDefault();
        onSelect(Number(cell.dataset.value));
        break;
      default:
        break;
    }
  };

  const commitHourDraft = (raw: string) => {
    const typed = Number.parseInt(raw.trim(), 10);
    setEditing(null);
    if (Number.isNaN(typed)) return false;
    if (is12) {
      if (typed < 1 || typed > 12) return false;
      setDraft((prev) => ({
        ...prev,
        hour: to24(typed, prev.hour !== null ? (prev.hour >= 12 ? "PM" : "AM") : prev.meridiem),
      }));
      return true;
    }
    if (typed < 0 || typed > 23) return false;
    setDraft((prev) => ({ ...prev, hour: typed }));
    return true;
  };

  const commitMinuteDraft = (raw: string) => {
    const typed = Number.parseInt(raw.trim(), 10);
    setEditing(null);
    if (Number.isNaN(typed) || typed < 0 || typed > 59) return false;
    setDraft((prev) => ({ ...prev, minute: typed }));
    return true;
  };

  const renderColumn = (
    kind: "hour" | "minute",
    label: string,
    values: number[],
    selected: number | null,
    onSelect: (value: number) => void,
  ) => (
    <div data-slot="time-picker-column" className="flex flex-1 flex-col">
      <div
        data-slot="time-picker-column-label"
        aria-hidden="true"
        className="border-b border-parchment-400 bg-parchment-300 px-1 pt-2 pb-1 text-center font-display text-[0.6875rem] leading-[1.7] tracking-[0.3em] text-foreground-gold uppercase"
      >
        {label}
      </div>
      <div
        data-slot="time-picker-scroll"
        role="listbox"
        aria-label={`Select ${kind}`}
        className="h-45 overflow-x-hidden overflow-y-auto [scrollbar-color:var(--parchment-400)_var(--parchment-300)] [scrollbar-width:thin] [&::-webkit-scrollbar-thumb]:bg-parchment-400 [&::-webkit-scrollbar-track]:bg-parchment-300 [&::-webkit-scrollbar]:w-1"
      >
        {values.map((entry) => {
          const isSelected = selected !== null && entry === selected;
          return (
            <div
              key={entry}
              role="option"
              aria-selected={isSelected}
              data-slot="time-picker-cell"
              data-value={entry}
              data-selected={isSelected ? "true" : undefined}
              tabIndex={entry === (selected ?? values[0]) ? 0 : -1}
              className={cn(
                "flex h-9 cursor-pointer items-center justify-center font-display text-[1.0625rem] leading-[1.7] text-foreground transition-[background-color,color] duration-120 ease-out outline-none select-none hover:bg-surface-subtle focus-visible:outline-2 focus-visible:outline-solid focus-visible:-outline-offset-2 focus-visible:outline-ring",
                isSelected && "bg-primary text-primary-foreground hover:bg-primary",
              )}
              onClick={() => onSelect(entry)}
              onKeyDown={(event) => onCellKeyDown(event, onSelect)}
            >
              {pad2(entry)}
            </div>
          );
        })}
      </div>
    </div>
  );

  const headerNumber =
    "cursor-pointer border-b-2 border-transparent font-display text-2xl leading-none text-foreground tabular-nums outline-none hover:border-border-gold hover:text-foreground-gold focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-offset-2 focus-visible:outline-ring";

  return (
    <PopoverContent
      ref={contentRef}
      data-slot="time-picker-content"
      align={align}
      sideOffset={sideOffset}
      showArrow={showArrow}
      className={cn(
        // max-h-80 is the panel's height budget: a full panel is a couple of pixels taller, so
        // centring the selection scrolls the panel itself by that much, as it always has.
        "flex max-h-80 w-auto max-w-none min-w-55 flex-col gap-0 overflow-hidden rounded-md border-border-strong bg-parchment-300 p-0 font-display shadow-lg",
        className,
      )}
      onOpenAutoFocus={(event) => {
        onOpenAutoFocus?.(event);
        if (event.defaultPrevented) return;
        // Land on the hour column with the current selection centred, as the old panel did,
        // instead of on the panel's first focusable node.
        event.preventDefault();
        for (const column of columns()) {
          const active =
            column.querySelector<HTMLElement>('[data-selected="true"]') ??
            column.querySelector<HTMLElement>('[data-slot="time-picker-cell"][tabindex="0"]');
          active?.scrollIntoView({ block: "center" });
        }
        columns()[0]
          ?.querySelector<HTMLElement>('[data-slot="time-picker-cell"][tabindex="0"]')
          ?.focus({ preventScroll: true });
      }}
      {...props}
    >
      <div
        data-slot="time-picker-header"
        className="flex items-baseline gap-1 border-b border-parchment-400 bg-parchment-300 px-4 py-2"
      >
        {editing === "hour" ? (
          <input
            ref={editRef}
            type="text"
            inputMode="numeric"
            maxLength={2}
            defaultValue={displayHour !== null ? String(displayHour) : ""}
            data-slot="time-picker-header-input"
            aria-label={`Type hour, ${is12 ? "1 to 12" : "0 to 23"}`}
            className="w-[2.4ch] border-0 border-b-2 border-border-gold bg-transparent p-0 text-center font-display text-2xl leading-none text-foreground-secondary tabular-nums outline-none"
            onChange={(event) => {
              const digits = event.target.value.replace(/\D/g, "").slice(0, 2);
              if (digits !== event.target.value) event.target.value = digits;
              // Jump to the minute as soon as no second digit could make a valid hour.
              if (digits.length === 2) {
                if (commitHourDraft(digits)) setEditing("minute");
                return;
              }
              if (digits.length === 1 && Number(digits) > (is12 ? 1 : 2)) {
                if (commitHourDraft(digits)) setEditing("minute");
              }
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter" || (event.key === "Tab" && !event.shiftKey)) {
                event.preventDefault();
                event.stopPropagation();
                if (commitHourDraft(event.currentTarget.value)) setEditing("minute");
              }
              if (event.key === "Escape") {
                event.stopPropagation();
                setEditing(null);
              }
            }}
            onBlur={(event) => commitHourDraft(event.currentTarget.value)}
          />
        ) : (
          <span
            role="button"
            tabIndex={0}
            data-slot="time-picker-header-hour"
            aria-label={`Hour ${displayHour !== null ? pad2(displayHour) : "unset"}, activate to type`}
            className={headerNumber}
            onClick={() => setEditing("hour")}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                setEditing("hour");
              }
            }}
          >
            {displayHour !== null ? pad2(displayHour) : "––"}
          </span>
        )}

        <span aria-hidden="true" className="font-display text-xl leading-none text-foreground-gold">
          :
        </span>

        {editing === "minute" ? (
          <input
            ref={editRef}
            type="text"
            inputMode="numeric"
            maxLength={2}
            defaultValue={draft.minute !== null ? pad2(draft.minute) : ""}
            data-slot="time-picker-header-input"
            aria-label="Type minute, 0 to 59"
            className="w-[2.4ch] border-0 border-b-2 border-border-gold bg-transparent p-0 text-center font-display text-2xl leading-none text-foreground-secondary tabular-nums outline-none"
            onChange={(event) => {
              const digits = event.target.value.replace(/\D/g, "").slice(0, 2);
              if (digits !== event.target.value) event.target.value = digits;
              if (digits.length === 2) {
                commitMinuteDraft(digits);
                return;
              }
              if (digits.length === 1 && Number(digits) > 5) commitMinuteDraft(digits);
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                event.stopPropagation();
                commitMinuteDraft(event.currentTarget.value);
              }
              if (event.key === "Escape") {
                event.stopPropagation();
                setEditing(null);
              }
            }}
            onBlur={(event) => commitMinuteDraft(event.currentTarget.value)}
          />
        ) : (
          <span
            role="button"
            tabIndex={0}
            data-slot="time-picker-header-minute"
            aria-label={`Minute ${draft.minute !== null ? pad2(draft.minute) : "unset"}, activate to type`}
            className={headerNumber}
            onClick={() => setEditing("minute")}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                setEditing("minute");
              }
            }}
          >
            {draft.minute !== null ? pad2(draft.minute) : "––"}
          </span>
        )}

        {is12 ? (
          <span
            data-slot="time-picker-header-meridiem"
            className="ml-2 self-end font-sans text-[0.6875rem] leading-[1.7] tracking-[0.15em] text-foreground-gold"
          >
            {meridiem}
          </span>
        ) : null}
      </div>

      <div data-slot="time-picker-columns" className="flex border-b border-parchment-400">
        {renderColumn("hour", is12 ? "Hour" : "Hour (24)", hours, displayHour, selectHour)}
        <div data-slot="time-picker-divider" className="w-px shrink-0 bg-parchment-400" />
        {renderColumn("minute", "Min", minutes, draft.minute, selectMinute)}
        {is12 ? (
          <>
            <div data-slot="time-picker-divider" className="w-px shrink-0 bg-parchment-400" />
            <div data-slot="time-picker-meridiem" className="flex w-13 shrink-0 flex-col">
              <div
                data-slot="time-picker-column-label"
                aria-hidden="true"
                className="border-b border-parchment-400 bg-parchment-300 px-1 pt-2 pb-1 text-center font-display text-[0.6875rem] leading-[1.7] tracking-[0.3em] text-foreground-gold uppercase"
              >
                AM·PM
              </div>
              <div
                role="listbox"
                aria-label="AM or PM"
                className="flex h-45 flex-col justify-center gap-2 p-2"
              >
                {(["AM", "PM"] as const).map((entry) => (
                  <button
                    key={entry}
                    type="button"
                    role="option"
                    aria-selected={meridiem === entry}
                    data-slot="time-picker-meridiem-option"
                    data-active={meridiem === entry ? "true" : undefined}
                    className={cn(
                      "flex h-9 cursor-pointer items-center justify-center border border-parchment-400 bg-surface-subtle font-display text-[0.8125rem] leading-[1.7] tracking-wide text-foreground-secondary transition-[background-color,color] duration-120 ease-out outline-none hover:text-foreground focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-offset-2 focus-visible:outline-ring",
                      meridiem === entry &&
                        "border-blood-deep bg-primary text-primary-foreground hover:text-primary-foreground",
                    )}
                    onClick={() => selectMeridiem(entry)}
                  >
                    {entry}
                  </button>
                ))}
              </div>
            </div>
          </>
        ) : null}
      </div>

      <div
        data-slot="time-picker-footer"
        className="flex items-center justify-between gap-2 border-t border-parchment-400 px-3 py-2"
      >
        <button
          type="button"
          data-slot="time-picker-clear"
          className={footerButton}
          onClick={() => setDraft({ hour: null, minute: null, meridiem: "AM" })}
        >
          Clear
        </button>
        <div className="inline-flex items-center gap-2">
          <button
            type="button"
            data-slot="time-picker-cancel"
            className={footerButton}
            onClick={() => setOpen(false)}
          >
            Cancel
          </button>
          <button
            type="button"
            data-slot="time-picker-confirm"
            className="min-h-12 cursor-pointer rounded-sm bg-primary px-4 py-2 font-display text-[0.8125rem] leading-[1.7] font-bold tracking-[0.2em] text-primary-foreground uppercase shadow-[3px_3px_0_var(--blood-deep)] transition-[box-shadow] duration-120 ease-out outline-none focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-offset-2 focus-visible:outline-ring"
            onClick={confirm}
          >
            Confirm
          </button>
        </div>
      </div>
      <span className="sr-only" aria-live="polite">
        {formatTime(value, format)}
      </span>
    </PopoverContent>
  );
}

export { TimePicker, TimePickerTrigger, TimePickerValue, TimePickerContent };
