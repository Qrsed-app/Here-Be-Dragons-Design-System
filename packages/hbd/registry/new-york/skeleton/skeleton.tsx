import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn(
        "relative overflow-hidden rounded-sm bg-parchment-200 after:absolute after:inset-0 after:animate-hbd-shimmer after:bg-[linear-gradient(90deg,transparent_0%,var(--parchment-100)_50%,transparent_100%)] after:content-[''] motion-reduce:after:animate-none",
        className,
      )}
      {...props}
    />
  );
}

export { Skeleton };
