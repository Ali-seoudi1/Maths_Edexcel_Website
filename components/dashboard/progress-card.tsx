import { cn } from "@/lib/utils";

import { DashboardCard } from "./dashboard-card";

type ProgressCardProps = {
  title: string;
  value: number;
  label?: string;
  tone?: "primary" | "success" | "warning";
};

export function ProgressCard({ title, value, label, tone = "primary" }: ProgressCardProps) {
  return (
    <DashboardCard>
      <div className="flex items-center justify-between gap-4">
        <h3 className="font-bold text-slate-950">{title}</h3>
        <span className="text-sm font-bold text-muted-foreground">{value}%</span>
      </div>
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
        <div
          className={cn(
            "h-full rounded-full",
            tone === "primary" && "bg-primary",
            tone === "success" && "bg-success",
            tone === "warning" && "bg-warning",
          )}
          style={{ width: `${value}%` }}
        />
      </div>
      {label ? <p className="mt-3 text-sm text-muted-foreground">{label}</p> : null}
    </DashboardCard>
  );
}
