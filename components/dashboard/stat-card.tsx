import type { LucideIcon } from "lucide-react";

import { DashboardCard } from "./dashboard-card";

type StatCardProps = {
  title: string;
  value: string;
  description?: string;
  icon: LucideIcon;
};

export function StatCard({ title, value, description, icon: Icon }: StatCardProps) {
  return (
    <DashboardCard className="flex items-center gap-4">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-muted-foreground">{title}</p>
        <p className="mt-1 text-2xl font-bold text-slate-950">{value}</p>
        {description ? <p className="mt-1 text-xs text-muted-foreground">{description}</p> : null}
      </div>
    </DashboardCard>
  );
}
