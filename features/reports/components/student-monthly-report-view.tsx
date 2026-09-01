"use client";

import { BarChart3, CalendarDays, ClipboardList, FileQuestion } from "lucide-react";
import { useEffect, useState } from "react";

import { EmptyState } from "@/components/shared/empty-state";
import { ScoreDisplay } from "@/components/shared/score-display";
import { SubmissionGradePanel } from "@/components/shared/submission-grade-panel";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import {
  openProtectedAdminAssignmentSubmissionPdf,
  updateAssignmentSubmissionGrade,
} from "@/features/assignments/services/assignment-service";
import {
  openProtectedExamSubmissionPdf,
  updateExamSubmissionGrade,
} from "@/features/exams/services/exam-service";
import {
  openProtectedQuizSubmissionPdf,
  updateQuizSubmissionGrade,
} from "@/features/quizzes/services/quiz-service";

import { getAdminStudentMonthlyReport } from "../services/report-service";
import type { MonthlyReport, MonthlyReportItem } from "../types";

function currentMonth() {
  return new Date().toISOString().slice(0, 7);
}

function formatDate(value: string | null) {
  if (!value) return "Not set";

  return new Intl.DateTimeFormat("en", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function statusLabel(status: MonthlyReport["items"][number]["status"]) {
  if (status === "on-time") return "On time";
  if (status === "late") return "Late";
  if (status === "opened") return "Opened";
  if (status === "graded") return "Graded";
  if (status === "no-submission") return "No submission";
  return "Submitted";
}

type StudentMonthlyReportViewProps = {
  studentId: string;
  month?: string;
  onMonthChange?: (month: string) => void;
};

type GradeDraft = {
  score: string;
  feedback: string;
};

export function StudentMonthlyReportView({
  studentId,
  month: controlledMonth,
  onMonthChange,
}: StudentMonthlyReportViewProps) {
  const { toast } = useToast();
  const [localMonth, setLocalMonth] = useState(currentMonth());
  const [report, setReport] = useState<MonthlyReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedItemIds, setExpandedItemIds] = useState<Set<string>>(new Set());
  const [editingItemIds, setEditingItemIds] = useState<Set<string>>(new Set());
  const [savingItemId, setSavingItemId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, GradeDraft>>({});
  const month = controlledMonth ?? localMonth;

  function handleMonthChange(value: string) {
    if (onMonthChange) {
      onMonthChange(value);
    } else {
      setLocalMonth(value);
    }
  }

  useEffect(() => {
    setLoading(true);

    void getAdminStudentMonthlyReport(studentId, month)
      .then((result) => {
        setReport(result.report);
        setDrafts(
          Object.fromEntries(
            result.report.items.map((item) => [
              item.id,
              {
                score: item.score === null ? "" : String(item.score),
                feedback: item.feedback ?? "",
              },
            ]),
          ),
        );
        setExpandedItemIds(new Set());
        setEditingItemIds(new Set());
      })
      .catch((error) => {
        toast({
          title: "Could not load report",
          description: error instanceof Error ? error.message : "Try again in a moment.",
          variant: "destructive",
        });
      })
      .finally(() => setLoading(false));
  }, [month, studentId, toast]);

  function updateDraft(itemId: string, values: Partial<GradeDraft>) {
    setDrafts((current) => ({
      ...current,
      [itemId]: {
        ...(current[itemId] ?? { score: "", feedback: "" }),
        ...values,
      },
    }));
  }

  function toggleItemReview(item: MonthlyReportItem) {
    setExpandedItemIds((current) => {
      const next = new Set(current);

      if (next.has(item.id)) {
        next.delete(item.id);
      } else {
        next.add(item.id);
      }

      return next;
    });

    if (typeof item.score !== "number") {
      setEditingItemIds((current) => new Set(current).add(item.id));
    }
  }

  async function handleOpenReportFile(item: MonthlyReportItem, fileId: string) {
    if (!item.resourceId || !item.submissionId) return;

    try {
      if (item.type === "assignment") {
        await openProtectedAdminAssignmentSubmissionPdf(item.resourceId, item.submissionId, fileId);
      } else if (item.type === "exam") {
        await openProtectedExamSubmissionPdf(item.resourceId, item.submissionId);
      } else if (item.type === "quiz") {
        await openProtectedQuizSubmissionPdf(item.resourceId, item.submissionId);
      }
    } catch (error) {
      toast({
        title: "Could not open submission",
        description: error instanceof Error ? error.message : "Try again in a moment.",
        variant: "destructive",
      });
    }
  }

  async function handleSaveGrade(item: MonthlyReportItem) {
    if (
      !item.resourceId ||
      !item.submissionId ||
      (item.type !== "assignment" && item.type !== "quiz" && item.type !== "exam")
    ) {
      return;
    }

    const draft = drafts[item.id];

    if (!draft) return;

    const rawScore = draft.score.trim();
    const parsedScore = rawScore === "" ? null : Number(rawScore);
    const maxScore = item.maxScore ?? 100;

    if (parsedScore !== null && (Number.isNaN(parsedScore) || parsedScore < 0 || parsedScore > maxScore)) {
      toast({
        title: "Invalid grade",
        description: "Enter a grade between 0 and the total score.",
        variant: "destructive",
      });
      return;
    }

    try {
      setSavingItemId(item.id);

      const updatedItem =
        item.type === "assignment"
          ? await updateAssignmentSubmissionGrade(item.resourceId, item.submissionId, {
              grade: parsedScore,
              feedback: draft.feedback,
            }).then(({ submission }) => ({
              score: submission.grade,
              maxScore: submission.maxGrade,
              feedback: submission.feedback,
              status: submission.isLate
                ? ("late" as const)
                : typeof submission.grade === "number"
                  ? ("graded" as const)
                  : ("on-time" as const),
            }))
          : item.type === "exam"
            ? await updateExamSubmissionGrade(item.resourceId, item.submissionId, {
                score: parsedScore,
                feedback: draft.feedback,
              }).then(({ submission }) => ({
                score: submission.score,
                maxScore: submission.maxScore,
                feedback: submission.feedback,
                status: submission.noSubmission
                  ? ("no-submission" as const)
                  : submission.late
                    ? ("late" as const)
                    : submission.graded
                      ? ("graded" as const)
                      : ("on-time" as const),
              }))
            : await updateQuizSubmissionGrade(item.resourceId, item.submissionId, {
                score: parsedScore,
                feedback: draft.feedback,
              }).then(({ submission }) => ({
                score: submission.score,
                maxScore: submission.maxScore,
                feedback: submission.feedback,
                status: submission.noSubmission
                  ? ("no-submission" as const)
                  : submission.late
                    ? ("late" as const)
                    : submission.graded
                      ? ("graded" as const)
                      : ("on-time" as const),
              }));

      setReport((current) =>
        current
          ? {
              ...current,
              items: current.items.map((currentItem) =>
                currentItem.id === item.id
                  ? {
                      ...currentItem,
                      ...updatedItem,
                    }
                  : currentItem,
              ),
            }
          : current,
      );
      setDrafts((current) => ({
        ...current,
        [item.id]: {
          score: updatedItem.score === null ? "" : String(updatedItem.score),
          feedback: updatedItem.feedback ?? "",
        },
      }));
      setEditingItemIds((current) => {
        const next = new Set(current);
        next.delete(item.id);
        return next;
      });
      setExpandedItemIds((current) => {
        const next = new Set(current);
        next.delete(item.id);
        return next;
      });
      toast({
        title: "Grade saved",
        description: "The student's report has been updated.",
        variant: "success",
      });
    } catch (error) {
      toast({
        title: "Grade update failed",
        description: error instanceof Error ? error.message : "Try again in a moment.",
        variant: "destructive",
      });
    } finally {
      setSavingItemId(null);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 rounded-2xl" />
        <Skeleton className="h-40 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <Card>
        <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Monthly report</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Private live performance calculated from the student&apos;s current activity.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            <Input
              type="month"
              value={month}
              onChange={(event) => handleMonthChange(event.target.value)}
              className="w-44"
            />
          </div>
        </CardContent>
      </Card>

      {report ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Card>
              <CardContent className="p-4">
                <p className="text-xs font-semibold uppercase text-muted-foreground">Assignments</p>
                <p className="mt-2 text-2xl font-semibold text-foreground">{report.totals.assignmentsSubmitted}</p>
                <p className="mt-1 text-xs font-medium text-muted-foreground">Submitted</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs font-semibold uppercase text-muted-foreground">Quizzes</p>
                <p className="mt-2 text-2xl font-semibold text-foreground">{report.totals.quizzesSubmitted}</p>
                <p className="mt-1 text-xs font-medium text-muted-foreground">Submitted</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs font-semibold uppercase text-muted-foreground">Late submissions</p>
                <p className="mt-2 text-2xl font-semibold text-foreground">{report.totals.lateSubmissions}</p>
                <p className="mt-1 text-xs font-medium text-muted-foreground">Needs improvement</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs font-semibold uppercase text-muted-foreground">No submissions</p>
                <p className="mt-2 text-2xl font-semibold text-foreground">{report.totals.noSubmissions}</p>
                <p className="mt-1 text-xs font-medium text-muted-foreground">Missing work</p>
              </CardContent>
            </Card>
          </div>

          {report.items.length === 0 ? (
            <EmptyState
              title="No activity for this month"
              description="Assignments and quiz submissions for the selected month will appear here."
              icon={<BarChart3 className="h-8 w-8" aria-hidden="true" />}
            />
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-base font-semibold text-foreground">Recent activity</h2>
                  <p className="mt-1 text-sm text-muted-foreground">Your submitted and missing work for this month.</p>
                </div>
              </div>
              {report.items.map((item) => {
                const canReview =
                  Boolean(studentId) &&
                  Boolean(item.resourceId) &&
                  Boolean(item.submissionId) &&
                  (item.type === "assignment" || item.type === "quiz" || item.type === "exam");
                const isExpanded = expandedItemIds.has(item.id);
                const isEditingGrade = editingItemIds.has(item.id);
                const draft = drafts[item.id] ?? { score: "", feedback: item.feedback ?? "" };
                const isCheatingNoSolution =
                  (item.type === "quiz" || item.type === "exam") &&
                  item.status === "no-submission" &&
                  typeof item.score === "number";

                return (
                  <Card key={`${item.type}-${item.id}`} className="overflow-hidden">
                    <CardContent className="space-y-4 p-4">
                      <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-center">
                        <div className="flex min-w-0 gap-4">
                          <div className={item.type === "assignment" ? "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600" : "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary"}>
                            {item.type === "assignment" ? (
                              <ClipboardList className="h-5 w-5" aria-hidden="true" />
                            ) : (
                              <FileQuestion className="h-5 w-5" aria-hidden="true" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <h2 className="text-base font-semibold text-foreground">{item.title}</h2>
                              {isCheatingNoSolution || item.status === "late" ? (
                                <span className="text-sm font-semibold text-destructive">
                                  {isCheatingNoSolution ? "No solution (cheating)" : statusLabel(item.status)}
                                </span>
                              ) : (
                                <Badge variant={item.status === "no-submission" ? "outline" : "secondary"}>
                                  {statusLabel(item.status)}
                                </Badge>
                              )}
                            </div>
                            <p className="mt-2 text-sm text-muted-foreground">{formatDate(item.submittedAt)}</p>
                          </div>
                        </div>
                        <div className="flex flex-col gap-3 sm:items-end">
                          {typeof item.score === "number" ? (
                            <ScoreDisplay score={item.score} maxScore={item.maxScore ?? 100} feedback={item.feedback} compact />
                          ) : item.feedback ? (
                            <p className="text-sm text-muted-foreground">Feedback: {item.feedback}</p>
                          ) : null}
                          {canReview ? (
                            <Button type="button" variant="outline" size="sm" onClick={() => toggleItemReview(item)}>
                              {isExpanded ? "Hide work" : "Review work"}
                            </Button>
                          ) : null}
                        </div>
                      </div>

                      {canReview && isExpanded ? (
                        <div className="space-y-4 rounded-xl border bg-secondary/20 p-4">
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                              <p className="text-sm font-semibold text-foreground">Submitted solution</p>
                              <p className="mt-1 text-sm text-muted-foreground">
                                Open the student&apos;s file, then adjust the grade and feedback if needed.
                              </p>
                            </div>
                            {item.files?.length ? (
                              <div className="flex flex-wrap gap-2">
                                {item.files.map((file) => (
                                  <Button
                                    key={file.id}
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => void handleOpenReportFile(item, file.id)}
                                  >
                                    {file.fileName}
                                  </Button>
                                ))}
                              </div>
                            ) : (
                              <p className="text-sm font-medium text-muted-foreground">No solution PDF is available.</p>
                            )}
                          </div>

                          <SubmissionGradePanel
                            editing={isEditingGrade}
                            feedback={draft.feedback}
                            max={item.maxScore ?? 100}
                            maxScoreValue={String(item.maxScore ?? 100)}
                            saving={savingItemId === item.id}
                            scoreLabel={item.type === "assignment" ? "Grade" : "Score"}
                            scorePlaceholder="Score"
                            scoreSummaryLabel={item.type === "assignment" ? "Grade" : "Score"}
                            scoreValue={draft.score}
                            onEdit={() =>
                              setEditingItemIds((current) => new Set(current).add(item.id))
                            }
                            onFeedbackChange={(value) => updateDraft(item.id, { feedback: value })}
                            onSave={() => void handleSaveGrade(item)}
                            onScoreChange={(value) => updateDraft(item.id, { score: value })}
                          />
                        </div>
                      ) : null}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}
