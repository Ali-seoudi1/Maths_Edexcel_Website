import { ScoreDisplay } from "@/components/shared/score-display";

type QuizResultCardProps = {
  title: string;
  score: string;
  tone?: "success" | "warning" | "primary";
};

function parseScore(value: string) {
  const [rawScore, rawMaxScore] = value.split("/");
  const parsedScore = Number(rawScore);
  const parsedMaxScore = Number(rawMaxScore);

  if (Number.isFinite(parsedScore) && Number.isFinite(parsedMaxScore) && parsedMaxScore > 0) {
    return { score: parsedScore, maxScore: parsedMaxScore };
  }

  return null;
}

export function QuizResultCard({ title, score }: QuizResultCardProps) {
  const parsedScore = parseScore(score);

  return (
    <div className="flex items-center justify-between gap-4 border-b border-border/70 py-4 last:border-b-0 last:pb-0 first:pt-0">
      <h3 className="text-base font-bold text-slate-950">{title}</h3>
      {parsedScore ? (
        <ScoreDisplay score={parsedScore.score} maxScore={parsedScore.maxScore} compact />
      ) : (
        <p className="shrink-0 text-base font-bold text-foreground">{score}</p>
      )}
    </div>
  );
}
