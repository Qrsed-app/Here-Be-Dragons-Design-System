"use client";

import * as React from "react";
import { Loader2Icon } from "lucide-react";
import { useTheme } from "next-themes";
import { Toaster as Sonner, type ToasterProps } from "sonner";

import { cn } from "@/lib/utils";

type ToastClassNames = NonNullable<NonNullable<ToasterProps["toastOptions"]>["classNames"]>;

const glyph = {
  viewBox: "0 0 16 16",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
  focusable: "false",
} as const;

const INFO_PATHS =
  '<circle cx="8" cy="8" r="6.5"/><line x1="8" y1="7" x2="8" y2="11.5"/><circle cx="8" cy="4.5" r="0.6" fill="#000" stroke="none"/>';

// A plain toast() renders no icon element, so the info glyph is painted as a mask instead.
const INFO_MASK = `url("data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none" stroke="#000" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${INFO_PATHS}</svg>`,
)}")`;

const icons: ToasterProps["icons"] = {
  info: (
    <svg {...glyph}>
      <circle cx="8" cy="8" r="6.5" />
      <line x1="8" y1="7" x2="8" y2="11.5" />
      <circle cx="8" cy="4.5" r="0.6" fill="currentColor" stroke="none" />
    </svg>
  ),
  success: (
    <svg {...glyph}>
      <circle cx="8" cy="8" r="6.5" />
      <polyline points="5,8.5 7.2,10.6 11,6.5" />
    </svg>
  ),
  warning: (
    <svg {...glyph}>
      <path d="M8 1.5 L14.5 13 H1.5 Z" />
      <line x1="8" y1="6" x2="8" y2="9.5" />
      <circle cx="8" cy="11.4" r="0.6" fill="currentColor" stroke="none" />
    </svg>
  ),
  error: (
    <svg {...glyph}>
      <circle cx="8" cy="8" r="6.5" />
      <line x1="5.5" y1="5.5" x2="10.5" y2="10.5" />
      <line x1="10.5" y1="5.5" x2="5.5" y2="10.5" />
    </svg>
  ),
  loading: <Loader2Icon className="size-4 animate-spin" />,
  close: (
    <svg {...glyph} strokeWidth={1.8}>
      <line x1="4" y1="4" x2="12" y2="12" />
      <line x1="12" y1="4" x2="4" y2="12" />
    </svg>
  ),
};

const linkButton =
  "cursor-pointer justify-self-start border-0 bg-transparent p-0 font-semibold text-inherit underline outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current focus-visible:outline-solid";

function hbdClassNames(countdown: boolean): ToastClassNames {
  return {
    // Sonner positions each toast absolutely inside a --width box, so w-fit shrinks it to its
    // content exactly as the old flex container did. The close button opens an implicit third column.
    toast:
      "group/toast grid w-fit max-w-full grid-cols-[1rem_minmax(0,1fr)] items-start gap-x-2 overflow-hidden rounded-md border-l-4 p-3 font-sans text-[1.0625rem] leading-[1.7] shadow-lg data-[x-position=center]:left-1/2 data-[x-position=center]:w-max data-[x-position=center]:max-w-(--width) data-[x-position=center]:-translate-x-1/2",
    default: "border-l-info-border bg-info text-info-foreground",
    info: "border-l-info-border bg-info text-info-foreground",
    loading: "border-l-info-border bg-info text-info-foreground",
    success: "border-l-success-border bg-success text-success-foreground",
    warning: "border-l-warning-border bg-warning text-warning-foreground",
    error: "border-l-error-border bg-error text-error-foreground",
    icon: "relative col-start-1 row-start-1 mt-1 inline-flex size-4 shrink-0 items-center justify-center empty:bg-current empty:[mask-image:var(--hbd-toast-icon-info)] empty:[mask-size:100%_100%] [&>svg]:block [&>svg]:size-full",
    content: cn(
      "col-start-2 row-start-1 flex min-w-0 flex-col gap-1",
      "in-[[data-sonner-toast]:not(:has(>[data-icon]))]:before:absolute in-[[data-sonner-toast]:not(:has(>[data-icon]))]:before:top-4 in-[[data-sonner-toast]:not(:has(>[data-icon]))]:before:left-3 in-[[data-sonner-toast]:not(:has(>[data-icon]))]:before:size-4 in-[[data-sonner-toast]:not(:has(>[data-icon]))]:before:bg-current in-[[data-sonner-toast]:not(:has(>[data-icon]))]:before:[mask-image:var(--hbd-toast-icon-info)] in-[[data-sonner-toast]:not(:has(>[data-icon]))]:before:[mask-size:100%_100%]",
      // Countdown bar. Sonner keeps each toast's duration private, so the bar runs for the
      // Toaster's duration; it pauses while the stack is hovered, as Sonner's timer does.
      countdown &&
        "after:absolute after:bottom-0 after:left-0 after:h-[3px] after:w-full after:animate-out after:bg-current after:opacity-30 after:duration-(--hbd-toast-duration) after:ease-linear after:fill-mode-forwards after:slide-out-to-left-full group-hover:after:[animation-play-state:paused] in-data-[type=loading]:after:hidden motion-reduce:after:hidden",
    ),
    title:
      "text-[1.0625rem] leading-[1.7] font-normal not-only:leading-[1.35] not-only:font-semibold",
    description: "text-[1.0625rem] leading-[1.7]",
    actionButton: cn("col-start-2 row-start-2 mt-3", linkButton),
    cancelButton: cn("col-start-2 row-start-3 mt-1", linkButton),
    closeButton:
      "col-start-3 row-span-2 row-start-1 -my-2 -mr-2 inline-flex min-h-12 min-w-12 cursor-pointer items-center justify-center self-start rounded-sm border-0 bg-transparent p-1 text-inherit opacity-85 transition-opacity duration-120 ease-out outline-none hover:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current focus-visible:outline-solid [&>svg]:block [&>svg]:size-3",
  };
}

// Defaults are destructured, not set before {...props}: an explicit `position={undefined}` would
// otherwise reset them to Sonner's own.
const Toaster = ({
  toastOptions,
  style,
  position = "top-right",
  expand = true,
  closeButton = true,
  gap = 8,
  offset = 16,
  mobileOffset = 16,
  duration = 5000,
  ...props
}: ToasterProps) => {
  const { theme = "system" } = useTheme();
  const countdown = Number.isFinite(duration);
  const classNames = React.useMemo(() => {
    const base = hbdClassNames(countdown);
    const extra = toastOptions?.classNames ?? {};
    for (const key of Object.keys(extra) as (keyof ToastClassNames)[]) {
      base[key] = cn(base[key], extra[key]);
    }
    return base;
  }, [countdown, toastOptions?.classNames]);

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      position={position}
      expand={expand}
      closeButton={closeButton}
      gap={gap}
      offset={offset}
      mobileOffset={mobileOffset}
      duration={duration}
      icons={icons}
      style={
        {
          // Sonner declares these on the toaster for its own styled mode, shadowing the theme
          // tokens of the same name that border-l-*-border reads; inherit restores the theme's.
          "--info-border": "inherit",
          "--success-border": "inherit",
          "--warning-border": "inherit",
          "--error-border": "inherit",
          "--width": "328px",
          "--hbd-toast-duration": countdown ? `${duration}ms` : undefined,
          "--hbd-toast-icon-info": INFO_MASK,
          ...style,
        } as React.CSSProperties
      }
      toastOptions={{ unstyled: true, ...toastOptions, classNames }}
      {...props}
    />
  );
};

export { Toaster };
