import { cn } from "@/lib/utils/cn";

export interface ProgressProps {
  value: number;
  max?: number;
  label?: string;
  className?: string;
}

export function Progress({ value, max = 100, label, className }: ProgressProps) {
  const percent = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {label && <p className="text-label text-text-secondary">{label}</p>}
      <div
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        className="h-1.5 w-full overflow-hidden rounded-full bg-surface-secondary"
      >
        <div
          className="h-full rounded-full bg-primary transition-[width] duration-slow ease-standard"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
