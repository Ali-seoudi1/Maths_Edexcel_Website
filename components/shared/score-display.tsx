import { getScoreMeta } from "@/lib/utils/score";
import { cn } from "@/lib/utils";

type ScoreDisplayProps = {
  score: number;
  maxScore?: number;
  label?: string;
  feedback?: string;
  compact?: boolean;
  className?: string;
};

const toneStyles = {
  excellent: "border-emerald-200 bg-emerald-50 text-emerald-800",
  "very-good": "border-teal-200 bg-teal-50 text-teal-800",
  good: "border-amber-200 bg-amber-50 text-amber-800",
  "needs-improvement": "border-orange-200 bg-orange-50 text-orange-800",
  "needs-attention": "border-red-200 bg-red-50 text-red-800",
};

const barStyles = {
  excellent: "bg-emerald-500",
  "very-good": "bg-teal-500",
  good: "bg-amber-500",
  "needs-improvement": "bg-orange-500",
  "needs-attention": "bg-red-500",
};

export function ScoreDisplay({
  score,
  maxScore = 100,
  label = "Score",
  feedback,
  compact = false,
  className,
}: ScoreDisplayProps) {
  const meta = getScoreMeta(score, maxScore);

  if (compact) {
    return (
      <div
        className={cn(
          "inline-flex items-center gap-2 rounded-lg border px-2.5 py-1 text-xs font-semibold",
          toneStyles[meta.tone],
          className,
        )}
      >
        <span>
          {score} / {maxScore}
        </span>
        <span aria-hidden="true">·</span>
        <span>{meta.percentage}%</span>
      </div>
    );
  }

  return (
    <div className={cn("rounded-xl border p-4", toneStyles[meta.tone], className)}>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase text-current/70">{label}</p>
          <p className="mt-1 text-2xl font-semibold tracking-normal">
            {score} / {maxScore}
          </p>
        </div>
        <div className="text-right">
          <p className="text-lg font-semibold">{meta.percentage}%</p>
          <p className="text-xs font-semibold">Graded</p>
        </div>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/70">
        <div className={cn("h-full rounded-full", barStyles[meta.tone])} style={{ width: `${meta.percentage}%` }} />
      </div>
      {feedback ? (
        <div className="mt-3 rounded-lg bg-white/60 p-3 text-sm leading-6 text-current">
          <span className="font-semibold">Feedback: </span>
          {feedback}
        </div>
      ) : null}
    </div>
  );
}
