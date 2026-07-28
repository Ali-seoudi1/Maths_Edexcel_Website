import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type PageHeaderProps = {
  title: string;
  description?: string;
  eyebrow?: string;
  actions?: ReactNode;
  className?: string;
};

export function PageHeader({ title, description, eyebrow, actions, className }: PageHeaderProps) {
  return (
    <header
      className={cn("flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between", className)}
    >
      <div className="max-w-3xl space-y-3">
        {eyebrow ? (
          <p className="text-sm font-medium uppercase tracking-wide text-primary">{eyebrow}</p>
        ) : null}
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-normal text-foreground sm:text-4xl">
            {title}
          </h1>
          {description ? (
            <p className="text-base leading-7 text-muted-foreground">{description}</p>
          ) : null}
        </div>
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-3">{actions}</div> : null}
    </header>
  );
}
