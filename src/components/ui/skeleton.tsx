import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
  shape?: "circle" | "rectangle";
}

export function Skeleton({ className, shape = "rectangle" }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse bg-zinc-800",
        shape === "circle" ? "rounded-full" : "rounded-md",
        className
      )}
    />
  );
}
