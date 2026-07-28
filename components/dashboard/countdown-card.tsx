import { CalendarClock } from "lucide-react";

import { Button } from "@/components/ui/button";

import { DashboardCard } from "./dashboard-card";

type CountdownUnit = {
  value: string;
  label: string;
};

type CountdownCardProps = {
  eyebrow: string;
  title: string;
  units: CountdownUnit[];
  actionLabel?: string;
};

export function CountdownCard({ eyebrow, title, units, actionLabel }: CountdownCardProps) {
  return (
    <DashboardCard>
      <div className="flex items-start gap-4">
        <div className="hidden h-12 w-12 items-center justify-center rounded-2xl bg-warning-soft text-amber-700 sm:flex">
          <CalendarClock className="h-5 w-5" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
            {eyebrow}
          </p>
          <h2 className="mt-3 text-xl font-bold text-slate-950">{title}</h2>
          <div className="mt-4 flex flex-wrap gap-3">
            {units.map((unit) => (
              <div
                key={unit.label}
                className="flex min-w-16 flex-col items-center rounded-xl bg-warning-soft px-4 py-3 text-amber-800"
              >
                <span className="text-xl font-bold">{unit.value}</span>
                <span className="text-[11px] font-bold uppercase">{unit.label}</span>
              </div>
            ))}
          </div>
          {actionLabel ? (
            <Button type="button" variant="outline" className="mt-5 rounded-xl bg-white">
              {actionLabel}
            </Button>
          ) : null}
        </div>
      </div>
    </DashboardCard>
  );
}
