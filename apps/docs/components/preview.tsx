import type { ReactNode } from "react";

// not-prose: the docs' typography styles must not leak into the rendered components.
export function Preview({ children }: { children: ReactNode }) {
  return (
    <div
      data-preview
      className="not-prose my-4 flex flex-wrap items-center gap-4 rounded-lg border border-border bg-background p-6"
    >
      {children}
    </div>
  );
}
