import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

export interface OptionCardProps {
  label: string;
  description?: string;
  icon?: ReactNode;
  selected: boolean;
  onSelect: () => void;
}

/** A single-select card, e.g. the JOIN / START / EITHER onboarding question. */
export function OptionCard({ label, description, icon, selected, onSelect }: OptionCardProps) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={cn(
        "flex w-full items-start gap-3 rounded-xl border border-border bg-surface p-4 text-left",
        "transition-[transform,background-color,border-color] duration-fast ease-standard",
        "hover:-translate-y-0.5 hover:bg-surface-secondary",
        selected && "border-primary bg-accent-bg hover:bg-accent-bg"
      )}
    >
      {icon && <span className="mt-0.5 text-primary">{icon}</span>}
      <div>
        <p className="text-body font-medium text-text-primary">{label}</p>
        {description && <p className="text-body-sm text-text-secondary">{description}</p>}
      </div>
    </button>
  );
}
