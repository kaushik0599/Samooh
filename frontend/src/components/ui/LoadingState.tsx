import { cn } from "@/lib/utils/cn";

export function LoadingState({ label = "Loading" }: { label?: string }) {
  return (
    <div role="status" className="flex items-center justify-center gap-2 py-12 text-text-secondary">
      <span
        aria-hidden="true"
        className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
      />
      <span className="text-body-sm">{label}</span>
    </div>
  );
}

/** A content-shaped placeholder for skeleton loading, sized via className. */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn("animate-pulse rounded-md bg-surface-secondary", className)}
    />
  );
}
