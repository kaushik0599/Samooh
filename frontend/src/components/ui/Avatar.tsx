import { cn } from "@/lib/utils/cn";

export interface AvatarProps {
  /** Wallet address or name used to derive initials/color deterministically. */
  seed: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeClasses = {
  sm: "h-6 w-6 text-caption",
  md: "h-9 w-9 text-body-sm",
  lg: "h-12 w-12 text-body",
};

function initialsFrom(seed: string): string {
  if (seed.startsWith("0x")) return seed.slice(2, 4).toUpperCase();
  return seed.slice(0, 2).toUpperCase();
}

export function Avatar({ seed, size = "md", className }: AvatarProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full bg-accent-bg font-medium text-primary",
        sizeClasses[size],
        className
      )}
    >
      {initialsFrom(seed)}
    </div>
  );
}
