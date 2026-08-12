export type ScoreTone = "excellent" | "very-good" | "good" | "needs-improvement" | "needs-attention";

export type ScoreMeta = {
  percentage: number;
  tone: ScoreTone;
};

export function getScoreMeta(score: number, maxScore = 100): ScoreMeta {
  const safeMaxScore = maxScore > 0 ? maxScore : 100;
  const percentage = Math.max(0, Math.min(100, Math.round((score / safeMaxScore) * 100)));

  if (percentage >= 90) {
    return { percentage, tone: "excellent" };
  }

  if (percentage >= 75) {
    return { percentage, tone: "very-good" };
  }

  if (percentage >= 60) {
    return { percentage, tone: "good" };
  }

  if (percentage >= 40) {
    return { percentage, tone: "needs-improvement" };
  }

  return { percentage, tone: "needs-attention" };
}
