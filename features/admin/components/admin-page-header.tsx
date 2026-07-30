import Link from "next/link";
import type { ReactNode } from "react";

type Breadcrumb = {
  label: string;
  href?: string;
};

type AdminPageHeaderProps = {
  title: string;
  description?: string;
  breadcrumbs: Breadcrumb[];
  actions?: ReactNode;
};

export function AdminPageHeader({
  title,
  description,
  breadcrumbs,
  actions,
}: AdminPageHeaderProps) {
  return (
    <header className="mb-8 space-y-5">
      <nav
        className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground"
        aria-label="Breadcrumb"
      >
        {breadcrumbs.map((item, index) => (
          <span key={`${item.label}-${index}`} className="flex items-center gap-2">
            {item.href ? (
              <Link href={item.href} className="font-medium hover:text-foreground">
                {item.label}
              </Link>
            ) : (
              <span className="font-medium text-foreground">{item.label}</span>
            )}
            {index < breadcrumbs.length - 1 ? <span>/</span> : null}
          </span>
        ))}
      </nav>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-3xl">
          <h1 className="text-3xl font-semibold tracking-normal text-foreground">{title}</h1>
          {description ? (
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
          ) : null}
        </div>
        {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
      </div>
    </header>
  );
}
