"use client";

import * as React from "react";
import { DayPicker, getDefaultClassNames, type DayButton } from "react-day-picker";

import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "@/registry/new-york/button/button";

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  captionLayout = "label",
  buttonVariant = "ghost",
  formatters,
  components,
  ...props
}: React.ComponentProps<typeof DayPicker> & {
  buttonVariant?: React.ComponentProps<typeof Button>["variant"];
}) {
  const defaultClassNames = getDefaultClassNames();

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn(
        "group/calendar bg-surface-raised p-3 [--cell-size:--spacing(9)] [[data-slot=card-content]_&]:bg-transparent [[data-slot=popover-content]_&]:bg-transparent",
        String.raw`rtl:**:[.rdp-button\_next>svg]:rotate-180`,
        String.raw`rtl:**:[.rdp-button\_previous>svg]:rotate-180`,
        className,
      )}
      captionLayout={captionLayout}
      formatters={{
        formatMonthDropdown: (date) => date.toLocaleString("default", { month: "short" }),
        formatWeekdayName: (weekday, _options, dateLib) =>
          dateLib
            ? dateLib.format(weekday, "ccc")
            : weekday.toLocaleString("default", { weekday: "short" }),
        ...formatters,
      }}
      classNames={{
        root: cn("w-fit", defaultClassNames.root),
        // gap-7 clears the 22px a week overhangs its month (see `month` below), so side-by-side
        // months keep a gap instead of the next month starting under the last column.
        months: cn("relative flex flex-col gap-7 md:flex-row", defaultClassNames.months),
        // A fixed 254px month is the old 280px panel minus its padding and borders. The day
        // tracks below are 36px with an `auto` minimum, so a week (7 × 36 + gaps) is wider
        // than the month and the last column runs into the right padding, as it always has.
        month: cn("flex w-63.5 flex-col gap-3", defaultClassNames.month),
        nav: cn(
          "absolute inset-x-0 top-0 flex w-full items-center justify-between gap-1",
          defaultClassNames.nav,
        ),
        button_previous: cn(
          buttonVariants({ variant: buttonVariant }),
          "size-8 border-0 p-0 text-foreground-secondary select-none hover:bg-surface-subtle hover:text-foreground aria-disabled:cursor-not-allowed aria-disabled:text-foreground-disabled aria-disabled:opacity-100",
          defaultClassNames.button_previous,
        ),
        button_next: cn(
          buttonVariants({ variant: buttonVariant }),
          "size-8 border-0 p-0 text-foreground-secondary select-none hover:bg-surface-subtle hover:text-foreground aria-disabled:cursor-not-allowed aria-disabled:text-foreground-disabled aria-disabled:opacity-100",
          defaultClassNames.button_next,
        ),
        month_caption: cn(
          "flex h-8 w-full items-center justify-center px-10",
          defaultClassNames.month_caption,
        ),
        dropdowns: cn(
          "flex h-8 w-full items-center justify-center gap-1.5 font-accent text-[0.8125rem] font-semibold tracking-wide",
          defaultClassNames.dropdowns,
        ),
        dropdown_root: cn(
          "relative rounded-md border border-border-strong has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-ring",
          defaultClassNames.dropdown_root,
        ),
        dropdown: cn("absolute inset-0 bg-popover opacity-0", defaultClassNames.dropdown),
        caption_label: cn(
          "font-accent text-[0.8125rem] leading-[1.7] font-semibold tracking-wide text-foreground select-none",
          captionLayout === "label"
            ? "px-2 py-1"
            : "flex h-8 items-center gap-1 rounded-md pr-1 pl-2 [&>svg]:size-3.5 [&>svg]:text-muted-foreground",
          defaultClassNames.caption_label,
        ),
        month_grid: cn("flex w-full flex-col", defaultClassNames.month_grid),
        weekdays: cn("mb-1 grid auto-cols-[1fr] grid-flow-col gap-1", defaultClassNames.weekdays),
        weekday: cn(
          "pb-1 text-center font-sans text-[0.6875rem] leading-[1.7] font-semibold tracking-wide text-muted-foreground uppercase select-none",
          defaultClassNames.weekday,
        ),
        weeks: cn("flex flex-col gap-1", defaultClassNames.weeks),
        // Day columns are exactly one cell wide. The old grid held all six weeks, so every column
        // took the widest cell in it; a week per row would otherwise let a full-width range day
        // collapse just that row's columns.
        week: cn("grid auto-cols-(--cell-size) grid-flow-col gap-1", defaultClassNames.week),
        week_number_header: cn("select-none", defaultClassNames.week_number_header),
        week_number: cn(
          "font-sans text-[0.6875rem] text-muted-foreground select-none",
          defaultClassNames.week_number,
        ),
        day: cn(
          "group/day relative flex items-center justify-center p-0 text-center select-none",
          defaultClassNames.day,
        ),
        // Start and end cells half-fill toward the run between them; a one-day range has nothing
        // to bridge to.
        range_start: cn(
          "bg-[linear-gradient(to_right,transparent_50%,var(--surface-subtle)_50%)] has-data-[range-end=true]:bg-none",
          defaultClassNames.range_start,
        ),
        range_middle: cn(defaultClassNames.range_middle),
        range_end: cn(
          "bg-[linear-gradient(to_left,transparent_50%,var(--surface-subtle)_50%)] has-data-[range-start=true]:bg-none",
          defaultClassNames.range_end,
        ),
        today: cn(defaultClassNames.today),
        outside: cn(defaultClassNames.outside),
        disabled: cn(defaultClassNames.disabled),
        hidden: cn("invisible", defaultClassNames.hidden),
        ...classNames,
      }}
      components={{
        Root: ({ className, rootRef, ...props }) => {
          return <div data-slot="calendar" ref={rootRef} className={cn(className)} {...props} />;
        },
        Chevron: ({ className, orientation, style }) => {
          return (
            <svg
              viewBox="0 0 14 14"
              fill="none"
              aria-hidden="true"
              className={cn("size-3.5", className)}
              style={style}
            >
              <path
                d={
                  orientation === "left"
                    ? "M9 3L5 7l4 4"
                    : orientation === "right"
                      ? "M5 3l4 4-4 4"
                      : "M3 5l4 4 4-4"
                }
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          );
        },
        DayButton: CalendarDayButton,
        WeekNumber: ({ children, week, ...props }) => {
          void week;
          return (
            <td {...props}>
              <div className="flex size-(--cell-size) items-center justify-center text-center">
                {children}
              </div>
            </td>
          );
        },
        ...components,
      }}
      {...props}
    />
  );
}

function CalendarDayButton({
  className,
  day,
  modifiers,
  ...props
}: React.ComponentProps<typeof DayButton>) {
  const defaultClassNames = getDefaultClassNames();

  const ref = React.useRef<HTMLButtonElement>(null);
  React.useEffect(() => {
    if (modifiers.focused) ref.current?.focus();
  }, [modifiers.focused]);

  const selectedSingle =
    modifiers.selected && !modifiers.range_start && !modifiers.range_end && !modifiers.range_middle;
  const rangeEdge = modifiers.range_start || modifiers.range_end;

  return (
    <Button
      ref={ref}
      variant="ghost"
      size="icon"
      data-day={day.date.toLocaleDateString()}
      data-selected-single={selectedSingle}
      data-range-start={modifiers.range_start}
      data-range-end={modifiers.range_end}
      data-range-middle={modifiers.range_middle}
      // State classes follow the old stylesheet's source order, so later states win exactly as
      // they did there (a selected day beats today, a range edge beats the run behind it).
      className={cn(
        // The ring marks the day the grid's roving tabindex rests on, whether or not the calendar
        // holds focus — the old panel showed it on that day from the moment it opened.
        "h-(--cell-size) w-(--cell-size) shrink aspect-auto flex-col gap-1 rounded-full border-0 p-0 font-sans text-[0.8125rem] leading-[1.7] font-normal tracking-normal text-foreground normal-case hover:bg-surface-subtle hover:text-foreground focus-visible:outline-offset-1 disabled:opacity-100 aria-disabled:opacity-100 [&>span]:text-xs [&>span]:opacity-70 [&[tabindex='0']]:outline-2 [&[tabindex='0']]:outline-solid [&[tabindex='0']]:outline-offset-1 [&[tabindex='0']]:outline-ring",
        modifiers.today && "bg-surface-subtle font-semibold",
        selectedSingle &&
          "bg-primary font-semibold text-primary-foreground hover:bg-primary hover:text-primary-foreground",
        modifiers.outside &&
          "text-muted-foreground opacity-50 hover:text-muted-foreground disabled:opacity-50 aria-disabled:opacity-50",
        modifiers.disabled && "text-foreground-disabled",
        modifiers.focused && "outline-2 outline-solid outline-offset-1 outline-ring",
        modifiers.range_middle && "w-full rounded-none bg-surface-subtle",
        rangeEdge &&
          "w-(--cell-size) rounded-full bg-primary font-semibold text-primary-foreground hover:bg-primary hover:text-primary-foreground",
        defaultClassNames.day,
        className,
      )}
      {...props}
    />
  );
}

export { Calendar, CalendarDayButton };
