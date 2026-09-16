import * as React from "react";
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils";

const nativeSelectVariants = cva(
  [
    "w-full min-w-0 cursor-pointer appearance-none rounded-md border border-border-strong bg-background font-sans leading-[1.7] text-foreground transition-[border-color,box-shadow] duration-120 ease-out outline-none selection:bg-primary selection:text-primary-foreground",
    // outline-solid: outline-none zeroes --tw-outline-style, which outline-2 alone would inherit.
    "focus-visible:border-input-focus focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring focus-visible:outline-solid",
    "aria-invalid:border-error-border aria-invalid:text-foreground-emphasis aria-invalid:focus-visible:border-error-border aria-invalid:focus-visible:outline-error-border",
    "data-[valid=true]:border-success-border data-[valid=true]:text-forest-700 data-[valid=true]:focus-visible:border-success-border data-[valid=true]:focus-visible:outline-success-border",
    "disabled:cursor-not-allowed disabled:border-border-subtle disabled:bg-surface-subtle disabled:text-foreground-disabled",
    // A selected empty-value option reads as a placeholder. Arbitrary variants sort last,
    // so it stays muted in the error and disabled states, as the old trigger did.
    "[&:has(option[value='']:checked)]:text-muted-foreground",
  ],
  {
    variants: {
      size: {
        sm: "min-h-8 py-1 ps-2 pe-7 text-[0.8125rem]",
        default: "min-h-11 py-2 ps-3 pe-9 text-[1.0625rem]",
        lg: "min-h-13 py-3 ps-4 pe-10 text-[1.0625rem]",
      },
    },
    defaultVariants: {
      size: "default",
    },
  },
);

function NativeSelect({
  className,
  size = "default",
  ...props
}: Omit<React.ComponentProps<"select">, "size"> & { size?: "sm" | "default" | "lg" }) {
  return (
    <div className="group/native-select relative w-fit" data-slot="native-select-wrapper">
      <select
        data-slot="native-select"
        data-size={size}
        className={cn(nativeSelectVariants({ size }), className)}
        {...props}
      />
      {/* The old select's own chevron, aligned to its padding edge (border + padding-x). */}
      <svg
        viewBox="0 0 14 14"
        fill="none"
        aria-hidden="true"
        data-slot="native-select-icon"
        className="pointer-events-none absolute top-1/2 right-[13px] size-3.5 -translate-y-1/2 text-muted-foreground select-none group-has-[select[data-size=lg]]/native-select:right-[17px] group-has-[select[data-size=sm]]/native-select:right-[9px]"
      >
        <path
          d="M3 5l4 4 4-4"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

function NativeSelectOption({ className, ...props }: React.ComponentProps<"option">) {
  return (
    <option
      data-slot="native-select-option"
      className={cn("bg-[Canvas] text-[CanvasText]", className)}
      {...props}
    />
  );
}

function NativeSelectOptGroup({ className, ...props }: React.ComponentProps<"optgroup">) {
  return (
    <optgroup
      data-slot="native-select-optgroup"
      className={cn("bg-[Canvas] text-[CanvasText]", className)}
      {...props}
    />
  );
}

export { NativeSelect, NativeSelectOptGroup, NativeSelectOption };
