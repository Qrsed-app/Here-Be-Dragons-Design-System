import * as React from "react";
import { cn } from "@/lib/utils";
import { Avatar, type AvatarProps } from "@/registry/new-york/avatar/avatar";

// Ported 1:1 from ds/components/hbd-avatar-group.js + the .hbd-avatar-group*
// rules extracted from ds/styles/components/avatar.css (shipped in
// avatar-group.css). Composes <Avatar> children into an overlapping stack,
// renders the first `max`, and appends a "+N" overflow bubble for the rest.
//
// Behaviour parity with the WC:
//   - max (default 5): visible avatars before the overflow bubble. When the
//     child count is <= max, the bubble is omitted.
//   - size: propagated to EVERY child avatar (overrides their own size),
//     and drives the overflow-bubble size.
//   - host: role="group" + a default aria-label reporting the TOTAL count
//     ("N participants"), which authors may override via aria-label.
//   - overflow bubble: role="img", aria-label "N more", reuses the
//     .hbd-avatar + .hbd-avatar--{size} base classes for visual parity.

const SIZES = ["xs", "sm", "md", "lg", "xl", "2xl"] as const;
type AvatarSize = (typeof SIZES)[number];

export interface AvatarGroupProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
  /** Number of avatars rendered before the overflow bubble (default 5). */
  max?: number;
  /** Propagated to every child avatar, overriding their own size. */
  size?: AvatarSize;
  /** <Avatar> children (extra non-Avatar nodes are ignored, matching the WC). */
  children?: React.ReactNode;
}

const AvatarGroup = React.forwardRef<HTMLDivElement, AvatarGroupProps>(
  ({ max = 5, size, className, children, "aria-label": ariaLabel, ...props }, ref) => {
    // Mirror the WC's _max getter: only finite positive values win, else 5.
    const resolvedMax = Number.isFinite(max) && max > 0 ? max : 5;
    // Mirror the WC's _size getter: only the known sizes are honoured.
    const resolvedSize = size && SIZES.includes(size) ? size : undefined;

    // Collect only the Avatar children (the WC snapshots `:scope > hbd-avatar`).
    const avatars = React.Children.toArray(children).filter(
      (child): child is React.ReactElement<AvatarProps> =>
        React.isValidElement(child) && child.type === Avatar,
    );

    const total = avatars.length;
    const overflowCount = Math.max(0, total - resolvedMax);
    const visible = avatars.slice(0, resolvedMax);

    // Propagate the group size onto every visible avatar when set.
    const rendered = visible.map((avatar) =>
      resolvedSize ? React.cloneElement(avatar, { size: resolvedSize }) : avatar,
    );

    // Bubble size: group size if set, else the first visible avatar's size,
    // else "md" (matches the WC's sizeClass logic).
    const bubbleSize: AvatarSize =
      resolvedSize ?? (visible[0]?.props.size as AvatarSize | undefined) ?? "md";

    // Default aria-label reports the TOTAL count (not just visible) so SR
    // users get accurate info; authors can override via aria-label.
    const count = total;
    const defaultLabel = `${count} ${count === 1 ? "participant" : "participants"}`;

    return (
      <div
        ref={ref}
        className={cn("hbd-avatar-group", className)}
        role="group"
        aria-label={ariaLabel ?? defaultLabel}
        {...props}
      >
        {rendered}
        {overflowCount > 0 ? (
          <span
            className={cn("hbd-avatar", `hbd-avatar--${bubbleSize}`, "hbd-avatar-group__overflow")}
            role="img"
            aria-label={`${overflowCount} more`}
          >
            +{overflowCount}
          </span>
        ) : null}
      </div>
    );
  },
);
AvatarGroup.displayName = "AvatarGroup";

export { AvatarGroup };
