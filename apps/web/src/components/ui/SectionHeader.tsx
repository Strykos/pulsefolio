import type { ReactNode } from "react";

interface SectionHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function SectionHeader({ eyebrow, title, description, action }: SectionHeaderProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow && (
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-text-muted">
            {eyebrow}
          </p>
        )}
        <h2 className="text-xl font-semibold tracking-[-0.02em] text-text-primary">{title}</h2>
        {description && <p className="mt-1 max-w-2xl text-sm leading-6 text-text-muted">{description}</p>}
      </div>
      {action}
    </div>
  );
}
