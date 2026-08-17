"use client";

import { FileQuestion, Pencil } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { EmptyState } from "@/components/shared/empty-state";
import { SubmissionGradePanel } from "@/components/shared/submission-grade-panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";

import {
  getAdminExam,
  listExamSubmissions,
  openProtectedExamSubmissionPdf,
  updateExamSubmissionGrade,
} from "../services/exam-service";
import type { Exam, ExamSubmission } from "../types";

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

function formatLateBy(seconds: number) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  if (hours > 0) return `${hours} hour${hours === 1 ? "" : "s"} ${minutes} minute${minutes === 1 ? "" : "s"} late`;
  if (minutes > 0) return `${minutes} minute${minutes === 1 ? "" : "s"} late`;
  return `${remainingSeconds} second${remainingSeconds === 1 ? "" : "s"} late`;
}

export function AdminExamDetailView({ examId }: { examId: string }) {
  const { toast } = useToast();
  const [exam, setExam] = useState<Exam | null>(null);
  const [submissions, setSubmissions] = useState<ExamSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, { score: string; feedback: string }>>({});
  const [correctedPdfs, setCorrectedPdfs] = useState<Record<string, File | null>>({});
  const [editingSubmissionIds, setEditingSubmissionIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    void Promise.all([getAdminExam(examId), listExamSubmissions(examId)])
      .then(([examResult, submissionsResult]) => {
        setExam(examResult.exam);
        setSubmissions(submissionsResult.submissions);
        setDrafts(
          Object.fromEntries(
            submissionsResult.submissions.map((submission) => [
              submission.id,
              {
                score: submission.score === null ? "" : String(submission.score),
                feedback: submission.feedback ?? "",
              },
            ]),
          ),
        );
        setEditingSubmissionIds(
          new Set(
            submissionsResult.submissions
              .filter((submission) => !submission.graded)
              .map((submission) => submission.id),
          ),
        );
      })
      .catch((error) => {
        toast({
          title: "Could not load exam details",
          description: error instanceof Error ? error.message : "Try again in a moment.",
          variant: "destructive",
        });
      })
      .finally(() => setLoading(false));
  }, [examId, toast]);

  async function handleOpenSubmissionPdf(submissionId: string) {
    try {
      await openProtectedExamSubmissionPdf(examId, submissionId);
    } catch (error) {
      toast({
        title: "Could not open PDF",
        description: error instanceof Error ? error.message : "Try again in a moment.",
        variant: "destructive",
      });
    }
  }

  async function handleSave(submissionId: string) {
    await saveSubmission(submissionId, false);
  }

  async function handleReturnFeedback(submissionId: string) {
    await saveSubmission(submissionId, true);
  }

  async function saveSubmission(submissionId: string, returnFeedback: boolean) {
    const draft = drafts[submissionId];

    if (!draft) return;

    const rawScore = draft.score.trim();
    const parsedScore = rawScore === "" ? null : Number(rawScore);
    const maxScore = exam?.maxScore ?? 100;

    if (parsedScore !== null && (Number.isNaN(parsedScore) || parsedScore < 0 || parsedScore > maxScore)) {
      toast({
        title: "Invalid score",
        description: "Enter a score between 0 and the total score.",
        variant: "destructive",
      });
      return;
    }

    try {
      setSavingId(submissionId);
      const result = await updateExamSubmissionGrade(examId, submissionId, {
        score: parsedScore,
        feedback: draft.feedback,
        returnFeedback,
      }, correctedPdfs[submissionId] ?? null);

      setSubmissions((current) =>
        current.map((submission) => (submission.id === submissionId ? result.submission : submission)),
      );
      setDrafts((current) => ({
        ...current,
        [submissionId]: {
          score: result.submission.score === null ? "" : String(result.submission.score),
          feedback: result.submission.feedback ?? "",
        },
      }));
      setCorrectedPdfs((current) => ({
        ...current,
        [submissionId]: null,
      }));
      setEditingSubmissionIds((current) => {
        const next = new Set(current);
        next.delete(submissionId);
        return next;
      });
      toast({ title: returnFeedback ? "Feedback returned" : "Grade saved", variant: "success" });
    } catch (error) {
      toast({
        title: "Grade update failed",
        description: error instanceof Error ? error.message : "Try again in a moment.",
        variant: "destructive",
      });
    } finally {
      setSavingId(null);
    }
  }

  if (loading) {
    return <Skeleton className="h-96 max-w-5xl" />;
  }

  if (!exam) {
    return (
      <EmptyState
        title="Exam not found"
        description="This exam is not available for management."
        icon={<FileQuestion className="h-8 w-8" aria-hidden="true" />}
      />
    );
  }

  return (
    <div className="space-y-6">
      <Card className="shadow-soft">
        <CardContent className="space-y-4 p-5">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-semibold text-foreground">{exam.title}</h2>
            <Badge variant={exam.status === "active" ? "secondary" : "outline"}>{exam.status}</Badge>
          </div>
          {exam.description ? (
            <p className="text-sm leading-6 text-muted-foreground">{exam.description}</p>
          ) : null}
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border bg-secondary/30 p-4">
              <p className="text-xs font-medium uppercase text-muted-foreground">Duration</p>
              <p className="mt-2 text-sm font-semibold text-foreground">{exam.durationMinutes} minutes</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {exam.pdfs.length} PDF{exam.pdfs.length === 1 ? "" : "s"}
              </p>
            </div>
            <div className="rounded-lg border bg-secondary/30 p-4">
              <p className="text-xs font-medium uppercase text-muted-foreground">Published</p>
              <p className="mt-2 text-sm font-semibold text-foreground">{formatDate(exam.publishedAt)}</p>
            </div>
            <div className="rounded-lg border bg-secondary/30 p-4">
              <p className="text-xs font-medium uppercase text-muted-foreground">Closes</p>
              <p className="mt-2 text-sm font-semibold text-foreground">{formatDate(exam.expiresAt)}</p>
            </div>
          </div>
          <div className="flex justify-end">
            {exam.status === "active" || exam.status === "closed" ? (
              <Button type="button" variant="outline" disabled>
                <Pencil className="h-4 w-4" aria-hidden="true" />
                Edit locked
              </Button>
            ) : (
              <Button asChild variant="outline">
                <Link href={`/admin/exams/${exam.id}/edit`}>
                  <Pencil className="h-4 w-4" aria-hidden="true" />
                  Edit exam
                </Link>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground">Student submissions</h3>
        {submissions.length === 0 ? (
          <EmptyState
            title="No submissions yet"
            description="Students will appear here after uploading answer PDFs."
            icon={<FileQuestion className="h-8 w-8" aria-hidden="true" />}
          />
        ) : (
          submissions.map((submission) => {
            const draft = drafts[submission.id] ?? { score: "", feedback: "" };
            const isEditingGrade = editingSubmissionIds.has(submission.id);

            return (
              <Card key={submission.id} className="shadow-soft">
                <CardContent className="space-y-4 p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-base font-semibold text-foreground">{submission.studentName}</p>
                        {submission.status === "cheating" ? (
                          <Badge variant="destructive">Cheating</Badge>
                        ) : submission.noSubmission ? (
                          <Badge variant="outline">No submission</Badge>
                        ) : submission.late ? (
                          <span className="text-sm font-semibold text-destructive">Late</span>
                        ) : (
                          <Badge variant="secondary">On time</Badge>
                        )}
                        {submission.graded && submission.status !== "cheating" ? <Badge variant="default">Graded</Badge> : null}
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {submission.status === "cheating"
                          ? `Cheating${submission.cheatedAt ? ` at ${formatDate(submission.cheatedAt)}` : ""}.`
                          : submission.noSubmission
                            ? "No PDF has been submitted."
                          : `Submitted ${formatDate(submission.submittedAt)}${
                              submission.late ? ` · ${formatLateBy(submission.lateBySeconds)}` : ""
                            }`}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">{submission.pdfFileName}</p>
                      {submission.correctedPdfFileName ? (
                        <p className="mt-1 text-xs text-muted-foreground">
                          Corrected paper: {submission.correctedPdfFileName}
                        </p>
                      ) : null}
                    </div>
                    {!submission.noSubmission ? (
                      <Button type="button" variant="outline" onClick={() => void handleOpenSubmissionPdf(submission.id)}>
                        Open PDF
                      </Button>
                    ) : null}
                  </div>

                  {!submission.noSubmission ? (
                    <div className="space-y-4">
                      {isEditingGrade ? (
                        <div className="grid gap-4 md:grid-cols-[140px_1fr] md:items-start">
                          <label className="text-sm font-medium text-foreground">
                            Corrected PDF <span className="text-muted-foreground">(optional)</span>
                          </label>
                          <div className="space-y-2">
                            <Input
                              type="file"
                              accept="application/pdf"
                              onChange={(event) =>
                                setCorrectedPdfs((current) => ({
                                  ...current,
                                  [submission.id]: event.target.files?.[0] ?? null,
                                }))
                              }
                            />
                            <p className="text-xs text-muted-foreground">
                              Optional. Add a corrected paper for this student, or save the score without one.
                            </p>
                          </div>
                        </div>
                      ) : null}
                      <SubmissionGradePanel
                        editing={isEditingGrade}
                        feedback={draft.feedback}
                        max={exam.maxScore}
                        maxScoreValue={String(exam.maxScore)}
                        saving={savingId === submission.id}
                        scoreLabel="Score"
                        scorePlaceholder="Score"
                        scoreSummaryLabel="Score"
                        scoreValue={draft.score}
                        saveLabel="Save score and corrected PDF"
                        onEdit={() =>
                          setEditingSubmissionIds((current) => new Set(current).add(submission.id))
                        }
                        onFeedbackChange={(value) =>
                          setDrafts((current) => ({
                            ...current,
                            [submission.id]: {
                              ...(current[submission.id] ?? { score: "", feedback: "" }),
                              feedback: value,
                            },
                          }))
                        }
                        onSave={() => void handleSave(submission.id)}
                        onReturnFeedback={() => void handleReturnFeedback(submission.id)}
                        feedbackReturned={submission.feedbackReturned}
                        onScoreChange={(value) =>
                          setDrafts((current) => ({
                            ...current,
                            [submission.id]: {
                              ...(current[submission.id] ?? { score: "", feedback: "" }),
                              score: value,
                            },
                          }))
                        }
                      />
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
