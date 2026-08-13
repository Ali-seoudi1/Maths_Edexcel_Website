"use client";

import { Loader2, Pencil } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type SubmissionGradePanelProps = {
  editing: boolean;
  feedback: string;
  feedbackPlaceholder?: string;
  max?: number;
  maxScoreValue?: string;
  min?: number;
  saving: boolean;
  scoreLabel: string;
  scorePlaceholder: string;
  scoreSummaryLabel: string;
  scoreValue: string;
  onEdit: () => void;
  onFeedbackChange: (value: string) => void;
  onSave: () => void;
  onScoreChange: (value: string) => void;
};

export function SubmissionGradePanel({
  editing,
  feedback,
  feedbackPlaceholder = "Add feedback for the student",
  max,
  maxScoreValue,
  min = 0,
  saving,
  scoreLabel,
  scorePlaceholder,
  scoreSummaryLabel,
  scoreValue,
  onEdit,
  onFeedbackChange,
  onSave,
  onScoreChange,
}: SubmissionGradePanelProps) {
  if (!editing) {
    return (
      <div className="flex flex-col gap-3 rounded-lg border bg-secondary/30 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-foreground">
            {scoreSummaryLabel}: {scoreValue.trim() ? scoreValue : "Not set"}
            {scoreValue.trim() && maxScoreValue ? ` / ${maxScoreValue}` : ""}
          </p>
          {feedback ? (
            <p className="mt-1 text-sm text-muted-foreground">Feedback: {feedback}</p>
          ) : null}
        </div>
        <Button type="button" variant="outline" onClick={onEdit}>
          <Pencil className="h-4 w-4" aria-hidden="true" />
          Edit grade
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="grid gap-4 md:grid-cols-[140px_1fr] md:items-start">
        <label className="text-sm font-medium text-foreground">{scoreLabel}</label>
        <div className="space-y-2">
          <Input
            type="number"
            min={min}
            max={max}
            value={scoreValue}
            onChange={(event) => onScoreChange(event.target.value)}
            placeholder={scorePlaceholder}
          />
          {maxScoreValue ? (
            <p className="text-xs font-medium text-muted-foreground">Out of {maxScoreValue}</p>
          ) : null}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-[140px_1fr] md:items-start">
        <label className="text-sm font-medium text-foreground">Feedback</label>
        <textarea
          value={feedback}
          onChange={(event) => onFeedbackChange(event.target.value)}
          placeholder={feedbackPlaceholder}
          rows={4}
          className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

      <div className="flex justify-end">
        <Button type="button" onClick={onSave} disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              Saving...
            </>
          ) : (
            "Save grade"
          )}
        </Button>
      </div>
    </>
  );
}
