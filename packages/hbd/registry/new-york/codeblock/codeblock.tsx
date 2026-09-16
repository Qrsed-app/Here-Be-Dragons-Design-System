"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import { Button } from "@/registry/new-york/button/button";

function Codeblock({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="codeblock"
      className={cn(
        "overflow-hidden rounded-md border border-border-subtle bg-surface-code",
        className,
      )}
      {...props}
    />
  );
}

function CodeblockHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="codeblock-header"
      className={cn(
        "flex items-center justify-between gap-4 border-b border-border-subtle bg-ink-950 px-4 py-2",
        className,
      )}
      {...props}
    />
  );
}

// Parchment, not muted-foreground: muted ink fails contrast on the dark surface.
function CodeblockFilename({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="codeblock-filename"
      className={cn("font-mono text-[0.8125rem] text-parchment-300", className)}
      {...props}
    />
  );
}

function CodeblockLanguage({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="codeblock-language"
      // ml-auto keeps the label right-aligned when there is no filename.
      className={cn(
        "ml-auto font-sans text-[0.6875rem] tracking-[0.3em] text-parchment-300 uppercase",
        className,
      )}
      {...props}
    />
  );
}

function CodeblockContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="codeblock-content"
      className={cn("relative flex overflow-x-auto p-4", className)}
      {...props}
    />
  );
}

function CodeblockLineNumbers({
  className,
  count,
  ...props
}: Omit<React.ComponentProps<"div">, "children"> & { count: number }) {
  return (
    <div
      data-slot="codeblock-line-numbers"
      aria-hidden="true"
      className={cn(
        "mr-4 flex min-w-8 shrink-0 flex-col border-r border-border-subtle pr-4 text-right font-mono text-sm leading-[1.65] text-parchment-400 select-none",
        className,
      )}
      {...props}
    >
      {Array.from({ length: count }, (_, i) => (
        <span key={i}>{i + 1}</span>
      ))}
    </div>
  );
}

// Size and leading belong on <pre>: its own line box sets the line height, so
// sizing only <code> let the page's line-height win and the gutter drifted.
function CodeblockCode({ className, ...props }: React.ComponentProps<"code">) {
  return (
    <pre
      data-slot="codeblock-pre"
      className="m-0 overflow-visible bg-transparent p-0 font-mono text-sm leading-[1.65]"
    >
      <code
        data-slot="codeblock-code"
        className={cn(
          "whitespace-pre text-syntax-default [tab-size:2]",
          "[&_.tok-keyword]:text-syntax-keyword [&_.tok-selector]:text-syntax-keyword",
          "[&_.tok-string]:text-syntax-string [&_.tok-value]:text-syntax-string",
          "[&_.tok-comment]:text-syntax-comment [&_.tok-comment]:italic",
          "[&_.tok-number]:text-syntax-number",
          "[&_.tok-function]:text-syntax-function [&_.tok-property]:text-syntax-function",
          "[&_.tok-operator]:text-syntax-operator",
          className,
        )}
        {...props}
      />
    </pre>
  );
}

type CopyState = "idle" | "copied" | "failed";

const copyLabels: Record<CopyState, { text: string; aria: string }> = {
  idle: { text: "Copy", aria: "Copy code" },
  copied: { text: "Copied", aria: "Copied to clipboard" },
  failed: { text: "Failed", aria: "Copy failed" },
};

function CodeblockCopyButton({
  className,
  value,
  onClick,
  ...props
}: Omit<React.ComponentProps<typeof Button>, "children"> & { value: string }) {
  const [state, setState] = React.useState<CopyState>("idle");
  const timer = React.useRef<ReturnType<typeof setTimeout>>(undefined);

  React.useEffect(() => () => clearTimeout(timer.current), []);

  const settle = (next: CopyState) => {
    setState(next);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setState("idle"), 2000);
  };

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      data-slot="codeblock-copy-button"
      data-state={state}
      aria-label={copyLabels[state].aria}
      // min-h/min-w-12: 48px touch target (WCAG 2.5.8).
      className={cn(
        "absolute top-2 right-2 min-h-12 min-w-12 border-0 px-2 py-1 font-sans text-[0.6875rem] font-normal tracking-[0.3em] text-parchment-300 hover:bg-transparent hover:text-parchment-50 data-[state=copied]:text-parchment-50",
        className,
      )}
      onClick={(event) => {
        onClick?.(event);
        if (event.defaultPrevented) return;
        navigator.clipboard.writeText(value).then(
          () => settle("copied"),
          () => settle("failed"),
        );
      }}
      {...props}
    >
      {copyLabels[state].text}
    </Button>
  );
}

export {
  Codeblock,
  CodeblockHeader,
  CodeblockFilename,
  CodeblockLanguage,
  CodeblockContent,
  CodeblockLineNumbers,
  CodeblockCode,
  CodeblockCopyButton,
};
