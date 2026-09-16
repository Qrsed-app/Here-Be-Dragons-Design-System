"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Tabs as TabsPrimitive } from "radix-ui";

import { cn } from "@/lib/utils";

function Tabs({
  className,
  orientation = "horizontal",
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      data-orientation={orientation}
      orientation={orientation}
      className={cn(
        "group/tabs flex w-full max-w-full min-w-0 font-sans data-[orientation=horizontal]:flex-col",
        className,
      )}
      {...props}
    />
  );
}

const tabsListVariants = cva(
  "group/tabs-list relative flex w-full min-w-0 gap-1 border-b-2 border-border-strong px-2 text-muted-foreground group-data-[orientation=vertical]/tabs:w-40 group-data-[orientation=vertical]/tabs:min-w-40 group-data-[orientation=vertical]/tabs:flex-col group-data-[orientation=vertical]/tabs:border-r-2 group-data-[orientation=vertical]/tabs:border-b-0 group-data-[orientation=vertical]/tabs:px-0 group-data-[orientation=vertical]/tabs:py-2",
  {
    variants: {
      variant: {
        default: "",
        line: "",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

function TabsList({
  className,
  variant = "default",
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List> & VariantProps<typeof tabsListVariants>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      data-variant={variant}
      className={cn(tabsListVariants({ variant }), className)}
      {...props}
    />
  );
}

function TabsTrigger({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        "group/tabs-trigger relative -mb-0.5 inline-flex shrink-0 cursor-pointer items-center gap-2 rounded-t-md border border-b-0 border-border-strong bg-surface-subtle px-4 py-3 font-sans text-[1.0625rem] font-medium whitespace-nowrap text-muted-foreground transition-[background-color,color,border-color,transform] duration-120 ease-out outline-none hover:not-data-[state=active]:bg-surface-raised hover:not-data-[state=active]:text-foreground focus-visible:z-10 focus-visible:outline-solid focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring disabled:pointer-events-none disabled:cursor-not-allowed disabled:border-border-subtle disabled:bg-transparent disabled:text-foreground-disabled data-[state=active]:z-10 data-[state=active]:bg-background data-[state=active]:font-semibold data-[state=active]:text-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        // The ribbon: a gold strip on hover, a thicker blood strip on the active tab.
        "before:pointer-events-none before:absolute before:-top-px before:-right-px before:-left-px before:h-0.5 before:rounded-t-md before:bg-gold-deep before:opacity-0 before:transition-[opacity,background-color,height] before:duration-120 before:ease-out hover:before:opacity-100 data-[state=active]:before:h-[3px] data-[state=active]:before:bg-primary data-[state=active]:before:opacity-100",
        "group-data-[orientation=vertical]/tabs:mb-0 group-data-[orientation=vertical]/tabs:-mr-0.5 group-data-[orientation=vertical]/tabs:w-full group-data-[orientation=vertical]/tabs:justify-start group-data-[orientation=vertical]/tabs:rounded-tr-none group-data-[orientation=vertical]/tabs:rounded-bl-md group-data-[orientation=vertical]/tabs:border-r-0 group-data-[orientation=vertical]/tabs:before:right-auto group-data-[orientation=vertical]/tabs:before:-bottom-px group-data-[orientation=vertical]/tabs:before:h-auto group-data-[orientation=vertical]/tabs:before:w-[3px] group-data-[orientation=vertical]/tabs:before:rounded-tr-none group-data-[orientation=vertical]/tabs:before:rounded-bl-md group-data-[orientation=vertical]/tabs:data-[state=active]:before:h-auto group-data-[orientation=vertical]/tabs:data-[state=active]:before:w-[3.99px]",
        "group-data-[variant=line]/tabs-list:border-transparent group-data-[variant=line]/tabs-list:bg-transparent group-data-[variant=line]/tabs-list:disabled:border-transparent group-data-[variant=line]/tabs-list:before:hidden group-data-[variant=line]/tabs-list:hover:not-data-[state=active]:bg-transparent group-data-[variant=line]/tabs-list:data-[state=active]:bg-transparent",
        "after:pointer-events-none after:absolute after:bg-primary after:opacity-0 after:transition-opacity after:duration-120 group-data-[orientation=horizontal]/tabs:after:inset-x-0 group-data-[orientation=horizontal]/tabs:after:bottom-0 group-data-[orientation=horizontal]/tabs:after:h-[3px] group-data-[orientation=vertical]/tabs:after:inset-y-0 group-data-[orientation=vertical]/tabs:after:right-0 group-data-[orientation=vertical]/tabs:after:w-[3px] group-data-[variant=line]/tabs-list:data-[state=active]:after:opacity-100",
        className,
      )}
      {...props}
    />
  );
}

function TabsContent({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn(
        "flex-1 py-4 outline-none focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring group-data-[orientation=vertical]/tabs:py-0 group-data-[orientation=vertical]/tabs:pl-4",
        className,
      )}
      {...props}
    />
  );
}

function TabsBadge({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="tabs-badge"
      className={cn(
        "inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-surface-subtle px-1 font-sans text-[0.6875rem] font-semibold text-muted-foreground group-data-[state=active]/tabs-trigger:bg-primary group-data-[state=active]/tabs-trigger:text-primary-foreground",
        className,
      )}
      {...props}
    />
  );
}

const scrollButtonClass =
  "absolute z-10 hidden cursor-pointer items-center justify-center border-none text-foreground-secondary transition-colors duration-120 ease-out outline-none hover:text-foreground focus-visible:outline-solid focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring data-[visible=true]:flex";

function TabsScroller({ className, children, ...props }: React.ComponentProps<"div">) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [vertical, setVertical] = React.useState(false);
  const [visible, setVisible] = React.useState({ prev: false, next: false });

  const getList = () =>
    ref.current?.querySelector<HTMLElement>(':scope > [data-slot="tabs-list"]') ?? null;

  React.useEffect(() => {
    const list = getList();
    if (!list) return;
    const isVertical = list.getAttribute("aria-orientation") === "vertical";
    setVertical(isVertical);

    const update = () => {
      const max = isVertical
        ? list.scrollHeight - list.clientHeight
        : list.scrollWidth - list.clientWidth;
      const pos = isVertical ? list.scrollTop : list.scrollLeft;
      setVisible({ prev: pos > 1, next: pos < max - 1 });
    };

    // Radix moves focus on keyboard navigation, but a click on a half-hidden tab
    // does not scroll it into view, so follow the active trigger ourselves.
    const reveal = () => {
      const tab = list.querySelector<HTMLElement>(
        '[data-slot="tabs-trigger"][data-state="active"]',
      );
      if (!tab) return;
      const t = tab.getBoundingClientRect();
      const l = list.getBoundingClientRect();
      if (isVertical) {
        if (t.top < l.top) list.scrollBy({ top: t.top - l.top, behavior: "smooth" });
        else if (t.bottom > l.bottom)
          list.scrollBy({ top: t.bottom - l.bottom, behavior: "smooth" });
      } else if (t.left < l.left) {
        list.scrollBy({ left: t.left - l.left, behavior: "smooth" });
      } else if (t.right > l.right) {
        list.scrollBy({ left: t.right - l.right, behavior: "smooth" });
      }
      update();
    };

    update();
    list.addEventListener("scroll", update, { passive: true });
    const resize = new ResizeObserver(update);
    resize.observe(list);
    const mutation = new MutationObserver(reveal);
    mutation.observe(list, { subtree: true, attributeFilter: ["data-state"] });
    return () => {
      list.removeEventListener("scroll", update);
      resize.disconnect();
      mutation.disconnect();
    };
  }, []);

  const scroll = (dir: 1 | -1) => {
    const list = getList();
    const tabs = list?.querySelectorAll<HTMLElement>('[data-slot="tabs-trigger"]');
    if (!list || !tabs?.length) return;
    const probe = tabs[Math.floor(tabs.length / 2)];
    if (vertical) list.scrollBy({ top: (probe.offsetHeight || 40) * dir, behavior: "smooth" });
    else list.scrollBy({ left: (probe.offsetWidth || 120) * dir, behavior: "smooth" });
  };

  return (
    <div
      ref={ref}
      data-slot="tabs-scroller"
      className={cn(
        "relative flex w-full min-w-0 overflow-hidden group-data-[orientation=vertical]/tabs:w-40 group-data-[orientation=vertical]/tabs:max-w-40 group-data-[orientation=vertical]/tabs:shrink-0 group-data-[orientation=vertical]/tabs:flex-col group-data-[orientation=vertical]/tabs:self-stretch",
        "[&>[data-slot=tabs-list]]:overflow-x-auto [&>[data-slot=tabs-list]]:overflow-y-hidden [&>[data-slot=tabs-list]]:[scrollbar-width:none] [&>[data-slot=tabs-list]]:[&::-webkit-scrollbar]:hidden group-data-[orientation=vertical]/tabs:[&>[data-slot=tabs-list]]:min-h-0 group-data-[orientation=vertical]/tabs:[&>[data-slot=tabs-list]]:flex-[1_1_0] group-data-[orientation=vertical]/tabs:[&>[data-slot=tabs-list]]:overflow-x-hidden group-data-[orientation=vertical]/tabs:[&>[data-slot=tabs-list]]:overflow-y-auto",
        className,
      )}
      {...props}
    >
      <button
        type="button"
        data-slot="tabs-scroll-prev"
        data-visible={visible.prev}
        aria-label={vertical ? "Scroll tabs up" : "Scroll tabs left"}
        tabIndex={-1}
        onClick={() => scroll(-1)}
        className={cn(
          scrollButtonClass,
          "inset-y-0 left-0 w-8 bg-[linear-gradient(to_right,var(--background),transparent)] group-data-[orientation=vertical]/tabs:inset-x-0 group-data-[orientation=vertical]/tabs:top-0 group-data-[orientation=vertical]/tabs:bottom-auto group-data-[orientation=vertical]/tabs:h-6 group-data-[orientation=vertical]/tabs:w-auto group-data-[orientation=vertical]/tabs:bg-[linear-gradient(to_bottom,var(--background),transparent)]",
        )}
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
          <path
            d={vertical ? "M3 9l4-4 4 4" : "M9 3L5 7l4 4"}
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      {children}
      <button
        type="button"
        data-slot="tabs-scroll-next"
        data-visible={visible.next}
        aria-label={vertical ? "Scroll tabs down" : "Scroll tabs right"}
        tabIndex={-1}
        onClick={() => scroll(1)}
        className={cn(
          scrollButtonClass,
          "inset-y-0 right-0 w-8 bg-[linear-gradient(to_left,var(--background),transparent)] group-data-[orientation=vertical]/tabs:inset-x-0 group-data-[orientation=vertical]/tabs:top-auto group-data-[orientation=vertical]/tabs:bottom-0 group-data-[orientation=vertical]/tabs:h-6 group-data-[orientation=vertical]/tabs:w-auto group-data-[orientation=vertical]/tabs:bg-[linear-gradient(to_top,var(--background),transparent)]",
        )}
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
          <path
            d={vertical ? "M3 5l4 4 4-4" : "M5 3l4 4-4 4"}
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </div>
  );
}

export { Tabs, TabsList, TabsTrigger, TabsContent, TabsBadge, TabsScroller, tabsListVariants };
