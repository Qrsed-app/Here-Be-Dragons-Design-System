"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

// Ported 1:1 from ds/components/hbd-codeblock.js + ds/styles/components/codeblock.css.
// Display-only dark code surface with optional filename/language header,
// optional line-number gutter, and a copy-to-clipboard button.
//
// The legacy WC computed line numbers + copy text from its slotted text content.
// In React the code is provided either as the `code` string prop or as string
// `children`; both feed the gutter line count and the clipboard copy.

/** Extract the plain-text code from `code` prop or string children. */
function resolveCodeText(code: string | undefined, children: React.ReactNode): string {
  if (typeof code === "string") return code;
  if (typeof children === "string") return children;
  if (Array.isArray(children)) {
    return children.map((c) => (typeof c === "string" ? c : "")).join("");
  }
  return "";
}

export interface CodeblockProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
  /** Language label shown on the right of the header (also enables the header). */
  language?: string;
  /** Filename label shown on the left of the header (also enables the header). */
  filename?: string;
  /** Render the line-number gutter (mirrors the WC `show-lines` attribute). */
  showLines?: boolean;
  /** Hide the copy-to-clipboard button (mirrors the WC `no-copy` attribute). */
  noCopy?: boolean;
  /**
   * The code to render. Falls back to string `children`. Pre-highlighted markup
   * (with .tok-* spans) may be passed via `children` as React nodes instead.
   */
  code?: string;
  /** Code content. Plain string, or pre-highlighted React nodes (.tok-* spans). */
  children?: React.ReactNode;
}

const Codeblock = React.forwardRef<HTMLDivElement, CodeblockProps>(
  (
    { className, language, filename, showLines = false, noCopy = false, code, children, ...props },
    ref,
  ) => {
    const [copyState, setCopyState] = React.useState<"idle" | "copied" | "failed">("idle");
    const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

    React.useEffect(() => {
      return () => {
        if (timerRef.current) clearTimeout(timerRef.current);
      };
    }, []);

    const hasHeader = !!(filename || language);

    const codeText = resolveCodeText(code, children);

    // Line numbers: count lines in the code text (trailing newline trimmed),
    // matching the WC's `text.replace(/\n$/, '').split('\n').length`.
    const lineCount = showLines ? codeText.replace(/\n$/, "").split("\n").length : 0;

    const handleCopy = React.useCallback(() => {
      const reset = () => setCopyState("idle");
      navigator.clipboard
        .writeText(codeText)
        .then(() => {
          setCopyState("copied");
          if (timerRef.current) clearTimeout(timerRef.current);
          timerRef.current = setTimeout(reset, 2000);
        })
        .catch(() => {
          setCopyState("failed");
          if (timerRef.current) clearTimeout(timerRef.current);
          timerRef.current = setTimeout(reset, 2000);
        });
    }, [codeText]);

    const copyLabel =
      copyState === "copied" ? "Copied" : copyState === "failed" ? "Failed" : "Copy";
    const copyAriaLabel =
      copyState === "copied"
        ? "Copied to clipboard"
        : copyState === "failed"
          ? "Copy failed"
          : "Copy code";

    // role=region only when the block is a labelled landmark (has a header).
    const regionProps = hasHeader ? { role: "region", "aria-label": "Code block" } : {};

    return (
      <div
        ref={ref}
        className={cn(
          "hbd-codeblock",
          hasHeader && "hbd-codeblock--with-header",
          showLines && "hbd-codeblock--with-lines",
          className,
        )}
        {...regionProps}
        {...props}
      >
        {hasHeader && (
          <div className="hbd-codeblock__header">
            <span className="hbd-codeblock__filename">{filename || ""}</span>
            <span className="hbd-codeblock__language">{language || ""}</span>
          </div>
        )}
        <div className="hbd-codeblock__body">
          {showLines && (
            <div className="hbd-codeblock__line-numbers" aria-hidden="true">
              {Array.from({ length: lineCount }, (_, i) => (
                <span key={i}>{i + 1}</span>
              ))}
            </div>
          )}
          <pre className="hbd-codeblock__pre">
            <code className="hbd-codeblock__code">{children ?? code}</code>
          </pre>
          {!noCopy && (
            <button
              type="button"
              className={cn("hbd-codeblock__copy", copyState === "copied" && "is-copied")}
              aria-label={copyAriaLabel}
              onClick={handleCopy}
            >
              {copyLabel}
            </button>
          )}
        </div>
      </div>
    );
  },
);
Codeblock.displayName = "Codeblock";

export { Codeblock };
