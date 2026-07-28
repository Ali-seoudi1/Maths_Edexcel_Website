import { cn } from "@/lib/utils";

type QuizResultCardProps = {
  title: string;
  score: string;
  tone?: "success" | "warning" | "primary";
};

export function QuizResultCard({ title, score, tone = "success" }: QuizResultCardProps) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border/70 py-4 last:border-b-0 last:pb-0 first:pt-0">
      <h3 className="text-base font-bold text-slate-950">{title}</h3>
      <p
        className={cn(
          "shrink-0 text-base font-bold",
          tone === "success" && "text-success",
          tone === "warning" && "text-amber-600",
          tone === "primary" && "text-primary",
        )}
      >
        {score}
      </p>
    </div>
  );
}
