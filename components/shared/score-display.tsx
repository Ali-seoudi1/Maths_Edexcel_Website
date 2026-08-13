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
  excellent: "text-emerald-700",
  "very-good": "text-teal-700",
  good: "text-amber-700",
  "needs-improvement": "text-orange-700",
  "needs-attention": "text-destructive",
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
          "text-right text-sm font-semibold",
          toneStyles[meta.tone],
          className,
        )}
      >
        <p>
          {score} / {maxScore}
        </p>
        <p className="text-xs">{meta.percentage}%</p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-2", toneStyles[meta.tone], className)}>
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
      {feedback ? (
        <div className="rounded-lg border bg-white/70 p-3 text-sm leading-6 text-foreground">
          <span className="font-semibold">Feedback: </span>
          {feedback}
        </div>
      ) : null}
    </div>
  );
}
