import * as React from "react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/registry/new-york/skeleton/skeleton";

// Ported 1:1 from ds/components/hbd-skeleton-group.js + the .hbd-skeleton-group*
// preset rules in ds/styles/components/skeleton.css (extracted into
// skeleton-group.css here; the base .hbd-skeleton rules ship with the
// @hbd/skeleton registry item, which this composes).
//
// A named layout preset that arranges multiple <Skeleton> shapes into
// recognisable patterns (avatar+text row, card, list-item, table-row). The
// group itself is purely decorative — the containing element owns aria-busy.
// We mark the group aria-hidden so AT doesn't announce the placeholder shapes
// individually (matches the WC, which sets aria-hidden="true").
//
// Widths cycle deterministically (no Math.random()) so renders are identical
// every time — same LINE_WIDTHS table as the web component.

const PRESETS = ["avatar-text", "card", "list-item", "table-row"] as const;
type Preset = (typeof PRESETS)[number];

const LINE_WIDTHS = [100, 90, 75, 85, 60, 70];

export interface SkeletonGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Layout preset. avatar-text (default) · card · list-item · table-row */
  preset?: Preset;
  /** Number of text lines for text-heavy presets (card). Default 3. */
  lines?: number;
  /** Number of cells in the table-row preset. Default 4. */
  columns?: number;
  /** Disable the shimmer; cascades to every child skeleton. */
  noShimmer?: boolean;
}

function renderAvatarText(noShimmer: boolean) {
  return (
    <>
      <Skeleton variant="circle" noShimmer={noShimmer} />
      <div className="hbd-skeleton-group__body">
        <Skeleton variant="text-lg" width="70%" noShimmer={noShimmer} />
        <Skeleton variant="text-sm" width="50%" noShimmer={noShimmer} />
      </div>
    </>
  );
}

function renderCard(lines: number, noShimmer: boolean) {
  const textLines = Math.max(1, lines - 1);
  return (
    <>
      <Skeleton variant="rect" height="160px" noShimmer={noShimmer} />
      <div className="hbd-skeleton-group__card-body">
        <Skeleton variant="text-lg" width="80%" noShimmer={noShimmer} />
        {Array.from({ length: textLines }, (_, i) => (
          <Skeleton
            key={i}
            variant="text"
            width={`${LINE_WIDTHS[i % LINE_WIDTHS.length]}%`}
            noShimmer={noShimmer}
          />
        ))}
        <Skeleton variant="text-sm" width="40%" noShimmer={noShimmer} />
      </div>
    </>
  );
}

function renderListItem(noShimmer: boolean) {
  return (
    <>
      <Skeleton variant="circle" noShimmer={noShimmer} />
      <div className="hbd-skeleton-group__body hbd-skeleton-group__body--tight">
        <Skeleton variant="text" width="60%" noShimmer={noShimmer} />
        <Skeleton variant="text-sm" width="40%" noShimmer={noShimmer} />
      </div>
      <Skeleton variant="text-sm" width="48px" noShimmer={noShimmer} />
    </>
  );
}

function renderTableRow(columns: number, noShimmer: boolean) {
  return (
    <>
      {Array.from({ length: columns }, (_, i) => (
        <Skeleton key={i} variant="rect" noShimmer={noShimmer} />
      ))}
    </>
  );
}

const SkeletonGroup = React.forwardRef<HTMLDivElement, SkeletonGroupProps>(
  (
    { preset = "avatar-text", lines = 3, columns = 4, noShimmer = false, className, ...props },
    ref,
  ) => {
    // Match the WC normalisation: lowercase, fall back to "avatar-text".
    const raw = String(preset).toLowerCase() as Preset;
    const safePreset = PRESETS.includes(raw) ? raw : "avatar-text";

    const safeLines = Number.isFinite(lines) && lines > 0 ? lines : 3;
    const safeColumns = Number.isFinite(columns) && columns > 0 ? columns : 4;

    let content: React.ReactNode = null;
    if (safePreset === "avatar-text") content = renderAvatarText(noShimmer);
    else if (safePreset === "card") content = renderCard(safeLines, noShimmer);
    else if (safePreset === "list-item") content = renderListItem(noShimmer);
    else if (safePreset === "table-row") content = renderTableRow(safeColumns, noShimmer);

    return (
      <div
        ref={ref}
        aria-hidden="true"
        className={cn("hbd-skeleton-group", `hbd-skeleton-group--${safePreset}`, className)}
        {...props}
      >
        {content}
      </div>
    );
  },
);
SkeletonGroup.displayName = "SkeletonGroup";

export { SkeletonGroup };
