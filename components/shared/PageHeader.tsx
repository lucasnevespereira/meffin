import type { ReactNode } from 'react';

interface PageHeaderProps {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
}

export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0 flex-1">
        <h1 className="text-2xl font-bold tracking-tight text-balance md:text-3xl">{title}</h1>
        {description && (
          <p className="mt-1 text-sm text-muted-foreground md:mt-2 md:text-base">{description}</p>
        )}
      </div>
      {actions && <div className="w-full shrink-0 sm:w-auto">{actions}</div>}
    </div>
  );
}
