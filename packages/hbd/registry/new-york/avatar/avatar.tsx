"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

// Ported 1:1 from ds/components/hbd-avatar.js (light DOM — no Shadow DOM).
// Two content branches, matching the WC exactly:
//   1. <img>        — when imgSrc is set AND loads successfully
//   2. generic icon — fallback (image absent or onError fired)
// The host carries role="img" + aria-label so the inner <img alt=""> doesn't
// double-announce. The accessible name follows the WC preference order:
//   img-alt (when the attribute is present, even if empty) → name → "Avatar".

const SIZES = ["xs", "sm", "md", "lg", "xl", "2xl"] as const;

export interface AvatarProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Full name — used only for the accessible label. */
  name?: string;
  /** Image URL. When it loads, the <img> branch renders; on error it falls back. */
  imgSrc?: string;
  /** Image alt text. When provided (even ""), it wins the accessible-name race. */
  imgAlt?: string;
  /** xs · sm · md (default) · lg · xl · 2xl */
  size?: (typeof SIZES)[number];
}

const Avatar = React.forwardRef<HTMLSpanElement, AvatarProps>(
  ({ name = "", imgSrc = "", imgAlt, size = "md", className, ...props }, ref) => {
    const [imgFailed, setImgFailed] = React.useState(false);

    // A new imgSrc deserves a fresh attempt — reset the failure flag.
    React.useEffect(() => {
      setImgFailed(false);
    }, [imgSrc]);

    const useImage = Boolean(imgSrc) && !imgFailed;

    // Accessible name: img-alt (when present, even empty) → name → "Avatar".
    const trimmedName = name.trim();
    const accessibleName = (imgAlt != null ? imgAlt : "") || trimmedName || "Avatar";

    return (
      <span
        ref={ref}
        className={cn("hbd-avatar", `hbd-avatar--${size}`, className)}
        role="img"
        aria-label={accessibleName}
        {...props}
      >
        {useImage ? (
          <img
            className="hbd-avatar__img"
            src={imgSrc}
            alt=""
            aria-hidden="true"
            loading="lazy"
            onError={() => setImgFailed(true)}
          />
        ) : (
          <span className="hbd-avatar__icon" aria-hidden="true">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="9" r="3.5" />
              <path d="M5 20a7 7 0 0 1 14 0" />
            </svg>
          </span>
        )}
      </span>
    );
  },
);
Avatar.displayName = "Avatar";

export { Avatar };
