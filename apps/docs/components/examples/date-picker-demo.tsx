"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import { Calendar } from "@/registry/new-york/calendar/calendar";
import { Field, FieldDescription, FieldLabel } from "@/registry/new-york/field/field";
import { Popover, PopoverContent, PopoverTrigger } from "@/registry/new-york/popover/popover";
import {
  TimePicker,
  TimePickerContent,
  TimePickerTrigger,
  TimePickerValue,
} from "@/registry/new-york/time-picker/time-picker";

// react-day-picker's DateRange, spelled out: the docs app resolves the calendar's source, not
// the package's types.
type DateRange = { from: Date | undefined; to?: Date | undefined };

const format = (date?: Date) =>
  date
    ? new Intl.DateTimeFormat(undefined, { year: "numeric", month: "long", day: "numeric" }).format(
        date,
      )
    : "";

// The old picker drew its own calendar glyph; it is part of the look.
export const CalendarGlyph = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <rect x="2" y="3" width="12" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
    <path d="M2 6h12" stroke="currentColor" strokeWidth="1.4" />
    <path d="M5 1.5v3M11 1.5v3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
  </svg>
);

// The trigger is the shared field surface with the value and a calendar glyph.
export const triggerClasses =
  "flex min-h-11 w-full cursor-pointer items-center justify-between gap-2 rounded-md border border-border-strong bg-background px-3 py-2 text-left font-sans text-[1.0625rem] leading-[1.7] text-foreground transition-[border-color,box-shadow] duration-120 ease-out outline-none select-none focus-visible:border-input-focus focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-offset-2 focus-visible:outline-ring data-[state=open]:border-input-focus aria-invalid:border-error-border aria-invalid:text-foreground-emphasis disabled:cursor-not-allowed disabled:bg-surface-subtle disabled:opacity-50";

function DatePickerTrigger({
  id,
  value,
  placeholder = "Select a date",
}: {
  id?: string;
  value: string;
  placeholder?: string;
}) {
  return (
    <PopoverTrigger asChild>
      <button type="button" id={id} className={triggerClasses}>
        <span
          className={cn(
            "min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap",
            !value && "text-muted-foreground",
          )}
        >
          {value || placeholder}
        </span>
        <span
          aria-hidden="true"
          className="inline-flex size-4 shrink-0 items-center justify-center text-muted-foreground"
        >
          <CalendarGlyph />
        </span>
      </button>
    </PopoverTrigger>
  );
}

const footerButton =
  "cursor-pointer rounded-sm px-2 py-1 font-sans text-[0.8125rem] leading-[1.7] font-medium text-foreground-emphasis transition-[background-color] duration-120 ease-out outline-none hover:bg-surface-subtle focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-offset-2 focus-visible:outline-ring";
const footerButtonMuted = `${footerButton} text-muted-foreground`;

function PanelFooter({
  onToday,
  onClear,
  onCancel,
  onConfirm,
}: {
  onToday: () => void;
  onClear: () => void;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="mt-2 flex items-center justify-between gap-2 border-t border-border-subtle pt-2">
      <div className="inline-flex items-center gap-1">
        <button type="button" className={footerButtonMuted} onClick={onToday}>
          Today
        </button>
        <button type="button" className={footerButtonMuted} onClick={onClear}>
          Clear
        </button>
      </div>
      <div className="inline-flex items-center gap-1">
        <button type="button" className={footerButtonMuted} onClick={onCancel}>
          Cancel
        </button>
        <button type="button" className={footerButton} onClick={onConfirm}>
          Confirm
        </button>
      </div>
    </div>
  );
}

const VOYAGE = new Date(1492, 7, 1);

export function DatePickerDemo() {
  const [open, setOpen] = React.useState(false);
  const [date, setDate] = React.useState<Date | undefined>(new Date(1492, 7, 3));
  // Clicks in the panel stage a date; Confirm keeps it, Cancel and Escape put it back.
  const [draft, setDraft] = React.useState<Date | undefined>(date);

  return (
    <Field className="w-72">
      <FieldLabel htmlFor="departure">Departure date</FieldLabel>
      <Popover
        open={open}
        onOpenChange={(next) => {
          if (next) setDraft(date);
          setOpen(next);
        }}
      >
        <DatePickerTrigger id="departure" value={format(date)} />
        <PopoverContent
          align="start"
          sideOffset={4}
          showArrow={false}
          className="w-auto max-w-none gap-0 overflow-hidden p-3"
        >
          <Calendar
            mode="single"
            fixedWeeks
            autoFocus
            selected={draft}
            onSelect={setDraft}
            defaultMonth={draft ?? VOYAGE}
            className="p-0"
          />
          <PanelFooter
            onToday={() => setDraft(new Date())}
            onClear={() => setDraft(undefined)}
            onCancel={() => setOpen(false)}
            onConfirm={() => {
              setDate(draft);
              setOpen(false);
            }}
          />
        </PopoverContent>
      </Popover>
      <FieldDescription>When the fleet sets sail.</FieldDescription>
    </Field>
  );
}

export function DatePickerRangeDemo() {
  const [open, setOpen] = React.useState(false);
  const [range, setRange] = React.useState<DateRange | undefined>({
    from: new Date(1492, 7, 3),
    to: new Date(1492, 9, 12),
  });
  const [draft, setDraft] = React.useState<DateRange | undefined>(range);

  const label = range?.from
    ? range.to
      ? `${format(range.from)} – ${format(range.to)}`
      : format(range.from)
    : "";

  return (
    <Field className="w-96">
      <FieldLabel htmlFor="voyage">Voyage span</FieldLabel>
      <Popover
        open={open}
        onOpenChange={(next) => {
          if (next) setDraft(range);
          setOpen(next);
        }}
      >
        <DatePickerTrigger id="voyage" value={label} placeholder="Pick a range" />
        <PopoverContent
          align="start"
          sideOffset={4}
          showArrow={false}
          className="w-auto max-w-none gap-0 overflow-hidden p-3"
        >
          <Calendar
            mode="range"
            fixedWeeks
            autoFocus
            selected={draft}
            onSelect={setDraft}
            defaultMonth={draft?.from ?? VOYAGE}
            className="p-0"
          />
          <PanelFooter
            onToday={() => setDraft({ from: new Date(), to: undefined })}
            onClear={() => setDraft(undefined)}
            onCancel={() => setOpen(false)}
            onConfirm={() => {
              setRange(draft);
              setOpen(false);
            }}
          />
        </PopoverContent>
      </Popover>
      <FieldDescription>Start and end of the crossing.</FieldDescription>
    </Field>
  );
}

export function DatePickerDateTimeDemo() {
  const [open, setOpen] = React.useState(false);
  const [date, setDate] = React.useState<Date | undefined>(new Date(1492, 7, 3));
  const [time, setTime] = React.useState("06:00");
  const [draftDate, setDraftDate] = React.useState<Date | undefined>(date);
  const [draftTime, setDraftTime] = React.useState(time);

  return (
    <Field className="w-80">
      <FieldLabel htmlFor="sailing">Sailing</FieldLabel>
      <Popover
        open={open}
        onOpenChange={(next) => {
          if (next) {
            setDraftDate(date);
            setDraftTime(time);
          }
          setOpen(next);
        }}
      >
        <DatePickerTrigger
          id="sailing"
          value={date ? `${format(date)} · ${time}` : ""}
          placeholder="Pick a moment"
        />
        <PopoverContent
          align="start"
          sideOffset={4}
          showArrow={false}
          className="w-auto max-w-none gap-0 p-3"
        >
          <Calendar
            mode="single"
            fixedWeeks
            autoFocus
            selected={draftDate}
            onSelect={setDraftDate}
            defaultMonth={draftDate ?? VOYAGE}
            className="p-0"
          />
          <PanelFooter
            onToday={() => setDraftDate(new Date())}
            onClear={() => {
              setDraftDate(undefined);
              setDraftTime("");
            }}
            onCancel={() => setOpen(false)}
            onConfirm={() => {
              setDate(draftDate);
              setTime(draftTime);
              setOpen(false);
            }}
          />
          <div className="mt-2 flex justify-center border-t border-border-subtle pt-3">
            <TimePicker value={draftTime} onValueChange={setDraftTime}>
              <TimePickerTrigger aria-label="Time of day">
                <TimePickerValue />
              </TimePickerTrigger>
              <TimePickerContent />
            </TimePicker>
          </div>
        </PopoverContent>
      </Popover>
      <FieldDescription>The tide waits for no one.</FieldDescription>
    </Field>
  );
}
