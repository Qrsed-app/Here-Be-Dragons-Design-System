"use client";

import * as React from "react";

import { Calendar } from "@/registry/new-york/calendar/calendar";

// react-day-picker's DateRange, spelled out: the docs app resolves the calendar's source, not
// the package's types.
type DateRange = { from: Date | undefined; to?: Date | undefined };

const panel = "rounded-lg border border-border-subtle shadow-lg";

// August 1492: the fleet sails.
const VOYAGE = new Date(1492, 7, 1);

export function CalendarDemo() {
  const [date, setDate] = React.useState<Date | undefined>(new Date(1492, 7, 3));

  return (
    <Calendar
      mode="single"
      selected={date}
      onSelect={setDate}
      defaultMonth={VOYAGE}
      className={panel}
    />
  );
}

export function CalendarRangeDemo() {
  const [range, setRange] = React.useState<DateRange | undefined>({
    from: new Date(1492, 7, 3),
    to: new Date(1492, 7, 12),
  });

  return (
    <Calendar
      mode="range"
      selected={range}
      onSelect={setRange}
      defaultMonth={VOYAGE}
      className={panel}
    />
  );
}

export function CalendarMultipleMonthsDemo() {
  const [range, setRange] = React.useState<DateRange | undefined>({
    from: new Date(1492, 7, 28),
    to: new Date(1492, 8, 6),
  });

  return (
    <Calendar
      mode="range"
      numberOfMonths={2}
      selected={range}
      onSelect={setRange}
      defaultMonth={VOYAGE}
      className={panel}
    />
  );
}

export function CalendarDropdownDemo() {
  const [date, setDate] = React.useState<Date | undefined>(new Date(1492, 7, 3));

  return (
    <Calendar
      mode="single"
      captionLayout="dropdown"
      startMonth={new Date(1490, 0)}
      endMonth={new Date(1500, 11)}
      selected={date}
      onSelect={setDate}
      defaultMonth={VOYAGE}
      className={panel}
    />
  );
}

export function CalendarDisabledDemo() {
  const [date, setDate] = React.useState<Date | undefined>(new Date(1492, 7, 15));

  return (
    <Calendar
      mode="single"
      selected={date}
      onSelect={setDate}
      defaultMonth={VOYAGE}
      disabled={[{ before: new Date(1492, 7, 5) }, { after: new Date(1492, 7, 25) }]}
      className={panel}
    />
  );
}

export function CalendarWeekNumbersDemo() {
  return <Calendar mode="single" showWeekNumber defaultMonth={VOYAGE} className={panel} />;
}

export function CalendarMultipleDemo() {
  const [dates, setDates] = React.useState<Date[] | undefined>([
    new Date(1492, 7, 3),
    new Date(1492, 7, 10),
    new Date(1492, 7, 17),
  ]);

  return (
    <Calendar
      mode="multiple"
      selected={dates}
      onSelect={setDates}
      defaultMonth={VOYAGE}
      className={panel}
    />
  );
}
