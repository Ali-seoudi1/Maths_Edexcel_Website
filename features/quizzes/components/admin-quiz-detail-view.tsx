"use client";

import { FileQuestion, Loader2 } from "lucide-react";
import { useEffect, useState, type ChangeEvent } from "react";

import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";

import {
  getAdminQuiz,
  listQuizSubmissions,
  openProtectedQuizSubmissionPdf,
  updateQuizSubmissionGrade,
} from "../services/quiz-service";
import type { Quiz, QuizSubmission } from "../types";
import { AdminQuizFormView } from "./admin-quiz-form-view";

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
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  if (minutes === 0) return `${remainingSeconds} sec late`;
  if (remainingSeconds === 0) return `${minutes} min late`;
  return `${minutes} min ${remainingSeconds} sec late`;
}

export function AdminQuizDetailView({ quizId }: { quizId: string }) {
  const { toast } = useToast();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [submissions, setSubmissions] = useState<QuizSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, { score: string; feedback: string }>>({});

  useEffect(() => {
    void Promise.all([getAdminQuiz(quizId), listQuizSubmissions(quizId)])
      .then(([quizResult, submissionsResult]) => {
        setQuiz(quizResult.quiz);
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
      })
      .catch((error) => {
        toast({
          title: "Could not load quiz details",
          description: error instanceof Error ? error.message : "Try again in a moment.",
          variant: "destructive",
        });
      })
      .finally(() => setLoading(false));
  }, [quizId, toast]);

  async function handleOpenSubmissionPdf(submissionId: string) {
    try {
      await openProtectedQuizSubmissionPdf(quizId, submissionId);
    } catch (error) {
      toast({
        title: "Could not open PDF",
        description: error instanceof Error ? error.message : "Try again in a moment.",
        variant: "destructive",
      });
    }
  }

  async function handleSave(submissionId: string) {
    const draft = drafts[submissionId];

    if (!draft) return;

    const rawScore = draft.score.trim();
    const parsedScore = rawScore === "" ? null : Number(rawScore);

    if (parsedScore !== null && (Number.isNaN(parsedScore) || parsedScore < 0)) {
      toast({
        title: "Invalid score",
        description: "Enter a score of 0 or higher.",
        variant: "destructive",
      });
      return;
    }

    try {
      setSavingId(submissionId);
      const result = await updateQuizSubmissionGrade(quizId, submissionId, {
        score: parsedScore,
        feedback: draft.feedback,
      });

      setSubmissions((current) =>
        current.map((submission) => (submission.id === submissionId ? result.submission : submission)),
      );
      toast({ title: "Grade saved", variant: "success" });
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

  if (!quiz) {
    return (
      <EmptyState
        title="Quiz not found"
        description="This quiz is not available for management."
        icon={<FileQuestion className="h-8 w-8" aria-hidden="true" />}
      />
    );
  }

  return (
    <div className="space-y-6">
      <Card className="shadow-soft">
        <CardContent className="space-y-4 p-5">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-semibold text-foreground">{quiz.title}</h2>
            <Badge variant={quiz.status === "active" ? "secondary" : "outline"}>{quiz.status}</Badge>
          </div>
          {quiz.description ? (
            <p className="text-sm leading-6 text-muted-foreground">{quiz.description}</p>
          ) : null}
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border bg-secondary/30 p-4">
              <p className="text-xs font-medium uppercase text-muted-foreground">Duration</p>
              <p className="mt-2 text-sm font-semibold text-foreground">{quiz.durationMinutes} minutes</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {quiz.pdfs.length} PDF{quiz.pdfs.length === 1 ? "" : "s"}
              </p>
            </div>
            <div className="rounded-lg border bg-secondary/30 p-4">
              <p className="text-xs font-medium uppercase text-muted-foreground">Published</p>
              <p className="mt-2 text-sm font-semibold text-foreground">{formatDate(quiz.publishedAt)}</p>
            </div>
            <div className="rounded-lg border bg-secondary/30 p-4">
              <p className="text-xs font-medium uppercase text-muted-foreground">Closes</p>
              <p className="mt-2 text-sm font-semibold text-foreground">{formatDate(quiz.expiresAt)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <AdminQuizFormView quiz={quiz} onSaved={setQuiz} />

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

            return (
              <Card key={submission.id} className="shadow-soft">
                <CardContent className="space-y-4 p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-base font-semibold text-foreground">{submission.studentName}</p>
                        {submission.late ? <Badge variant="destructive">Late</Badge> : <Badge variant="secondary">On time</Badge>}
                        {submission.graded ? <Badge variant="default">Graded</Badge> : null}
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Submitted {formatDate(submission.submittedAt)}
                        {submission.late ? ` · ${formatLateBy(submission.lateBySeconds)}` : ""}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">{submission.pdfFileName}</p>
                    </div>
                    <Button type="button" variant="outline" onClick={() => void handleOpenSubmissionPdf(submission.id)}>
                      Open PDF
                    </Button>
                  </div>

                  <div className="grid gap-4 md:grid-cols-[140px_1fr] md:items-start">
                    <label className="text-sm font-medium text-foreground">Score</label>
                    <Input
                      type="number"
                      min={0}
                      value={draft.score}
                      onChange={(event: ChangeEvent<HTMLInputElement>) =>
                        setDrafts((current) => ({
                          ...current,
                          [submission.id]: {
                            ...(current[submission.id] ?? { score: "", feedback: "" }),
                            score: event.target.value,
                          },
                        }))
                      }
                      placeholder="Score"
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-[140px_1fr] md:items-start">
                    <label className="text-sm font-medium text-foreground">Feedback</label>
                    <textarea
                      value={draft.feedback}
                      onChange={(event: ChangeEvent<HTMLTextAreaElement>) =>
                        setDrafts((current) => ({
                          ...current,
                          [submission.id]: {
                            ...(current[submission.id] ?? { score: "", feedback: "" }),
                            feedback: event.target.value,
                          },
                        }))
                      }
                      placeholder="Add feedback for the student"
                      rows={4}
                      className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    />
                  </div>

                  <div className="flex justify-end">
                    <Button
                      type="button"
                      onClick={() => void handleSave(submission.id)}
                      disabled={savingId === submission.id}
                    >
                      {savingId === submission.id ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                          Saving...
                        </>
                      ) : (
                        "Save grade"
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
