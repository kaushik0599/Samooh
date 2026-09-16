import type { ReactNode } from "react";

export interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border px-6 py-12 text-center">
      {icon && <span className="text-text-secondary">{icon}</span>}
      <div>
        <p className="text-body font-medium text-text-primary">{title}</p>
        {description && <p className="mt-1 text-body-sm text-text-secondary">{description}</p>}
      </div>
      {action}
    </div>
  );
}
