import { cn } from "@/lib/utils";

type StatisticCardProps = {
  value: string;
  label: string;
  detail: string;
  className?: string;
};

export function StatisticCard({ value, label, detail, className }: StatisticCardProps) {
  return (
    <div className={cn("rounded-lg border border-border/70 bg-card p-6 shadow-soft", className)}>
      <p className="text-3xl font-semibold tracking-normal text-foreground">{value}</p>
      <p className="mt-2 text-sm font-medium text-foreground">{label}</p>
      <p className="mt-1 text-sm leading-6 text-muted-foreground">{detail}</p>
    </div>
  );
}
