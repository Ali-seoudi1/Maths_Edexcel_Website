import type { HTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/utils";

type DashboardCardProps = HTMLAttributes<HTMLDivElement> & {
  padded?: boolean;
};

export function DashboardCard({ className, padded = true, ...props }: DashboardCardProps) {
  return (
    <section
      className={cn(
        "rounded-2xl border border-border/80 bg-card text-card-foreground shadow-card",
        padded && "p-6",
        className,
      )}
      {...props}
    />
  );
}

type SectionCardProps = {
  title: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
};

export function SectionCard({ title, action, children, className }: SectionCardProps) {
  return (
    <DashboardCard className={className}>
      <div className="mb-6 flex items-center justify-between gap-4">
        <h2 className="text-xl font-bold tracking-normal text-foreground">{title}</h2>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      {children}
    </DashboardCard>
  );
}
