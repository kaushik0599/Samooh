import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

export type BadgeTone = "neutral" | "success" | "warning" | "error" | "info";

export interface BadgeProps {
  children: ReactNode;
  tone?: BadgeTone;
  /** A small leading dot — status is still conveyed by the text, never color alone. */
  showDot?: boolean;
  className?: string;
}

const toneClasses: Record<BadgeTone, string> = {
  neutral: "bg-surface-secondary text-text-secondary",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  error: "bg-error/10 text-error",
  info: "bg-info/10 text-info",
};

const dotClasses: Record<BadgeTone, string> = {
  neutral: "bg-text-secondary",
  success: "bg-success",
  warning: "bg-warning",
  error: "bg-error",
  info: "bg-info",
};

export function Badge({ children, tone = "neutral", showDot, className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-caption font-bold tracking-wide",
        toneClasses[tone],
        className
      )}
    >
      {showDot && (
        <span className={cn("h-1.5 w-1.5 rounded-full", dotClasses[tone])} aria-hidden="true" />
      )}
      {children}
    </span>
  );
}
