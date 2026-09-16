import type { ReactNode } from "react";

export interface PageHeaderProps {
  title: string;
  description?: string;
  /** Small blue uppercase label above the title, e.g. "SAMOOH / Overview". */
  eyebrow?: string;
  actions?: ReactNode;
}

export function PageHeader({ title, description, eyebrow, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 pb-5 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow && (
          <p className="mb-1.5 text-label uppercase text-primary">{eyebrow}</p>
        )}
        <h1 className="text-h1 text-text-primary">{title}</h1>
        {description && <p className="mt-1.5 text-body text-text-secondary">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}

export function SectionHeader({ title, description }: { title: string; description?: string }) {
  return (
    <div className="mb-3">
      <h2 className="text-h4 text-text-primary">{title}</h2>
      {description && <p className="mt-0.5 text-body-sm text-text-secondary">{description}</p>}
    </div>
  );
}
