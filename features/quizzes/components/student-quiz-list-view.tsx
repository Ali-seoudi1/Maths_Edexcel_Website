"use client";

import { ChevronRight, Clock3, FileQuestion } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { EmptyState } from "@/components/shared/empty-state";
import { ScoreDisplay } from "@/components/shared/score-display";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";

import { listQuizzes } from "../services/quiz-service";
import type { Quiz, QuizAttempt, QuizSubmission } from "../types";

type QuizFilter = "all" | "submitted" | "unsubmitted";

function formatDate(value: string | null) {
  if (!value) return "Not set";

  return new Intl.DateTimeFormat("en", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function StudentQuizListView() {
  const { toast } = useToast();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [submissions, setSubmissions] = useState<QuizSubmission[]>([]);
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [filter, setFilter] = useState<QuizFilter>("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void listQuizzes()
      .then((result) => {
        setQuizzes(result.quizzes);
        setSubmissions(result.submissions);
        setAttempts(result.attempts);
      })
      .catch((error) => {
        toast({
          title: "Could not load quizzes",
          description: error instanceof Error ? error.message : "Try again in a moment.",
          variant: "destructive",
        });
      })
      .finally(() => setLoading(false));
  }, [toast]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-28 rounded-2xl" />
        <Skeleton className="h-28 rounded-2xl" />
        <Skeleton className="h-28 rounded-2xl" />
      </div>
    );
  }

  if (quizzes.length === 0) {
    return (
      <EmptyState
        title="No quizzes available"
        description="Your teacher has not published any quizzes yet."
        icon={<FileQuestion className="h-8 w-8" aria-hidden="true" />}
      />
    );
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-foreground">Your quizzes</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Open available quizzes and review finished results.
          </p>
        </div>
        <div className="inline-flex rounded-xl border bg-card p-1 shadow-sm">
          {[
            { label: "All", value: "all" },
            { label: "Submitted", value: "submitted" },
            { label: "Unsubmitted", value: "unsubmitted" },
          ].map((item) => (
            <Button
              key={item.value}
              type="button"
              variant={filter === item.value ? "default" : "ghost"}
              size="sm"
              className="rounded-lg"
              onClick={() => setFilter(item.value as QuizFilter)}
              showPendingOnPress={false}
            >
              {item.label}
            </Button>
          ))}
        </div>
      </div>
      {quizzes
        .filter((quiz) => {
          const submission = submissions.find((item) => item.quizId === quiz.id);
          const isSubmitted = Boolean(submission && !submission.noSubmission);

          if (filter === "submitted") return isSubmitted;
          if (filter === "unsubmitted") return !isSubmitted;
          return true;
        })
        .map((quiz) => {
        const submission = submissions.find((item) => item.quizId === quiz.id);
        const attempt = attempts.find((item) => item.quizId === quiz.id);
        const hasGrade = submission?.graded === true;
        const isFinishedForStudent = Boolean(submission);
        const isNoSubmission = submission?.noSubmission === true || (quiz.status === "closed" && !submission);
        const canSubmitLate = Boolean(isNoSubmission && attempt);
        const isClosedForStudent = quiz.status === "closed" || isFinishedForStudent;

        return (
          <Card
            key={quiz.id}
            className="overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-card"
          >
            <CardContent className="grid gap-4 p-4 sm:grid-cols-[1fr_auto] sm:items-center">
              <div className="flex min-w-0 gap-4">
                <div className={isFinishedForStudent ? "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600" : "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary"}>
                  <FileQuestion className="h-5 w-5" aria-hidden="true" />
                </div>
                <div className="min-w-0 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-base font-semibold text-foreground">{quiz.title}</h2>
                    <Badge variant={isClosedForStudent ? "outline" : "secondary"}>
                      {isFinishedForStudent ? "Finished" : quiz.status === "closed" ? "Closed" : "Active"}
                    </Badge>
                    {!submission?.noSubmission && isNoSubmission ? (
                      <Badge variant="outline">No submission</Badge>
                    ) : null}
                  </div>
                  {quiz.description ? (
                    <p className="max-w-3xl text-sm leading-6 text-muted-foreground">{quiz.description}</p>
                  ) : null}
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-medium text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5">
                      <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
                      {quiz.durationMinutes} minutes
                    </span>
                    <span>Due {formatDate(quiz.expiresAt)}</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-3 sm:items-end">
                {submission?.noSubmission ? (
                  <div className="text-right text-destructive">
                    <p className="text-sm font-bold">0/{quiz.maxScore}</p>
                    <p className="text-xs font-semibold">No solution (cheating)</p>
                  </div>
                ) : hasGrade ? (
                  <ScoreDisplay score={submission.score ?? 0} maxScore={quiz.maxScore} compact />
                ) : (
                  <p className="text-sm font-semibold text-muted-foreground">Not graded</p>
                )}
                {isFinishedForStudent ? (
                  <Button type="button" variant="outline" className="w-full sm:w-auto" disabled>
                    Closed
                  </Button>
                ) : quiz.status === "closed" && !canSubmitLate ? (
                  <Button type="button" variant="outline" className="w-full sm:w-auto" disabled>
                    Closed
                  </Button>
                ) : (
                  <Button asChild className="w-full sm:w-auto">
                    <Link href={`/quizzes/${quiz.id}`}>
                      {canSubmitLate ? "Submit late" : "Start quiz"}
                      <ChevronRight className="h-4 w-4" aria-hidden="true" />
                    </Link>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
      {quizzes.filter((quiz) => {
        const submission = submissions.find((item) => item.quizId === quiz.id);
        const isSubmitted = Boolean(submission && !submission.noSubmission);

        if (filter === "submitted") return isSubmitted;
        if (filter === "unsubmitted") return !isSubmitted;
        return true;
      }).length === 0 ? (
        <EmptyState
          title={filter === "submitted" ? "No submitted quizzes" : "No unsubmitted quizzes"}
          description="Switch filters to view the rest of your quizzes."
          icon={<FileQuestion className="h-8 w-8" aria-hidden="true" />}
        />
      ) : null}
    </section>
  );
}
